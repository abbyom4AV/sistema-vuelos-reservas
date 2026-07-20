from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import update_last_login
from django.contrib.auth.password_validation import validate_password
from django.core import signing
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.signing import BadSignature, SignatureExpired
from django.db import transaction

from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from auditoria.models import Bitacora
from auditoria.services import registrar_evento
from notificaciones.models import Notificacion
from notificaciones.services import crear_notificacion

from .serializers import (
    CambiarContrasenaSerializer,
    LoginSerializer,
    LogoutSerializer,
    VerificarOTPSerializer,
)
from .services import (
    ErrorOTP,
    generar_codigo_otp,
    validar_codigo_otp,
)


Usuario = get_user_model()

OTP_SIGNING_SALT = "autenticacion.codigo-otp"


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        request=LoginSerializer,
        responses={
            200: OpenApiResponse(
                description="Credenciales válidas y OTP generado."
            ),
            401: OpenApiResponse(
                description="Credenciales incorrectas."
            ),
            403: OpenApiResponse(
                description="Cuenta inactiva."
            ),
        },
        tags=["Autenticación"],
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = (
            serializer.validated_data["email"]
            .strip()
            .lower()
        )
        password = serializer.validated_data["password"]

        usuario = (
            Usuario.objects
            .select_related("rol")
            .filter(email__iexact=email)
            .first()
        )

        if (
            usuario is None
            or not usuario.check_password(password)
        ):
            registrar_evento(
                request=request,
                usuario=usuario,
                accion="INICIO_SESION",
                entidad="Usuario",
                entidad_id=usuario.pk if usuario else "",
                resultado=Bitacora.Resultado.DENEGADO,
                detalle="Credenciales incorrectas.",
            )

            return Response(
                {
                    "success": False,
                    "message": (
                        "El correo o la contraseña "
                        "son incorrectos."
                    ),
                    "errorCode": "CREDENCIALES_INVALIDAS",
                    "errors": {
                        "credenciales": [
                            "No fue posible validar "
                            "las credenciales."
                        ]
                    },
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not usuario.is_active:
            registrar_evento(
                request=request,
                usuario=usuario,
                accion="INICIO_SESION",
                entidad="Usuario",
                entidad_id=usuario.pk,
                resultado=Bitacora.Resultado.DENEGADO,
                detalle="La cuenta se encuentra inactiva.",
            )

            return Response(
                {
                    "success": False,
                    "message": (
                        "La cuenta se encuentra inactiva."
                    ),
                    "errorCode": "USUARIO_INACTIVO",
                    "errors": {
                        "usuario": [
                            "Contacte al administrador "
                            "del sistema."
                        ]
                    },
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        registro_otp, codigo = generar_codigo_otp(usuario)

        otp_token = signing.dumps(
            {
                "usuario_id": usuario.pk,
            },
            salt=OTP_SIGNING_SALT,
            compress=True,
        )

        registrar_evento(
            request=request,
            usuario=usuario,
            accion="OTP_GENERADO",
            entidad="CodigoOTP",
            entidad_id=registro_otp.pk,
            resultado=Bitacora.Resultado.EXITO,
            detalle=(
                "Se generó el código temporal "
                "del segundo factor."
            ),
        )

        respuesta = {
            "success": True,
            "message": (
                "Credenciales válidas. "
                "Complete el segundo factor."
            ),
            "data": {
                "otp_requerido": True,
                "otp_token": otp_token,
                "expira_en": (
                    registro_otp.expira_en.isoformat()
                ),
            },
        }

        if settings.DEBUG:
            respuesta["data"]["codigo_otp_demo"] = codigo

        return Response(
            respuesta,
            status=status.HTTP_200_OK,
        )


class RefreshJWTView(TokenRefreshView):
    """Mantiene el refresh de Simple JWT con documentación uniforme."""

    @extend_schema(tags=["Autenticación"])
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class VerificarOTPView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        request=VerificarOTPSerializer,
        responses={
            200: OpenApiResponse(
                description=(
                    "OTP válido y tokens JWT generados."
                )
            ),
            400: OpenApiResponse(
                description="Formato incorrecto."
            ),
            401: OpenApiResponse(
                description=(
                    "OTP incorrecto, vencido o bloqueado."
                )
            ),
            403: OpenApiResponse(
                description="Cuenta inactiva."
            ),
        },
        tags=["Autenticación"],
    )
    def post(self, request):
        serializer = VerificarOTPSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        otp_token = serializer.validated_data["otp_token"]
        codigo = serializer.validated_data["codigo"]

        segundos_vigencia = (
            settings.OTP_EXPIRATION_MINUTES * 60
        )

        try:
            datos_token = signing.loads(
                otp_token,
                salt=OTP_SIGNING_SALT,
                max_age=segundos_vigencia,
            )

        except SignatureExpired:
            registrar_evento(
                request=request,
                accion="VERIFICAR_OTP",
                entidad="CodigoOTP",
                resultado=Bitacora.Resultado.DENEGADO,
                detalle="El identificador OTP expiró.",
            )

            return Response(
                {
                    "success": False,
                    "message": (
                        "El identificador OTP ha expirado."
                    ),
                    "errorCode": "OTP_EXPIRADO",
                    "errors": {
                        "otp_token": [
                            "Debe iniciar nuevamente "
                            "el proceso."
                        ]
                    },
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        except BadSignature:
            registrar_evento(
                request=request,
                accion="VERIFICAR_OTP",
                entidad="CodigoOTP",
                resultado=Bitacora.Resultado.DENEGADO,
                detalle=(
                    "El identificador OTP no es válido."
                ),
            )

            return Response(
                {
                    "success": False,
                    "message": (
                        "El identificador OTP no es válido."
                    ),
                    "errorCode": "TOKEN_INVALIDO",
                    "errors": {
                        "otp_token": [
                            "El valor fue alterado "
                            "o no es reconocido."
                        ]
                    },
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        usuario = (
            Usuario.objects
            .select_related("rol")
            .filter(
                pk=datos_token.get("usuario_id")
            )
            .first()
        )

        if usuario is None:
            registrar_evento(
                request=request,
                accion="VERIFICAR_OTP",
                entidad="Usuario",
                resultado=Bitacora.Resultado.DENEGADO,
                detalle="El usuario no existe.",
            )

            return Response(
                {
                    "success": False,
                    "message": "El usuario no existe.",
                    "errorCode": "TOKEN_INVALIDO",
                    "errors": {},
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not usuario.is_active:
            registrar_evento(
                request=request,
                usuario=usuario,
                accion="VERIFICAR_OTP",
                entidad="Usuario",
                entidad_id=usuario.pk,
                resultado=Bitacora.Resultado.DENEGADO,
                detalle="La cuenta se encuentra inactiva.",
            )

            return Response(
                {
                    "success": False,
                    "message": (
                        "La cuenta se encuentra inactiva."
                    ),
                    "errorCode": "USUARIO_INACTIVO",
                    "errors": {},
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            registro_otp = validar_codigo_otp(
                usuario,
                codigo,
            )

        except ErrorOTP as error:
            registrar_evento(
                request=request,
                usuario=usuario,
                accion="VERIFICAR_OTP",
                entidad="CodigoOTP",
                resultado=Bitacora.Resultado.DENEGADO,
                detalle=error.mensaje,
            )

            return Response(
                {
                    "success": False,
                    "message": error.mensaje,
                    "errorCode": (
                        "OTP_EXPIRADO"
                        if error.codigo_error == "otp_expirado"
                        else "OTP_INVALIDO"
                    ),
                    "errors": {
                        "codigo": [
                            error.codigo_error,
                        ]
                    },
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        nombre_rol = (
            usuario.rol.nombre
            if usuario.rol
            else None
        )

        refresh = RefreshToken.for_user(usuario)
        refresh["email"] = usuario.email
        refresh["rol"] = nombre_rol

        update_last_login(None, usuario)

        registrar_evento(
            request=request,
            usuario=usuario,
            accion="INICIO_SESION",
            entidad="Usuario",
            entidad_id=usuario.pk,
            resultado=Bitacora.Resultado.EXITO,
            detalle=(
                "Inicio de sesión completado "
                "con segundo factor."
            ),
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Inicio de sesión completado "
                    "correctamente."
                ),
                "data": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "usuario": {
                        "id": usuario.pk,
                        "email": usuario.email,
                        "nombre": usuario.get_full_name(),
                        "rol": nombre_rol,
                    },
                },
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=LogoutSerializer,
        responses={
            200: OpenApiResponse(
                description="Sesión cerrada correctamente."
            ),
            400: OpenApiResponse(
                description="Refresh token inválido."
            ),
        },
        tags=["Autenticación"],
    )
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        refresh_token = serializer.validated_data["refresh"]

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()

        except TokenError:
            registrar_evento(
                request=request,
                usuario=request.user,
                accion="CERRAR_SESION",
                entidad="Usuario",
                entidad_id=request.user.pk,
                resultado=Bitacora.Resultado.ERROR,
                detalle="Refresh token inválido.",
            )

            return Response(
                {
                    "success": False,
                    "message": (
                        "El refresh token no es válido."
                    ),
                    "errors": {
                        "refresh": [
                            "No fue posible cerrar "
                            "la sesión solicitada."
                        ]
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        registrar_evento(
            request=request,
            usuario=request.user,
            accion="CERRAR_SESION",
            entidad="Usuario",
            entidad_id=request.user.pk,
            resultado=Bitacora.Resultado.EXITO,
            detalle="Sesión cerrada correctamente.",
        )

        return Response(
            {
                "success": True,
                "message": (
                    "La sesión se cerró correctamente."
                ),
                "data": {},
            },
            status=status.HTTP_200_OK,
        )


class CambiarContrasenaView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=CambiarContrasenaSerializer,
        responses={
            200: OpenApiResponse(
                description=(
                    "Contraseña actualizada correctamente."
                )
            ),
            400: OpenApiResponse(
                description=(
                    "Contraseña actual incorrecta "
                    "o nueva contraseña inválida."
                )
            ),
        },
        tags=["Autenticación"],
    )
    def put(self, request):
        serializer = CambiarContrasenaSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        usuario = request.user
        password_actual = (
            serializer.validated_data["password_actual"]
        )
        nueva_password = (
            serializer.validated_data["nueva_password"]
        )

        if not usuario.check_password(password_actual):
            registrar_evento(
                request=request,
                usuario=usuario,
                accion="CAMBIAR_CONTRASENA",
                entidad="Usuario",
                entidad_id=usuario.pk,
                resultado=Bitacora.Resultado.DENEGADO,
                detalle=(
                    "La contraseña actual es incorrecta."
                ),
            )

            return Response(
                {
                    "success": False,
                    "message": (
                        "La contraseña actual es incorrecta."
                    ),
                    "errorCode": (
                        "CONTRASENA_ACTUAL_INCORRECTA"
                    ),
                    "errors": {
                        "password_actual": [
                            "No coincide con la contraseña "
                            "registrada."
                        ]
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(
                nueva_password,
                user=usuario,
            )

        except DjangoValidationError as error:
            registrar_evento(
                request=request,
                usuario=usuario,
                accion="CAMBIAR_CONTRASENA",
                entidad="Usuario",
                entidad_id=usuario.pk,
                resultado=Bitacora.Resultado.DENEGADO,
                detalle=(
                    "La nueva contraseña no cumple "
                    "las condiciones de seguridad."
                ),
            )

            return Response(
                {
                    "success": False,
                    "message": (
                        "La nueva contraseña no cumple "
                        "las condiciones requeridas."
                    ),
                    "errors": {
                        "nueva_password": list(
                            error.messages
                        )
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            usuario.set_password(nueva_password)
            usuario.save(
                update_fields=[
                    "password",
                    "actualizado_en",
                ]
            )

            crear_notificacion(
                usuario=usuario,
                tipo=Notificacion.Tipo.SEGURIDAD,
                titulo="Contraseña actualizada",
                mensaje=(
                    "La contraseña de su cuenta fue "
                    "actualizada correctamente."
                ),
            )

            registrar_evento(
                request=request,
                usuario=usuario,
                accion="CAMBIAR_CONTRASENA",
                entidad="Usuario",
                entidad_id=usuario.pk,
                resultado=Bitacora.Resultado.EXITO,
                detalle=(
                    "La contraseña fue actualizada "
                    "correctamente."
                ),
            )

        return Response(
            {
                "success": True,
                "message": (
                    "La contraseña fue actualizada "
                    "correctamente."
                ),
                "data": {},
            },
            status=status.HTTP_200_OK,
        )