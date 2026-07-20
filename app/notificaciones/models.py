from django.conf import settings
from django.db import models
from django.utils import timezone


class Notificacion(models.Model):
    class Tipo(models.TextChoices):
        SEGURIDAD = "SEGURIDAD", "Seguridad"
        RESERVA = "RESERVA", "Reserva"
        PAGO = "PAGO", "Pago"
        VUELO = "VUELO", "Vuelo"
        SISTEMA = "SISTEMA", "Sistema"

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notificaciones",
    )

    tipo = models.CharField(
        max_length=20,
        choices=Tipo.choices,
        default=Tipo.SISTEMA,
    )

    titulo = models.CharField(
        max_length=150,
    )

    mensaje = models.TextField()

    leida = models.BooleanField(
        default=False,
    )

    leida_en = models.DateTimeField(
        null=True,
        blank=True,
    )

    creado_en = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "notificaciones"
        ordering = ["-creado_en"]
        verbose_name = "notificación"
        verbose_name_plural = "notificaciones"

        indexes = [
            models.Index(
                fields=["usuario", "leida"],
                name="notif_usuario_leida_idx",
            ),
            models.Index(
                fields=["tipo"],
                name="notif_tipo_idx",
            ),
        ]

    def __str__(self):
        return f"{self.titulo} - {self.usuario.email}"

    def marcar_como_leida(self):
        if not self.leida:
            self.leida = True
            self.leida_en = timezone.now()

            self.save(
                update_fields=[
                    "leida",
                    "leida_en",
                ]
            )
