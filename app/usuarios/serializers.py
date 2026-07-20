from django.contrib.auth.password_validation import (
    validate_password,
)
from rest_framework import serializers

from .models import Rol, Usuario


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = (
            "id",
            "nombre",
            "descripcion",
            "activo",
        )


class UsuarioLecturaSerializer(serializers.ModelSerializer):
    rol = RolSerializer(
        read_only=True,
    )

    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = (
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "nombre_completo",
            "rol",
            "is_active",
            "date_joined",
            "last_login",
            "actualizado_en",
        )

    def get_nombre_completo(self, usuario):
        return usuario.get_full_name().strip()


class UsuarioCrearSerializer(serializers.ModelSerializer):
    rol_id = serializers.PrimaryKeyRelatedField(
        source="rol",
        queryset=Rol.objects.filter(activo=True),
        write_only=True,
    )

    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    class Meta:
        model = Usuario
        fields = (
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "rol_id",
            "password",
        )

    def validate_password(self, valor):
        validate_password(valor)
        return valor

    def create(self, validated_data):
        password = validated_data.pop("password")

        return Usuario.objects.create_user(
            password=password,
            **validated_data,
        )


class UsuarioActualizarSerializer(
    serializers.ModelSerializer
):
    rol_id = serializers.PrimaryKeyRelatedField(
        source="rol",
        queryset=Rol.objects.filter(activo=True),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Usuario
        fields = (
            "email",
            "username",
            "first_name",
            "last_name",
            "rol_id",
        )


class UsuarioEstadoSerializer(serializers.Serializer):
    activo = serializers.BooleanField()