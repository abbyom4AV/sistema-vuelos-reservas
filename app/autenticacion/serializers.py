from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password

from usuarios.models import Rol, Usuario


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()

    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )


class RegistroClienteSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )
    confirmar_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    def validate_email(self, value):
        if Usuario.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "Ya existe una cuenta con este correo."
            )
        return value.lower()

    def validate_username(self, value):
        if Usuario.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                "El nombre de usuario ya está registrado."
            )
        return value

    def validate(self, datos):
        if datos["password"] != datos["confirmar_password"]:
            raise serializers.ValidationError(
                {
                    "confirmar_password": (
                        "La confirmación de contraseña no coincide."
                    )
                }
            )

        usuario_temporal = Usuario(
            email=datos["email"],
            username=datos["username"],
            first_name=datos["first_name"],
            last_name=datos["last_name"],
        )
        validate_password(datos["password"], user=usuario_temporal)
        return datos

    def create(self, validated_data):
        validated_data.pop("confirmar_password")
        rol_cliente = Rol.objects.filter(
            nombre__iexact="CLIENTE",
            activo=True,
        ).first()

        if rol_cliente is None:
            raise serializers.ValidationError(
                {
                    "rol": (
                        "El rol de cliente no está disponible."
                    )
                }
            )

        return Usuario.objects.create_user(
            rol=rol_cliente,
            **validated_data,
        )


class VerificarOTPSerializer(serializers.Serializer):
    otp_token = serializers.CharField()

    codigo = serializers.RegexField(
        regex=r"^\d{6}$",
        error_messages={
            "invalid": (
                "El código OTP debe contener exactamente "
                "seis dígitos."
            ),
        },
    )


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(
        write_only=True,
    )


class CambiarContrasenaSerializer(serializers.Serializer):
    password_actual = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    nueva_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    confirmar_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    def validate(self, datos):
        if (
            datos["nueva_password"]
            != datos["confirmar_password"]
        ):
            raise serializers.ValidationError(
                {
                    "confirmar_password": (
                        "La nueva contraseña y su "
                        "confirmación no coinciden."
                    )
                }
            )

        if (
            datos["password_actual"]
            == datos["nueva_password"]
        ):
            raise serializers.ValidationError(
                {
                    "nueva_password": (
                        "La nueva contraseña debe ser "
                        "diferente de la contraseña actual."
                    )
                }
            )

        return datos