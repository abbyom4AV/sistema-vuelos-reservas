from django.db import transaction

from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
)

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from config.api_mixins import EnvelopeModelViewSetMixin

from .models import Reserva
from .serializers import (
    CrearReservaSerializer,
    ReservaDetalleSerializer,
    ReservaSerializer,
)
from .services import (
    cancelar_reserva,
    crear_reserva,
)


@extend_schema_view(
    list=extend_schema(
        tags=["Reservas"]
    ),
    retrieve=extend_schema(
        tags=["Reservas"]
    ),
    create=extend_schema(
        tags=["Reservas"]
    ),
)
class ReservaViewSet(
    EnvelopeModelViewSetMixin,
    ModelViewSet,
):

    permission_classes = [
        IsAuthenticated,
    ]

    def get_permissions(self):
        return [IsAuthenticated()]

    http_method_names = [
        "get",
        "post",
        "head",
        "options",
    ]

    queryset = (
        Reserva.objects
        .select_related(
            "usuario",
            "vuelo",
            "vuelo__ruta",
            "vuelo__aeronave",
            "asiento",
            "pago",
        )
    )

    serializer_class = ReservaSerializer

    def get_queryset(self):

        queryset = super().get_queryset()

        if not (
            self.request.user.is_superuser
            or self.request.user.tiene_rol("ADMINISTRADOR")
        ):
            return queryset.filter(
                usuario=self.request.user
            )

        vuelo = self.request.query_params.get("vuelo")
        estado = self.request.query_params.get("estado")
        usuario_id = self.request.query_params.get("usuario")
        fecha = self.request.query_params.get("fecha")
        codigo = self.request.query_params.get("codigo")

        if vuelo:
            queryset = queryset.filter(vuelo_id=vuelo)

        if estado:
            queryset = queryset.filter(estado=estado)

        if usuario_id:
            queryset = queryset.filter(usuario_id=usuario_id)

        if fecha:
            queryset = queryset.filter(creado_en__date=fecha)

        if codigo:
            queryset = queryset.filter(pk=codigo)

        return queryset

    def get_serializer_class(self):

        if self.action == "create":
            return CrearReservaSerializer

        if self.action == "list":
            return ReservaDetalleSerializer

        if self.action == "retrieve":
            return ReservaDetalleSerializer

        return ReservaSerializer

    @transaction.atomic
    def create(
        self,
        request,
        *args,
        **kwargs,
    ):
        if not request.user.tiene_rol("CLIENTE"):
            return Response(
                {
                    "success": False,
                    "message": (
                        "Solo un usuario con rol CLIENTE "
                        "puede crear reservas."
                    ),
                    "errorCode": "ROLE_NOT_ALLOWED",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = (
            CrearReservaSerializer(
                data=request.data
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:

            reserva = crear_reserva(
                usuario=request.user,
                vuelo_id=serializer.validated_data[
                    "vuelo"
                ].id,
                asiento_id=serializer.validated_data[
                    "asiento"
                ].id,
                request=request,
            )

        except ValueError as error:

            return Response(
                {
                    "success": False,
                    "message": str(error),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "message": (
                    "La reserva fue creada "
                    "correctamente."
                ),
                "data": ReservaDetalleSerializer(
                    reserva
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        tags=["Reservas"],
        responses={
            200: ReservaDetalleSerializer,
        },
    )
    @action(
        detail=True,
        methods=["post"],
        url_path="cancelar",
    )
    def cancelar(
        self,
        request,
        pk=None,
    ):

        try:

            reserva = (
                self.get_queryset()
                .get(pk=pk)
            )

        except Reserva.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": (
                        "La reserva no existe "
                        "o no tienes permiso "
                        "para acceder a ella."
                    ),
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        try:

            reserva = cancelar_reserva(
                reserva=reserva,
                usuario=request.user,
                request=request,
            )

        except ValueError as error:

            return Response(
                {
                    "success": False,
                    "message": str(error),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "message": (
                    "La reserva fue cancelada "
                    "correctamente."
                ),
                "data": ReservaDetalleSerializer(
                    reserva
                ).data,
            },
            status=status.HTTP_200_OK,
        )