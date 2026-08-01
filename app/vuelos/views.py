from django.db import transaction

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from auditoria.models import Bitacora
from auditoria.services import registrar_evento
from config.api_mixins import EnvelopeModelViewSetMixin
from usuarios.permissions import EsAdministrador

from .models import Aeronave, Ruta, Vuelo, Asiento
from .serializers import (
    AeronaveSerializer,
    RutaSerializer,
    VueloSerializer,
    AsientoSerializer,
)
from .services import generar_asientos, cancelar_vuelo


class BaseOperativaViewSet(
    EnvelopeModelViewSetMixin,
    ModelViewSet,
):
    permission_classes = [
        IsAuthenticated,
        EsAdministrador,
    ]

    http_method_names = [
        "get",
        "post",
        "put",
        "patch",
        "head",
        "options",
    ]


@extend_schema_view(
    list=extend_schema(tags=["Aeronaves"]),
    retrieve=extend_schema(tags=["Aeronaves"]),
    create=extend_schema(tags=["Aeronaves"]),
    update=extend_schema(tags=["Aeronaves"]),
    partial_update=extend_schema(tags=["Aeronaves"]),
)
class AeronaveViewSet(BaseOperativaViewSet):
    queryset = Aeronave.objects.all()
    serializer_class = AeronaveSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        aeronave = serializer.save()

        registrar_evento(
            request=self.request,
            usuario=self.request.user,
            accion="CREAR_AERONAVE",
            entidad="Aeronave",
            entidad_id=aeronave.pk,
            resultado=Bitacora.Resultado.EXITO,
            detalle=f"Se creó la aeronave {aeronave.codigo}.",
        )

    @transaction.atomic
    def perform_update(self, serializer):
        aeronave = serializer.save()

        registrar_evento(
            request=self.request,
            usuario=self.request.user,
            accion="ACTUALIZAR_AERONAVE",
            entidad="Aeronave",
            entidad_id=aeronave.pk,
            resultado=Bitacora.Resultado.EXITO,
            detalle=f"Se actualizó la aeronave {aeronave.codigo}.",
        )

    @extend_schema(
        tags=["Aeronaves"],
        request=AeronaveSerializer,
        responses=AeronaveSerializer,
    )
    @action(detail=True, methods=["patch"], url_path="desactivar")
    def desactivar(self, request, pk=None):
        aeronave = self.get_object()
        aeronave.estado = Aeronave.Estado.INACTIVA
        aeronave.save(update_fields=["estado", "actualizado_en"])

        registrar_evento(
            request=request,
            usuario=request.user,
            accion="DESACTIVAR_AERONAVE",
            entidad="Aeronave",
            entidad_id=aeronave.pk,
            resultado=Bitacora.Resultado.EXITO,
            detalle=f"Se desactivó la aeronave {aeronave.codigo}.",
        )

        return Response(
            {
                "success": True,
                "message": "La aeronave fue desactivada correctamente.",
                "data": AeronaveSerializer(aeronave).data,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema_view(
    list=extend_schema(tags=["Rutas"]),
    retrieve=extend_schema(tags=["Rutas"]),
    create=extend_schema(tags=["Rutas"]),
    update=extend_schema(tags=["Rutas"]),
    partial_update=extend_schema(tags=["Rutas"]),
)
class RutaViewSet(BaseOperativaViewSet):
    queryset = Ruta.objects.all()
    serializer_class = RutaSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        ruta = serializer.save()

        registrar_evento(
            request=self.request,
            usuario=self.request.user,
            accion="CREAR_RUTA",
            entidad="Ruta",
            entidad_id=ruta.pk,
            resultado=Bitacora.Resultado.EXITO,
            detalle=f"Se creó la ruta {ruta.origen} → {ruta.destino}.",
        )

    @transaction.atomic
    def perform_update(self, serializer):
        ruta = serializer.save()

        registrar_evento(
            request=self.request,
            usuario=self.request.user,
            accion="ACTUALIZAR_RUTA",
            entidad="Ruta",
            entidad_id=ruta.pk,
            resultado=Bitacora.Resultado.EXITO,
            detalle=f"Se actualizó la ruta {ruta.origen} → {ruta.destino}.",
        )

    @action(detail=True, methods=["patch"], url_path="desactivar")
    def desactivar(self, request, pk=None):
        ruta = self.get_object()
        ruta.estado = Ruta.Estado.INACTIVA
        ruta.save(update_fields=["estado", "actualizado_en"])

        registrar_evento(
            request=request,
            usuario=request.user,
            accion="DESACTIVAR_RUTA",
            entidad="Ruta",
            entidad_id=ruta.pk,
            resultado=Bitacora.Resultado.EXITO,
            detalle=f"Se desactivó la ruta {ruta.origen} → {ruta.destino}.",
        )

        return Response(
            {
                "success": True,
                "message": "La ruta fue desactivada correctamente.",
                "data": RutaSerializer(ruta).data,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema_view(
    list=extend_schema(tags=["Vuelos"]),
    retrieve=extend_schema(tags=["Vuelos"]),
    create=extend_schema(tags=["Vuelos"]),
    update=extend_schema(tags=["Vuelos"]),
    partial_update=extend_schema(tags=["Vuelos"]),
)
class VueloViewSet(BaseOperativaViewSet):
    queryset = (
        Vuelo.objects
        .select_related("ruta", "aeronave")
        .prefetch_related("asientos")
    )
    serializer_class = VueloSerializer

    def get_permissions(self):
        # Cliente/pasajero puede consultar vuelos.
        # Solo administrador puede crear, editar, cerrar, reabrir o cancelar.
        if self.action in ["list", "retrieve"]:
            return [IsAuthenticated()]
        return [
            IsAuthenticated(),
            EsAdministrador(),
        ]

    def get_queryset(self):
        queryset = super().get_queryset()

        # La información operativa completa queda reservada al administrador.
        # El cliente solo recibe vuelos reservables.
        if not (
            self.request.user.is_superuser
            or self.request.user.tiene_rol("ADMINISTRADOR")
        ):
            queryset = queryset.filter(
                estado__in=[
                    Vuelo.Estado.PROGRAMADO,
                    Vuelo.Estado.ACTIVO,
                ],
                cupos_disponibles__gt=0,
            )

        origen = self.request.query_params.get("origen")
        destino = self.request.query_params.get("destino")
        fecha = self.request.query_params.get("fecha")

        if origen:
            queryset = queryset.filter(ruta__origen__icontains=origen)

        if destino:
            queryset = queryset.filter(ruta__destino__icontains=destino)

        if fecha:
            queryset = queryset.filter(fecha=fecha)

        if self.request.query_params.get("disponibles") == "true":
            queryset = queryset.filter(
                estado__in=[
                    Vuelo.Estado.PROGRAMADO,
                    Vuelo.Estado.ACTIVO,
                ],
                cupos_disponibles__gt=0,
            )

        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        vuelo = serializer.save()

        generar_asientos(
            vuelo=vuelo,
            request=self.request,
            usuario=self.request.user,
        )

        registrar_evento(
            request=self.request,
            usuario=self.request.user,
            accion="PROGRAMAR_VUELO",
            entidad="Vuelo",
            entidad_id=vuelo.pk,
            resultado=Bitacora.Resultado.EXITO,
            detalle=(
                f"Se programó el vuelo "
                f"{vuelo.ruta.origen} → {vuelo.ruta.destino}."
            ),
        )

    @transaction.atomic
    def perform_update(self, serializer):
        vuelo = self.get_object()
        aeronave_anterior_id = vuelo.aeronave_id
        vuelo = serializer.save()

        if vuelo.aeronave_id != aeronave_anterior_id:
            generar_asientos(
                vuelo=vuelo,
                request=self.request,
                usuario=self.request.user,
            )

        registrar_evento(
            request=self.request,
            usuario=self.request.user,
            accion="ACTUALIZAR_VUELO",
            entidad="Vuelo",
            entidad_id=vuelo.pk,
            resultado=Bitacora.Resultado.EXITO,
            detalle=f"Se actualizó el vuelo {vuelo.pk}.",
        )

    @action(detail=True, methods=["patch"], url_path="cerrar")
    def cerrar(self, request, pk=None):
        vuelo = self.get_object()
        vuelo.estado = Vuelo.Estado.CERRADO
        vuelo.save(update_fields=["estado", "actualizado_en"])

        registrar_evento(
            request=request,
            usuario=request.user,
            accion="CERRAR_VUELO",
            entidad="Vuelo",
            entidad_id=vuelo.pk,
            resultado=Bitacora.Resultado.EXITO,
            detalle=f"Se cerró el vuelo {vuelo.pk}.",
        )

        return Response(
            {
                "success": True,
                "message": "El vuelo fue cerrado correctamente.",
                "data": VueloSerializer(vuelo).data,
            }
        )

    @action(detail=True, methods=["patch"], url_path="reabrir")
    def reabrir(self, request, pk=None):
        vuelo = self.get_object()

        if vuelo.estado != Vuelo.Estado.CERRADO:
            return Response(
                {
                    "success": False,
                    "message": "Solo se pueden reabrir vuelos cerrados.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        vuelo.estado = Vuelo.Estado.PROGRAMADO
        vuelo.save(update_fields=["estado", "actualizado_en"])

        registrar_evento(
            request=request,
            usuario=request.user,
            accion="REABRIR_VUELO",
            entidad="Vuelo",
            entidad_id=vuelo.pk,
            resultado=Bitacora.Resultado.EXITO,
            detalle=f"Se reabrió el vuelo {vuelo.pk}.",
        )

        return Response(
            {
                "success": True,
                "message": "El vuelo fue reabierto correctamente.",
                "data": VueloSerializer(vuelo).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["patch"], url_path="cancelar")
    def cancelar(self, request, pk=None):
        vuelo = self.get_object()

        if vuelo.estado == Vuelo.Estado.CANCELADO:
            return Response(
                {
                    "success": False,
                    "message": "El vuelo ya se encuentra cancelado.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        vuelo = cancelar_vuelo(
            vuelo=vuelo,
            request=request,
            usuario=request.user,
        )

        return Response(
            {
                "success": True,
                "message": (
                    "El vuelo fue cancelado administrativamente "
                    "y se actualizaron las reservas afectadas."
                ),
                "data": VueloSerializer(vuelo).data,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema_view(
    list=extend_schema(tags=["Asientos"]),
    retrieve=extend_schema(tags=["Asientos"]),
)
class AsientoViewSet(EnvelopeModelViewSetMixin, ModelViewSet):
    permission_classes = [IsAuthenticated]

    queryset = (
        Asiento.objects
        .select_related("vuelo", "vuelo__ruta", "vuelo__aeronave")
    )
    serializer_class = AsientoSerializer

    http_method_names = ["get", "head", "options"]

    def get_queryset(self):
        queryset = super().get_queryset()

        vuelo = self.request.query_params.get("vuelo")
        estado = self.request.query_params.get("estado")

        if vuelo:
            queryset = queryset.filter(vuelo_id=vuelo)

        if estado:
            queryset = queryset.filter(estado=estado.upper())

        # Un cliente solo puede consultar asientos de vuelos que puede reservar.
        if not (
            self.request.user.is_superuser
            or self.request.user.tiene_rol("ADMINISTRADOR")
        ):
            queryset = queryset.filter(
                vuelo__estado__in=[
                    Vuelo.Estado.PROGRAMADO,
                    Vuelo.Estado.ACTIVO,
                ],
                vuelo__cupos_disponibles__gt=0,
            )

        return queryset
