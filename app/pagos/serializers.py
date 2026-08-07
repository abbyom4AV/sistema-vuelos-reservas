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
            "cuenta",
            "creado_en",
            "actualizado_en",
        )
        read_only_fields = (
            "id",
            "estado",
            "creado_en",
            "actualizado_en",
        )


class IniciarPagoSerializer(serializers.Serializer):

    reserva = serializers.IntegerField()
    metodo = serializers.ChoiceField(
        choices=["TARJETA", "PAYPAL"]
    )
    cuenta = serializers.CharField(
        max_length=100
    )
    monto = serializers.DecimalField(
        max_digits=10, decimal_places=2
    )


class VerificarPagoSerializer(serializers.Serializer):

    codigo = serializers.CharField(
        max_length=10
    )