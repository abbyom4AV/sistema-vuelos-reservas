from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError

from pagos.models import Pago
from reservas.models import Reserva
from reservas.services import cancelar_reserva, crear_reserva
from usuarios.models import Usuario
from vuelos.models import Asiento, Vuelo


class Command(BaseCommand):
    help = (
        "Crea reservas y pagos de demostración idempotentes "
        "para visualizar el panel administrativo."
    )

    escenarios = (
        {
            "vuelo": 0,
            "asiento": 1,
            "reserva": Reserva.Estado.PENDIENTE_PAGO,
            "pago": None,
            "metodo": None,
        },
        {
            "vuelo": 1,
            "asiento": 1,
            "reserva": Reserva.Estado.PENDIENTE_PAGO,
            "pago": Pago.Estado.PENDIENTE,
            "metodo": "TARJETA",
        },
        {
            "vuelo": 2,
            "asiento": 1,
            "reserva": Reserva.Estado.PENDIENTE_PAGO,
            "pago": Pago.Estado.PENDIENTE_VERIFICACION,
            "metodo": "PAYPAL",
        },
        {
            "vuelo": 0,
            "asiento": 2,
            "reserva": Reserva.Estado.CONFIRMADA,
            "pago": Pago.Estado.APROBADO,
            "metodo": "TARJETA",
        },
        {
            "vuelo": 1,
            "asiento": 2,
            "reserva": Reserva.Estado.CANCELADA,
            "pago": Pago.Estado.RECHAZADO,
            "metodo": "PAYPAL",
        },
        {
            "vuelo": 2,
            "asiento": 2,
            "reserva": Reserva.Estado.CONFIRMADA,
            "pago": Pago.Estado.APROBADO,
            "metodo": "TARJETA",
        },
        {
            "vuelo": 0,
            "asiento": 3,
            "reserva": Reserva.Estado.PENDIENTE_PAGO,
            "pago": None,
            "metodo": None,
        },
        {
            "vuelo": 1,
            "asiento": 3,
            "reserva": Reserva.Estado.PENDIENTE_PAGO,
            "pago": Pago.Estado.PENDIENTE_VERIFICACION,
            "metodo": "PAYPAL",
        },
        {
            "vuelo": 2,
            "asiento": 3,
            "reserva": Reserva.Estado.PENDIENTE_PAGO,
            "pago": Pago.Estado.PENDIENTE,
            "metodo": "TARJETA",
        },
        {
            "vuelo": 0,
            "asiento": 4,
            "reserva": Reserva.Estado.CONFIRMADA,
            "pago": Pago.Estado.APROBADO,
            "metodo": "PAYPAL",
        },
        {
            "vuelo": 1,
            "asiento": 4,
            "reserva": Reserva.Estado.CANCELADA,
            "pago": Pago.Estado.RECHAZADO,
            "metodo": "TARJETA",
        },
        {
            "vuelo": 2,
            "asiento": 4,
            "reserva": Reserva.Estado.PENDIENTE_PAGO,
            "pago": None,
            "metodo": None,
        },
        {
            "vuelo": 0,
            "asiento": 5,
            "reserva": Reserva.Estado.PENDIENTE_PAGO,
            "pago": Pago.Estado.PENDIENTE,
            "metodo": "TARJETA",
        },
        {
            "vuelo": 1,
            "asiento": 5,
            "reserva": Reserva.Estado.CONFIRMADA,
            "pago": Pago.Estado.APROBADO,
            "metodo": "PAYPAL",
        },
        {
            "vuelo": 2,
            "asiento": 5,
            "reserva": Reserva.Estado.CANCELADA,
            "pago": Pago.Estado.RECHAZADO,
            "metodo": "TARJETA",
        },
    )

    def handle(self, *args, **options):
        clientes = list(
            Usuario.objects.filter(
                rol__nombre="CLIENTE",
                is_active=True,
            ).order_by("id")
        )
        vuelos = list(
            Vuelo.objects.filter(
                estado__in=[
                    Vuelo.Estado.ACTIVO,
                    Vuelo.Estado.PROGRAMADO,
                ],
            )
            .select_related("ruta")
            .order_by("fecha", "hora")
        )

        if not clientes:
            raise CommandError(
                "No hay clientes activos. Ejecute primero manage.py seed_base."
            )

        if len(vuelos) < 3:
            raise CommandError(
                "Se requieren al menos tres vuelos activos o programados. "
                "Ejecute primero la semilla operativa."
            )

        creadas = 0
        verificadas = 0

        for indice, escenario in enumerate(self.escenarios):
            cliente = clientes[indice % len(clientes)]
            vuelo = vuelos[escenario["vuelo"]]
            asiento = Asiento.objects.get(
                vuelo=vuelo,
                numero=escenario["asiento"],
            )

            reserva = (
                Reserva.objects.filter(
                    usuario=cliente,
                    vuelo=vuelo,
                    asiento=asiento,
                ).first()
            )

            if reserva is None:
                if asiento.estado != Asiento.Estado.DISPONIBLE:
                    raise CommandError(
                        f"El asiento {asiento.codigo} del vuelo {vuelo.id} "
                        "no está disponible para crear la semilla."
                    )

                reserva = crear_reserva(
                    usuario=cliente,
                    vuelo_id=vuelo.id,
                    asiento_id=asiento.id,
                )
                creadas += 1

            self._aplicar_escenario(reserva, escenario)
            verificadas += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"{verificadas} reservas de demostración verificadas "
                f"({creadas} creadas)."
            )
        )

    @staticmethod
    def _aplicar_escenario(reserva, escenario):
        estado_reserva = escenario["reserva"]
        estado_pago = escenario["pago"]

        if estado_reserva == Reserva.Estado.CANCELADA:
            if reserva.estado != Reserva.Estado.CANCELADA:
                cancelar_reserva(
                    reserva=reserva,
                    usuario=reserva.usuario,
                )
            Pago.objects.update_or_create(
                reserva=reserva,
                defaults={
                    "estado": estado_pago,
                    "monto": reserva.vuelo.precio_base,
                    "metodo": escenario["metodo"],
                    "cuenta": "DEMO-PAYPAL-001",
                },
            )
            return

        if reserva.estado == Reserva.Estado.CANCELADA:
            return

        if estado_reserva == Reserva.Estado.CONFIRMADA:
            Reserva.objects.filter(pk=reserva.pk).update(
                estado=Reserva.Estado.CONFIRMADA,
            )
        else:
            Reserva.objects.filter(pk=reserva.pk).update(
                estado=Reserva.Estado.PENDIENTE_PAGO,
            )

        if estado_pago is None:
            Pago.objects.filter(reserva=reserva).delete()
            return

        Pago.objects.update_or_create(
            reserva=reserva,
            defaults={
                "estado": estado_pago,
                "monto": Decimal(reserva.vuelo.precio_base),
                "metodo": escenario["metodo"],
                "cuenta": "DEMO-TARJETA-001",
            },
        )
