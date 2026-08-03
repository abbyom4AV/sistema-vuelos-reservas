from django.db import transaction
from reservas.models import Reserva
from vuelos.models import Asiento
from notificaciones.services import crear_notificacion
from notificaciones.models import Notificacion
from auditoria.services import registrar_evento
from auditoria.models import Bitacora
from .models import Pago

@transaction.atomic
def simular_pago(*, reserva, resultado, monto, usuario, request=None):
    reserva = Reserva.objects.select_for_update().select_related("asiento", "vuelo").get(pk=reserva.pk)

    if reserva.estado != Reserva.Estado.PENDIENTE_PAGO:
        raise ValueError("Esta reserva no está pendiente de pago.")

    pago = Pago.objects.create(
        reserva=reserva,
        estado=Pago.Estado.APROBADO if resultado == "APROBADO" else Pago.Estado.RECHAZADO,
        monto=monto,
    )

    if resultado == "APROBADO":
        reserva.estado = Reserva.Estado.CONFIRMADA
        reserva.save(update_fields=["estado", "actualizado_en"])
        mensaje = "Tu pago fue aprobado y la reserva quedó confirmada."
    else:
        reserva.estado = Reserva.Estado.CANCELADA
        reserva.save(update_fields=["estado", "actualizado_en"])
        asiento = reserva.asiento
        asiento.estado = Asiento.Estado.DISPONIBLE
        asiento.save(update_fields=["estado", "actualizado_en"])
        vuelo = reserva.vuelo
        vuelo.cupos_disponibles += 1
        vuelo.save(update_fields=["cupos_disponibles", "actualizado_en"])
        mensaje = "Tu pago fue rechazado y la reserva no quedó confirmada."

    crear_notificacion(usuario=usuario, tipo=Notificacion.Tipo.PAGO, titulo="Resultado de pago", mensaje=mensaje)

    if request:
        registrar_evento(
            request=request, usuario=usuario, accion="SIMULAR_PAGO",
            entidad="Pago", entidad_id=pago.pk,
            resultado=Bitacora.Resultado.EXITO, detalle=mensaje,
        )

    return pago