from django.utils import timezone

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet

from auditoria.models import Bitacora
from auditoria.services import registrar_evento
from config.api_mixins import EnvelopeReadOnlyViewSetMixin

from .models import Notificacion
from .serializers import NotificacionSerializer


@extend_schema_view(
    list=extend_schema(tags=["Notificaciones"]),
    retrieve=extend_schema(tags=["Notificaciones"]),
)
class NotificacionViewSet(
    EnvelopeReadOnlyViewSetMixin,
    ReadOnlyModelViewSet,
):
    serializer_class = NotificacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = (
            Notificacion.objects
            .filter(usuario=self.request.user)
            .order_by("-creado_en")
        )

        leida = self.request.query_params.get("leida")
        tipo = self.request.query_params.get("tipo")

        if leida is not None:
            valor = leida.strip().lower()

            if valor in {"true", "1", "si", "sí"}:
                queryset = queryset.filter(leida=True)

            elif valor in {"false", "0", "no"}:
                queryset = queryset.filter(leida=False)

        if tipo:
            queryset = queryset.filter(
                tipo__iexact=tipo
            )

        return queryset

    @extend_schema(
        tags=["Notificaciones"],
        responses=NotificacionSerializer,
    )
    @action(
        detail=True,
        methods=["patch"],
        url_path="leida",
    )
    def marcar_leida(self, request, pk=None):
        notificacion = self.get_object()

        if not notificacion.leida:
            notificacion.marcar_como_leida()

            registrar_evento(
                request=request,
                usuario=request.user,
                accion="MARCAR_NOTIFICACION_LEIDA",
                entidad="Notificacion",
                entidad_id=notificacion.pk,
                resultado=Bitacora.Resultado.EXITO,
                detalle=(
                    "La notificación fue marcada como leída."
                ),
            )

        return Response(
            {
                "success": True,
                "message": (
                    "La notificación fue marcada "
                    "como leída."
                ),
                "data": NotificacionSerializer(
                    notificacion
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        tags=["Notificaciones"],
    )
    @action(
        detail=False,
        methods=["patch"],
        url_path="marcar-todas-leidas",
    )
    def marcar_todas_leidas(self, request):
        cantidad = (
            self.get_queryset()
            .filter(leida=False)
            .update(
                leida=True,
                leida_en=timezone.now(),
            )
        )

        registrar_evento(
            request=request,
            usuario=request.user,
            accion="MARCAR_NOTIFICACIONES_LEIDAS",
            entidad="Notificacion",
            resultado=Bitacora.Resultado.EXITO,
            detalle=(
                f"Se marcaron {cantidad} notificaciones "
                "como leídas."
            ),
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Las notificaciones pendientes "
                    "fueron marcadas como leídas."
                ),
                "data": {
                    "cantidad_actualizada": cantidad,
                },
            },
            status=status.HTTP_200_OK,
        )
