from datetime import timedelta
import secrets

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.db import transaction
from django.utils import timezone

from .models import CodigoOTP


class ErrorOTP(Exception):
    """Error controlado durante la generación o validación del OTP."""

    def __init__(self, mensaje, codigo_error):
        super().__init__(mensaje)
        self.mensaje = mensaje
        self.codigo_error = codigo_error


def generar_codigo_otp(usuario):
    """
    Genera un código OTP de seis dígitos.

    """

    codigo = f"{secrets.randbelow(1_000_000):06d}"

    minutos_vigencia = getattr(
        settings,
        "OTP_EXPIRATION_MINUTES",
        5,
    )

    expira_en = timezone.now() + timedelta(
        minutes=minutos_vigencia
    )

    with transaction.atomic():
        # Invalida códigos anteriores que todavía no se hayan utilizado.
        CodigoOTP.objects.filter(
            usuario=usuario,
            usado=False,
        ).update(
            usado=True,
        )

        registro_otp = CodigoOTP.objects.create(
            usuario=usuario,
            codigo_hash=make_password(codigo),
            expira_en=expira_en,
        )

    return registro_otp, codigo


def validar_codigo_otp(usuario, codigo):
    """
    Valida el código OTP más reciente del usuario.

    Controla vigencia, cantidad de intentos, utilización
    previa y coincidencia con el hash almacenado.
    """

    maximo_intentos = getattr(
        settings,
        "OTP_MAX_ATTEMPTS",
        3,
    )

    with transaction.atomic():
        registro_otp = (
            CodigoOTP.objects
            .select_for_update()
            .filter(
                usuario=usuario,
                usado=False,
            )
            .order_by("-creado_en")
            .first()
        )

        if registro_otp is None:
            raise ErrorOTP(
                "No existe un código OTP pendiente para este usuario.",
                "otp_no_encontrado",
            )

        if registro_otp.expira_en <= timezone.now():
            registro_otp.usado = True
            registro_otp.save(
                update_fields=[
                    "usado",
                    "actualizado_en",
                ]
            )

            raise ErrorOTP(
                "El código OTP ha expirado.",
                "otp_expirado",
            )

        if registro_otp.intentos >= maximo_intentos:
            registro_otp.usado = True
            registro_otp.save(
                update_fields=[
                    "usado",
                    "actualizado_en",
                ]
            )

            raise ErrorOTP(
                "El código OTP superó el máximo de intentos.",
                "otp_bloqueado",
            )

        if not check_password(
            codigo,
            registro_otp.codigo_hash,
        ):
            registro_otp.intentos += 1

            if registro_otp.intentos >= maximo_intentos:
                registro_otp.usado = True

            registro_otp.save(
                update_fields=[
                    "intentos",
                    "usado",
                    "actualizado_en",
                ]
            )

            if registro_otp.usado:
                raise ErrorOTP(
                    "El código es incorrecto y se alcanzó "
                    "el máximo de intentos.",
                    "otp_bloqueado",
                )

            intentos_restantes = (
                maximo_intentos - registro_otp.intentos
            )

            raise ErrorOTP(
                (
                    "El código OTP es incorrecto. "
                    f"Intentos restantes: {intentos_restantes}."
                ),
                "otp_incorrecto",
            )

        registro_otp.usado = True
        registro_otp.save(
            update_fields=[
                "usado",
                "actualizado_en",
            ]
        )

    return registro_otp