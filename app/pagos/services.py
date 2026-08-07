import secrets

from django.contrib.auth.hashers import check_password, make_password
from django.db import transaction

from reservas.models import Reserva
from vuelos.models import Asiento
from notificaciones.services import crear_notificacion
from notificaciones.models import Notificacion
from auditoria.services import registrar_evento
from auditoria.models import Bitacora

from .cuentas_prueba import obtener_saldo
from .models import Pago


@transaction.atomic
def iniciar_pago(*, reserva, metodo, cuenta, monto, usuario, request=None):
    """
    Valida la cuenta y su saldo.

    - Si el saldo NO alcanza: rechaza el pago
      de inmediato, cancela la reserva y libera
      el asiento. No se genera código.

    - Si el saldo alcanza: deja el pago en
      PENDIENTE_VERIFICACION y genera un código
      de 6 dígitos que se "envía" al correo del
      usuario (simulado). El código se guarda
      hasheado, igual que el OTP de login.

    Devuelve una tupla (pago, codigo_plano).
    codigo_plano es None si el pago fue rechazado.
    """

    reserva = (
        Reserva.objects
        .select_for_update()
        .select_related("asiento", "vuelo")
        .get(pk=reserva.pk)
    )

    if reserva.estado != Reserva.Estado.PENDIENTE_PAGO:
        raise ValueError("Esta reserva no está pendiente de pago.")

    saldo = obtener_saldo(metodo, cuenta)

    if saldo is None:
        raise ValueError(
            "La cuenta ingresada no es válida para el método seleccionado."
        )

    if float(saldo) < float(monto):

        pago = Pago.objects.create(
            reserva=reserva,
            estado=Pago.Estado.RECHAZADO,
            monto=monto,
            metodo=metodo,
            cuenta=cuenta,
        )

        reserva.estado = Reserva.Estado.CANCELADA
        reserva.save(update_fields=["estado", "actualizado_en"])

        asiento = reserva.asiento
        asiento.estado = Asiento.Estado.DISPONIBLE
        asiento.save(update_fields=["estado", "actualizado_en"])

        vuelo = reserva.vuelo
        vuelo.cupos_disponibles += 1
        vuelo.save(update_fields=["cupos_disponibles", "actualizado_en"])

        mensaje = (
            "El saldo de la cuenta no cubre el monto de la reserva. "
            "El pago fue rechazado y la reserva no quedó confirmada."
        )

        crear_notificacion(
            usuario=usuario,
            tipo=Notificacion.Tipo.PAGO,
            titulo="Pago rechazado",
            mensaje=mensaje,
        )

        if request:
            registrar_evento(
                request=request,
                usuario=usuario,
                accion="INICIAR_PAGO",
                entidad="Pago",
                entidad_id=pago.pk,
                resultado=Bitacora.Resultado.DENEGADO,
                detalle=mensaje,
            )

        return pago, None

    codigo = f"{secrets.randbelow(1000000):06d}"

    pago = Pago.objects.create(
        reserva=reserva,
        estado=Pago.Estado.PENDIENTE_VERIFICACION,
        monto=monto,
        metodo=metodo,
        cuenta=cuenta,
        codigo_verificacion=make_password(codigo),
    )

    mensaje = (
        "Se generó un código de verificación para confirmar tu pago. "
        "Revisa tu correo (simulado)."
    )

    crear_notificacion(
        usuario=usuario,
        tipo=Notificacion.Tipo.PAGO,
        titulo="Código de verificación de pago",
        mensaje=mensaje,
    )

    if request:
        registrar_evento(
            request=request,
            usuario=usuario,
            accion="INICIAR_PAGO",
            entidad="Pago",
            entidad_id=pago.pk,
            resultado=Bitacora.Resultado.EXITO,
            detalle="Saldo suficiente. Código de verificación generado.",
        )

    return pago, codigo


@transaction.atomic
def verificar_pago(*, pago, codigo, usuario, request=None):
    """
    Confirma el código de verificación.
    Si es correcto, aprueba el pago y confirma
    la reserva. Si no, cuenta el intento fallido.
    """

    pago = (
        Pago.objects
        .select_for_update()
        .select_related("reserva", "reserva__asiento", "reserva__vuelo")
        .get(pk=pago.pk)
    )

    if pago.estado != Pago.Estado.PENDIENTE_VERIFICACION:
        raise ValueError(
            "Este pago no está pendiente de verificación."
        )

    if pago.intentos_verificacion >= 3:
        raise ValueError(
            "Se agotaron los intentos de verificación para este pago."
        )

    if not check_password(codigo, pago.codigo_verificacion):

        pago.intentos_verificacion += 1
        pago.save(update_fields=["intentos_verificacion"])

        if request:
            registrar_evento(
                request=request,
                usuario=usuario,
                accion="VERIFICAR_PAGO",
                entidad="Pago",
                entidad_id=pago.pk,
                resultado=Bitacora.Resultado.DENEGADO,
                detalle="Código de verificación incorrecto.",
            )

        raise ValueError("El código ingresado es incorrecto.")

    pago.estado = Pago.Estado.APROBADO
    pago.save(update_fields=["estado", "actualizado_en"])

    reserva = pago.reserva
    reserva.estado = Reserva.Estado.CONFIRMADA
    reserva.save(update_fields=["estado", "actualizado_en"])

    mensaje = "Tu pago fue verificado y la reserva quedó confirmada."

    crear_notificacion(
        usuario=usuario,
        tipo=Notificacion.Tipo.PAGO,
        titulo="Pago confirmado",
        mensaje=mensaje,
    )

    if request:
        registrar_evento(
            request=request,
            usuario=usuario,
            accion="VERIFICAR_PAGO",
            entidad="Pago",
            entidad_id=pago.pk,
            resultado=Bitacora.Resultado.EXITO,
            detalle=mensaje,
        )

    return pago