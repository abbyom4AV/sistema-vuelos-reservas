from rest_framework import serializers

from .models import Aeronave, Ruta, Vuelo, Asiento, MAX_CAPACIDAD_AERONAVE


class AeronaveSerializer(serializers.ModelSerializer):

    class Meta:
        model = Aeronave
        fields = (
            "id",
            "codigo",
            "modelo",
            "capacidad",
            "estado",
            "creado_en",
            "actualizado_en",
        )
        read_only_fields = (
            "id",
            "creado_en",
            "actualizado_en",
        )

    def validate_capacidad(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "La capacidad debe ser mayor que cero."
            )

        if value > MAX_CAPACIDAD_AERONAVE:
            raise serializers.ValidationError(
                f"La capacidad máxima permitida es de {MAX_CAPACIDAD_AERONAVE} pasajeros."
            )

        return value


class RutaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Ruta
        fields = (
            "id",
            "origen",
            "destino",
            "estado",
            "creado_en",
            "actualizado_en",
        )
        read_only_fields = (
            "id",
            "creado_en",
            "actualizado_en",
        )

    def validate(self, data):
        origen = data.get("origen")
        destino = data.get("destino")

        if origen and destino:
            if origen.strip().lower() == destino.strip().lower():
                raise serializers.ValidationError(
                    "El origen y el destino deben ser diferentes."
                )

        return data


class AsientoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Asiento
        fields = (
            "id",
            "vuelo",
            "numero",
            "codigo",
            "fila",
            "letra",
            "estado",
        )
        read_only_fields = (
            "id",
            "codigo",
            "fila",
            "letra",
        )


class VueloSerializer(serializers.ModelSerializer):

    ruta_detalle = RutaSerializer(
        source="ruta",
        read_only=True,
    )

    aeronave_detalle = AeronaveSerializer(
        source="aeronave",
        read_only=True,
    )

    class Meta:
        model = Vuelo
        fields = (
            "id",
            "ruta",
            "ruta_detalle",
            "aeronave",
            "aeronave_detalle",
            "fecha",
            "hora",
            "precio_base",
            "estado",
            "cupos_disponibles",
            "creado_en",
            "actualizado_en",
        )
        read_only_fields = (
            "id",
            "cupos_disponibles",
            "creado_en",
            "actualizado_en",
        )

    def validate(self, data):

        aeronave = data.get("aeronave")
        ruta = data.get("ruta")

        if ruta and ruta.estado != Ruta.Estado.ACTIVA:
            raise serializers.ValidationError(
                {
                    "ruta": (
                        "No se puede programar un vuelo "
                        "con una ruta inactiva."
                    )
                }
            )

        if aeronave and aeronave.estado != Aeronave.Estado.ACTIVA:
            raise serializers.ValidationError(
                {
                    "aeronave": (
                        "No se puede programar un vuelo "
                        "con una aeronave inactiva."
                    )
                }
            )

        return data