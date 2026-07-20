from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()

    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
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