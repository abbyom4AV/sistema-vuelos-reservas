from django.conf import settings
from django.db import models


class Bitacora(models.Model):
    class Resultado(models.TextChoices):
        EXITO = "EXITO", "Éxito"
        ERROR = "ERROR", "Error"
        DENEGADO = "DENEGADO", "Denegado"

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="eventos_bitacora",
        null=True,
        blank=True,
    )

    accion = models.CharField(
        max_length=100,
    )

    entidad = models.CharField(
        max_length=100,
        blank=True,
    )

    entidad_id = models.CharField(
        max_length=100,
        blank=True,
    )

    resultado = models.CharField(
        max_length=20,
        choices=Resultado.choices,
        default=Resultado.EXITO,
    )

    detalle = models.TextField(
        blank=True,
    )

    metodo_http = models.CharField(
        max_length=10,
        blank=True,
    )

    endpoint = models.CharField(
        max_length=255,
        blank=True,
    )

    direccion_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    creado_en = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "bitacora"
        ordering = ["-creado_en"]
        verbose_name = "evento de bitácora"
        verbose_name_plural = "bitácora"

        indexes = [
            models.Index(
                fields=["usuario", "creado_en"],
                name="bitacora_usuario_fecha_idx",
            ),
            models.Index(
                fields=["accion"],
                name="bitacora_accion_idx",
            ),
            models.Index(
                fields=["resultado"],
                name="bitacora_resultado_idx",
            ),
        ]

    def __str__(self):
        usuario = (
            self.usuario.email
            if self.usuario
            else "Usuario no identificado"
        )

        return (
            f"{self.accion} - {usuario} - "
            f"{self.resultado}"
        )
