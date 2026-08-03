from rest_framework import serializers
from .models import Pago


class PagoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Pago
        fields = (
            "id",
            "reserva",
            "estado",
            "monto",
            "metodo",
            "creado_en",
            "actualizado_en",
        )
        read_only_fields = (
            "id",
            "estado",
            "metodo",
            "creado_en",
            "actualizado_en",
        )


class SimularPagoSerializer(serializers.Serializer):

    reserva = serializers.IntegerField()
    resultado = serializers.ChoiceField(
        choices=["APROBADO", "RECHAZADO"]
    )
    monto = serializers.DecimalField(
        max_digits=10, decimal_places=2
    )
    metodo = serializers.ChoiceField(
        choices=["TARJETA", "EFECTIVO"],
        default="TARJETA",
    )