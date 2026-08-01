from django.conf import settings
from django.db import models

from vuelos.models import Vuelo, Asiento


class Reserva(models.Model):

    class Estado(models.TextChoices):
        CONFIRMADA = "CONFIRMADA", "Confirmada"
        CANCELADA = "CANCELADA", "Cancelada"

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="reservas",
    )

    vuelo = models.ForeignKey(
        Vuelo,
        on_delete=models.PROTECT,
        related_name="reservas",
    )

    asiento = models.ForeignKey(
        Asiento,
        on_delete=models.PROTECT,
        related_name="reservas",
    )

    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.CONFIRMADA,
    )

    creado_en = models.DateTimeField(
        auto_now_add=True,
    )

    actualizado_en = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "reservas"
        ordering = ["-creado_en"]

    def __str__(self):
        return (
            f"Reserva #{self.pk} - "
            f"{self.usuario} - "
            f"Vuelo {self.vuelo_id} - "
            f"Asiento {self.asiento.numero}"
        )