from django.shortcuts import render
# Create your views here.
from django.db import transaction
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from config.api_mixins import EnvelopeModelViewSetMixin
from reservas.models import Reserva
from .models import Pago
from .serializers import PagoSerializer, SimularPagoSerializer
from .services import simular_pago
@extend_schema_view(
    list=extend_schema(tags=["Pagos"]),
    retrieve=extend_schema(tags=["Pagos"]),
    create=extend_schema(tags=["Pagos"]),
)
class PagoViewSet(EnvelopeModelViewSetMixin, ModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]
    queryset = Pago.objects.select_related(
        "reserva", "reserva__usuario", "reserva__vuelo", "reserva__asiento"
    )
    serializer_class = PagoSerializer
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_superuser or self.request.user.tiene_rol("ADMINISTRADOR"):
            return queryset
        return queryset.filter(reserva__usuario=self.request.user)
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = SimularPagoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            reserva = (
                Reserva.objects
                .filter(usuario=request.user)
                .get(pk=serializer.validated_data["reserva"])
            )
        except Reserva.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "La reserva no existe o no tienes permiso para acceder a ella.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        try:
            pago = simular_pago(
                reserva=reserva,
                resultado=serializer.validated_data["resultado"],
                monto=serializer.validated_data["monto"],
                usuario=request.user,
                request=request,
            )
        except ValueError as error:
            return Response(
                {"success": False, "message": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                "success": True,
                "message": "El pago fue procesado correctamente.",
                "data": PagoSerializer(pago).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(tags=["Pagos"])
    @action(
        detail=True,
        methods=["get"],
        url_path="comprobante",
    )
    def comprobante(self, request, pk=None):

        from io import BytesIO
        from django.http import FileResponse
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas

        try:
            pago = self.get_queryset().get(pk=pk)
        except Pago.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "El pago no existe o no tienes permiso para acceder a él.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        reserva = pago.reserva
        asiento = reserva.asiento
        vuelo = reserva.vuelo

        pdf.setFont("Helvetica-Bold", 16)
        pdf.drawString(50, height - 60, "Comprobante de pago - FlyTrack")

        pdf.setFont("Helvetica", 11)
        y = height - 100

        lineas = [
            f"Comprobante #: {pago.id}",
            f"Reserva #: {reserva.id}",
            f"Estado del pago: {pago.estado}",
            f"Monto: {pago.monto}",
            f"Metodo: {pago.metodo}",
            f"Fecha de pago: {pago.creado_en.strftime('%Y-%m-%d %H:%M')}",
            "",
            f"Vuelo: {vuelo.ruta.origen} -> {vuelo.ruta.destino}",
            f"Fecha de vuelo: {vuelo.fecha} {vuelo.hora}",
            f"Asiento: {asiento.codigo}",
            f"Pasajero: {reserva.usuario.email}",
            f"Resultado del pago: {'Reserva confirmada' if pago.estado == 'APROBADO' else 'Reserva cancelada'}",
        ]

        for linea in lineas:
            pdf.drawString(50, y, linea)
            y -= 20

        pdf.showPage()
        pdf.save()
        buffer.seek(0)

        return FileResponse(
            buffer,
            as_attachment=True,
            filename=f"comprobante_pago_{pago.id}.pdf",
        )