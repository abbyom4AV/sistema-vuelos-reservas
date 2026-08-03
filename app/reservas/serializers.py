from rest_framework import serializers

from vuelos.models import Asiento, Vuelo

from .models import Reserva


class ReservaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Reserva

        fields = (
            "id",
            "usuario",
            "vuelo",
            "asiento",
            "estado",
            "creado_en",
            "actualizado_en",
        )

        read_only_fields = (
            "id",
            "usuario",
            "estado",
            "creado_en",
            "actualizado_en",
        )

    def validate(self, data):

        vuelo = data.get("vuelo")
        asiento = data.get("asiento")

        if vuelo and asiento:

            if asiento.vuelo_id != vuelo.id:
                raise serializers.ValidationError(
                    {
                        "asiento": (
                            "El asiento seleccionado "
                            "no pertenece al vuelo."
                        )
                    }
                )

            if asiento.estado != Asiento.Estado.DISPONIBLE:
                raise serializers.ValidationError(
                    {
                        "asiento": (
                            "El asiento seleccionado "
                            "no está disponible."
                        )
                    }
                )

            if vuelo.cupos_disponibles <= 0:
                raise serializers.ValidationError(
                    {
                        "vuelo": (
                            "El vuelo no tiene "
                            "cupos disponibles."
                        )
                    }
                )

            if vuelo.estado not in [
                Vuelo.Estado.PROGRAMADO,
                Vuelo.Estado.ACTIVO,
            ]:
                raise serializers.ValidationError(
                    {
                        "vuelo": (
                            "El vuelo no está disponible "
                            "para realizar reservas."
                        )
                    }
                )

        return data


class CrearReservaSerializer(ReservaSerializer):

    class Meta(ReservaSerializer.Meta):

        fields = (
            "id",
            "codigo",
            "usuario",
            "vuelo",
            "vuelo_detalle",
            "asiento",
            "asiento_detalle",
            "estado",
            "creado_en",
            "actualizado_en",
        )

        read_only_fields = (
            "id",
            "codigo",
            "usuario",
            "vuelo",
            "vuelo_detalle",
            "asiento",
            "asiento_detalle",
            "estado",
            "creado_en",
            "actualizado_en",
        )


class ReservaDetalleSerializer(serializers.ModelSerializer):

    vuelo_detalle = serializers.SerializerMethodField()
    asiento_detalle = serializers.SerializerMethodField()

    class Meta:
        model = Reserva

        fields = (
            "id",
            "codigo",
            "usuario",
            "vuelo",
            "asiento",
            "estado",
            "creado_en",
            "actualizado_en",
        )

        read_only_fields = (
            "id",
            "codigo",
            "usuario",
            "estado",
            "creado_en",
            "actualizado_en",
        )

    def get_vuelo_detalle(self, obj):

        if not obj.vuelo:
            return None

        return {
            "id": obj.vuelo.id,
            "ruta": (
                {
                    "id": obj.vuelo.ruta.id,
                    "origen": obj.vuelo.ruta.origen,
                    "destino": obj.vuelo.ruta.destino,
                }
                if obj.vuelo.ruta
                else None
            ),
            "aeronave": (
                {
                    "id": obj.vuelo.aeronave.id,
                    "codigo": obj.vuelo.aeronave.codigo,
                    "modelo": obj.vuelo.aeronave.modelo,
                }
                if obj.vuelo.aeronave
                else None
            ),
            "fecha": obj.vuelo.fecha,
            "hora": obj.vuelo.hora,
            "precio_base": obj.vuelo.precio_base,
            "estado": obj.vuelo.estado,
            "cupos_disponibles": obj.vuelo.cupos_disponibles,
        }

    def get_asiento_detalle(self, obj):

        if not obj.asiento:
            return None

        return {
            "id": obj.asiento.id,
            "numero": obj.asiento.numero,
            "codigo": obj.asiento.codigo,
            "fila": obj.asiento.fila,
            "letra": obj.asiento.letra,
            "estado": obj.asiento.estado,
        }