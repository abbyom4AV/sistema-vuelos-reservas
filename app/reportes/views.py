from django.db.models import Count

from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from reservas.models import Reserva
from vuelos.models import Vuelo


@extend_schema(tags=["Reportes"])
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_view(request):

    if not (
        request.user.is_superuser
        or request.user.tiene_rol("ADMINISTRADOR")
    ):
        return Response(
            {
                "success": False,
                "message": "Solo un administrador puede consultar el dashboard.",
            },
            status=403,
        )

    reservas_por_estado = list(
        Reserva.objects
        .values("estado")
        .annotate(total=Count("id"))
        .order_by("estado")
    )

    reservas_por_ruta = list(
        Reserva.objects
        .values(
            "vuelo__ruta__origen",
            "vuelo__ruta__destino",
        )
        .annotate(total=Count("id"))
        .order_by("-total")
    )

    ocupacion_por_vuelo = []

    for vuelo in Vuelo.objects.select_related("ruta").all():

        total_asientos = vuelo.asientos.count()

        ocupados = (
            total_asientos - vuelo.cupos_disponibles
        )

        ocupacion_por_vuelo.append(
            {
                "vuelo_id": vuelo.id,
                "ruta": (
                    f"{vuelo.ruta.origen} → {vuelo.ruta.destino}"
                    if vuelo.ruta
                    else "—"
                ),
                "total_asientos": total_asientos,
                "ocupados": ocupados,
                "disponibles": vuelo.cupos_disponibles,
            }
        )

    return Response(
        {
            "success": True,
            "message": "Dashboard consultado correctamente.",
            "data": {
                "reservas_por_estado": reservas_por_estado,
                "reservas_por_ruta": reservas_por_ruta,
                "ocupacion_por_vuelo": ocupacion_por_vuelo,
            },
        }
    )