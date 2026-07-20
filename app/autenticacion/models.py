from django.conf import settings
from django.db import models
from django.utils import timezone


class CodigoOTP(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="codigos_otp",
    )

    codigo_hash = models.CharField(
        max_length=128,
    )

    expira_en = models.DateTimeField()

    usado = models.BooleanField(
        default=False,
    )

    intentos = models.PositiveSmallIntegerField(
        default=0,
    )

    creado_en = models.DateTimeField(
        auto_now_add=True,
    )

    actualizado_en = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "codigos_otp"
        ordering = ["-creado_en"]
        verbose_name = "código OTP"
        verbose_name_plural = "códigos OTP"

        indexes = [
            models.Index(
                fields=["usuario", "usado"],
                name="otp_usuario_usado_idx",
            ),
            models.Index(
                fields=["expira_en"],
                name="otp_expiracion_idx",
            ),
        ]

    def __str__(self):
        return (
            f"OTP de {self.usuario.email} "
            f"- {self.creado_en:%d/%m/%Y %H:%M}"
        )

    @property
    def esta_vigente(self):
        return (
            not self.usado
            and self.expira_en > timezone.now()
        )
