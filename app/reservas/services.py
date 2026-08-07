from django.db import transaction

from auditoria.models import Bitacora
from auditoria.services import registrar_evento
from notificaciones.models import Notificacion
from notificaciones.services import crear_notificacion

from vuelos.models import Asiento, Vuelo

from .models import Reserva


@transaction.atomic
def crear_reserva(
    *,
    usuario,
    vuelo_id,
    asiento_id,
    request=None,
):
    vuelo = (
        Vuelo.objects
        .select_for_update()
        .select_related(
            "ruta",
            "aeronave",
        )
        .get(
            pk=vuelo_id
        )
    )

    if vuelo.estado not in [
        Vuelo.Estado.PROGRAMADO,
        Vuelo.Estado.ACTIVO,
    ]:
        raise ValueError(
            "El vuelo no está disponible "
            "para realizar reservas."
        )

    if vuelo.cupos_disponibles <= 0:
        raise ValueError(
            "El vuelo no tiene cupos disponibles."
        )

    asiento = (
        Asiento.objects
        .select_for_update()
        .get(
            pk=asiento_id,
            vuelo=vuelo,
        )
    )

    if asiento.estado != Asiento.Estado.DISPONIBLE:
        raise ValueError(
            "El asiento seleccionado "
            "no está disponible."
        )

    reserva_existente = (
        Reserva.objects
        .filter(
            vuelo=vuelo,
            asiento=asiento,
            estado=Reserva.Estado.CONFIRMADA,
        )
        .exists()
    )

    if reserva_existente:
        raise ValueError(
            "El asiento ya tiene una "
            "reserva confirmada."
        )

    reserva = Reserva.objects.create(
        usuario=usuario,
        vuelo=vuelo,
        asiento=asiento,
        estado=Reserva.Estado.PENDIENTE_PAGO
    )
    reserva.codigo = f"RES-{reserva.pk:06d}"

    reserva.save(
        update_fields=["codigo"]
    )

    asiento.estado = Asiento.Estado.RESERVADO

    asiento.save(
        update_fields=[
            "estado",
            "actualizado_en",
        ]
    )

    vuelo.cupos_disponibles -= 1

    vuelo.save(
        update_fields=[
            "cupos_disponibles",
            "actualizado_en",
        ]
    )

    crear_notificacion(
        usuario=usuario,
        tipo=Notificacion.Tipo.RESERVA,
        titulo="Reserva creada",
        mensaje=(
            f"Tu reserva para el vuelo {vuelo.pk}, "
            f"asiento {asiento.codigo}, fue creada correctamente."
        ),
    )

    if request:
        registrar_evento(
            request=request,
            usuario=usuario,
            accion="CREAR_RESERVA",
            entidad="Reserva",
            entidad_id=reserva.pk,
            resultado=Bitacora.Resultado.EXITO,
            detalle=(
                f"Se creó la reserva "
                f"{reserva.pk} para el vuelo "
                f"{vuelo.pk}, asiento "
                f"{asiento.numero}."
            ),
        )

    return reserva


@transaction.atomic
def cancelar_reserva(
    *,
    reserva,
    usuario,
    request=None,
):
    reserva = (
        Reserva.objects
        .select_for_update()
        .select_related(
            "vuelo",
            "asiento",
        )
        .get(
            pk=reserva.pk
        )
    )

    if reserva.usuario_id != usuario.id:
        raise ValueError(
            "No tienes permiso para "
            "cancelar esta reserva."
        )

    if reserva.estado == Reserva.Estado.CANCELADA:
        raise ValueError(
            "La reserva ya se encuentra "
            "cancelada."
        )

    asiento = (
        Asiento.objects
        .select_for_update()
        .get(
            pk=reserva.asiento_id
        )
    )

    vuelo = (
        Vuelo.objects
        .select_for_update()
        .get(
            pk=reserva.vuelo_id
        )
    )

    reserva.estado = Reserva.Estado.CANCELADA

    reserva.save(
        update_fields=[
            "estado",
            "actualizado_en",
        ]
    )

    if asiento.estado == Asiento.Estado.RESERVADO:
        asiento.estado = Asiento.Estado.DISPONIBLE

        asiento.save(
            update_fields=[
                "estado",
                "actualizado_en",
            ]
        )

        vuelo.cupos_disponibles += 1

        vuelo.save(
            update_fields=[
                "cupos_disponibles",
                "actualizado_en",
            ]
        )

    crear_notificacion(
        usuario=usuario,
        tipo=Notificacion.Tipo.RESERVA,
        titulo="Reserva cancelada",
        mensaje=(
            f"La reserva {reserva.pk} fue cancelada "
            "y el asiento quedó disponible nuevamente."
        ),
    )

    if request:
        registrar_evento(
            request=request,
            usuario=usuario,
            accion="CANCELAR_RESERVA",
            entidad="Reserva",
            entidad_id=reserva.pk,
            resultado=Bitacora.Resultado.EXITO,
            detalle=(
                f"Se canceló la reserva "
                f"{reserva.pk}."
            ),
        )

    reserva = (
        Reserva.objects
        .select_related("vuelo", "vuelo__ruta", "vuelo__aeronave", "asiento")
        .get(pk=reserva.pk)
    )

    return reserva