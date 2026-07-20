from django.db.models import Q
from django.utils.dateparse import parse_date

from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ReadOnlyModelViewSet

from usuarios.permissions import EsAdministrador

from .models import Bitacora
from .serializers import BitacoraSerializer


class BitacoraViewSet(ReadOnlyModelViewSet):
    serializer_class = BitacoraSerializer
    permission_classes = [
        IsAuthenticated,
        EsAdministrador,
    ]

    queryset = (
        Bitacora.objects
        .select_related("usuario")
        .all()
        .order_by("-creado_en")
    )

    def get_queryset(self):
        queryset = super().get_queryset()

        usuario = self.request.query_params.get("usuario")
        accion = self.request.query_params.get("accion")
        entidad = self.request.query_params.get("entidad")
        resultado = self.request.query_params.get("resultado")
        metodo = self.request.query_params.get("metodo")
        fecha_desde = self.request.query_params.get(
            "fecha_desde"
        )
        fecha_hasta = self.request.query_params.get(
            "fecha_hasta"
        )
        buscar = self.request.query_params.get("buscar")

        if usuario:
            if usuario.isdigit():
                queryset = queryset.filter(
                    usuario_id=usuario
                )
            else:
                queryset = queryset.filter(
                    usuario__email__icontains=usuario
                )

        if accion:
            queryset = queryset.filter(
                accion__iexact=accion
            )

        if entidad:
            queryset = queryset.filter(
                entidad__iexact=entidad
            )

        if resultado:
            queryset = queryset.filter(
                resultado__iexact=resultado
            )

        if metodo:
            queryset = queryset.filter(
                metodo_http__iexact=metodo
            )

        fecha_inicial = (
            parse_date(fecha_desde)
            if fecha_desde
            else None
        )

        fecha_final = (
            parse_date(fecha_hasta)
            if fecha_hasta
            else None
        )

        if fecha_inicial:
            queryset = queryset.filter(
                creado_en__date__gte=fecha_inicial
            )

        if fecha_final:
            queryset = queryset.filter(
                creado_en__date__lte=fecha_final
            )

        if buscar:
            queryset = queryset.filter(
                Q(accion__icontains=buscar)
                | Q(entidad__icontains=buscar)
                | Q(detalle__icontains=buscar)
                | Q(endpoint__icontains=buscar)
                | Q(usuario__email__icontains=buscar)
            )

        return queryset
