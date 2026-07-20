from rest_framework import serializers

from .models import Bitacora


class BitacoraSerializer(serializers.ModelSerializer):
    usuario_email = serializers.SerializerMethodField()

    class Meta:
        model = Bitacora
        fields = (
            "id",
            "usuario",
            "usuario_email",
            "accion",
            "entidad",
            "entidad_id",
            "resultado",
            "detalle",
            "metodo_http",
            "endpoint",
            "direccion_ip",
            "creado_en",
        )
        read_only_fields = fields

    def get_usuario_email(self, evento):
        if evento.usuario:
            return evento.usuario.email

        return None