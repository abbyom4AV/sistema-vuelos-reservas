from django.db import transaction

from auditoria.models import Bitacora
from auditoria.services import registrar_evento
from notificaciones.models import Notificacion
from notificaciones.services import crear_notificacion

from reservas.models import Reserva
from .models import Asiento, Vuelo


@transaction.atomic
def generar_asientos(vuelo, request=None, usuario=None):
    capacidad = vuelo.aeronave.capacidad

    if capacidad < 1 or capacidad > 150:
        raise ValueError(
            "La capacidad de la aeronave debe estar entre 1 y 150."
        )

    # No destruir asientos si el vuelo ya tiene reservas confirmadas.
    if Reserva.objects.filter(
        vuelo=vuelo,
        estado=Reserva.Estado.CONFIRMADA,
    ).exists():
        return vuelo

    Asiento.objects.filter(vuelo=vuelo).delete()

    Asiento.objects.bulk_create(
        [
            Asiento(
                vuelo=vuelo,
                numero=numero,
                estado=Asiento.Estado.DISPONIBLE,
            )
            for numero in range(1, capacidad + 1)
        ]
    )

    vuelo.cupos_disponibles = capacidad
    vuelo.save(
        update_fields=["cupos_disponibles", "actualizado_en"]
    )

    if request and usuario:
        registrar_evento(
            request=request,
            usuario=usuario,
            accion="GENERAR_ASIENTOS",
            entidad="Vuelo",
            entidad_id=vuelo.pk,
            resultado=Bitacora.Resultado.EXITO,
            detalle=(
                f"Se generaron {capacidad} asientos "
                f"para el vuelo {vuelo.pk}."
            ),
        )

    return vuelo


@transaction.atomic
def cancelar_vuelo(vuelo, request=None, usuario=None):
    vuelo = (
        Vuelo.objects
        .select_for_update()
        .get(pk=vuelo.pk)
    )

    reservas = list(
        Reserva.objects
        .select_for_update()
        .select_related("usuario", "asiento")
        .filter(
            vuelo=vuelo,
            estado=Reserva.Estado.CONFIRMADA,
        )
    )

    vuelo.estado = Vuelo.Estado.CANCELADO
    vuelo.cupos_disponibles = 0
    vuelo.save(
        update_fields=[
            "estado",
            "cupos_disponibles",
            "actualizado_en",
        ]
    )

    for reserva in reservas:
        reserva.estado = Reserva.Estado.CANCELADA
        reserva.save(
            update_fields=["estado", "actualizado_en"]
        )

        asiento = reserva.asiento
        if asiento.estado == Asiento.Estado.RESERVADO:
            asiento.estado = Asiento.Estado.DISPONIBLE
            asiento.save(
                update_fields=["estado", "actualizado_en"]
            )

        crear_notificacion(
            usuario=reserva.usuario,
            tipo=Notificacion.Tipo.VUELO,
            titulo="Vuelo cancelado",
            mensaje=(
                f"El vuelo {vuelo.pk} fue cancelado "
                "administrativamente. Tu reserva asociada "
                "también fue cancelada."
            ),
        )

    if request and usuario:
        registrar_evento(
            request=request,
            usuario=usuario,
            accion="CANCELAR_VUELO",
            entidad="Vuelo",
            entidad_id=vuelo.pk,
            resultado=Bitacora.Resultado.EXITO,
            detalle=(
                f"Se canceló administrativamente el vuelo "
                f"{vuelo.pk}. Reservas afectadas: {len(reservas)}."
            ),
        )

    return vuelo
