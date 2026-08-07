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
from .serializers import (
    IniciarPagoSerializer,
    PagoSerializer,
    VerificarPagoSerializer,
)
from .services import iniciar_pago, verificar_pago


@extend_schema_view(
    list=extend_schema(tags=["Pagos"]),
    retrieve=extend_schema(tags=["Pagos"]),
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

    @extend_schema(tags=["Pagos"])
    @action(
        detail=False,
        methods=["post"],
        url_path="iniciar",
    )
    @transaction.atomic
    def iniciar(self, request, *args, **kwargs):

        serializer = IniciarPagoSerializer(data=request.data)
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
            pago, codigo = iniciar_pago(
                reserva=reserva,
                metodo=serializer.validated_data["metodo"],
                cuenta=serializer.validated_data["cuenta"],
                monto=serializer.validated_data["monto"],
                usuario=request.user,
                request=request,
            )
        except ValueError as error:
            return Response(
                {"success": False, "message": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if codigo is None:
            return Response(
                {
                    "success": True,
                    "message": "El pago fue rechazado: el saldo de la cuenta no cubre el monto.",
                    "data": PagoSerializer(pago).data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                "success": True,
                "message": "Se generó un código de verificación. Revisa tu correo (simulado).",
                "data": {
                    **PagoSerializer(pago).data,
                    "codigo_demo": codigo,
                },
            },
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(tags=["Pagos"])
    @action(
        detail=True,
        methods=["post"],
        url_path="verificar",
    )
    @transaction.atomic
    def verificar(self, request, pk=None):

        serializer = VerificarPagoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

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

        try:
            pago = verificar_pago(
                pago=pago,
                codigo=serializer.validated_data["codigo"],
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
                "message": "El pago fue verificado y la reserva quedó confirmada.",
                "data": PagoSerializer(pago).data,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(tags=["Pagos"])
    @action(
        detail=True,
        methods=["get"],
        url_path="comprobante",
    )
    def comprobante(self, request, pk=None):

        import os
        from io import BytesIO
        from django.conf import settings
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
        centro_x = width / 2

        reserva = pago.reserva
        asiento = reserva.asiento
        vuelo = reserva.vuelo

        y = height - 50

        ruta_logo = os.path.join(
            settings.BASE_DIR, "static", "img", "flytrack-logo.png"
        )

        if os.path.exists(ruta_logo):
            logo_ancho = 70
            logo_alto = 70
            pdf.drawImage(
                ruta_logo,
                centro_x - (logo_ancho / 2),
                y - logo_alto,
                width=logo_ancho,
                height=logo_alto,
                mask="auto",
            )
            y -= logo_alto + 20
        else:
            y -= 10

        pdf.setFont("Helvetica-Bold", 18)
        pdf.drawCentredString(centro_x, y, "FlyTrack")
        y -= 22

        pdf.setFont("Helvetica-Bold", 13)
        pdf.drawCentredString(centro_x, y, "Comprobante de pago")
        y -= 35

        pdf.setFont("Helvetica", 11)

        lineas = [
            f"Comprobante #: {pago.id}",
            f"Reserva #: {reserva.id} ({reserva.codigo or '—'})",
            f"Estado del pago: {pago.estado}",
            f"Monto: {pago.monto}",
            f"Metodo: {pago.metodo}",
            f"Cuenta utilizada: {pago.cuenta or '—'}",
            f"Fecha de pago: {pago.creado_en.strftime('%Y-%m-%d %H:%M')}",
            "",
            f"Vuelo: {vuelo.ruta.origen} -> {vuelo.ruta.destino}",
            f"Fecha de vuelo: {vuelo.fecha} {vuelo.hora}",
            f"Asiento: {asiento.codigo}",
            f"Pasajero: {reserva.usuario.email}",
            f"Resultado del pago: {'Reserva confirmada' if pago.estado == 'APROBADO' else 'Reserva cancelada'}",
        ]

        for linea in lineas:
            if linea:
                pdf.drawCentredString(centro_x, y, linea)
            y -= 20

        pdf.showPage()
        pdf.save()
        buffer.seek(0)

        return FileResponse(
            buffer,
            as_attachment=True,
            filename=f"comprobante_pago_{pago.id}.pdf",
        )