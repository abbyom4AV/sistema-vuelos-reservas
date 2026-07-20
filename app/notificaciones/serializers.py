from rest_framework import serializers

from .models import Notificacion


class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = (
            "id",
            "tipo",
            "titulo",
            "mensaje",
            "leida",
            "leida_en",
            "creado_en",
        )
        read_only_fields = fields