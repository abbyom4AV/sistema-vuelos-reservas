from django.db import transaction
from django.db.models import Q

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from auditoria.models import Bitacora
from auditoria.services import registrar_evento
from config.api_mixins import EnvelopeModelViewSetMixin
from notificaciones.models import Notificacion
from notificaciones.services import crear_notificacion

from .models import Usuario
from .permissions import EsAdministrador
from .serializers import (
    UsuarioActualizarSerializer,
    UsuarioCrearSerializer,
    UsuarioEstadoSerializer,
    UsuarioLecturaSerializer,
)


class PerfilView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses=UsuarioLecturaSerializer,
        tags=["Usuarios"],
    )
    def get(self, request):
        serializer = UsuarioLecturaSerializer(
            request.user
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Perfil consultado correctamente."
                ),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema_view(
    list=extend_schema(tags=["Usuarios"]),
    retrieve=extend_schema(tags=["Usuarios"]),
    create=extend_schema(tags=["Usuarios"]),
    update=extend_schema(tags=["Usuarios"]),
    partial_update=extend_schema(tags=["Usuarios"]),
)
class UsuarioViewSet(
    EnvelopeModelViewSetMixin,
    ModelViewSet,
):
    queryset = (
        Usuario.objects
        .select_related("rol")
        .all()
        .order_by("first_name", "last_name", "email")
    )

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

    def get_queryset(self):
        queryset = super().get_queryset()

        rol = self.request.query_params.get("rol")
        estado = self.request.query_params.get("estado")
        buscar = self.request.query_params.get("buscar")

        if rol:
            if rol.isdigit():
                queryset = queryset.filter(rol_id=rol)
            else:
                queryset = queryset.filter(
                    rol__nombre__iexact=rol
                )

        if estado:
            estado_normalizado = estado.strip().lower()

            if estado_normalizado in {
                "activo",
                "true",
                "1",
            }:
                queryset = queryset.filter(is_active=True)

            elif estado_normalizado in {
                "inactivo",
                "false",
                "0",
            }:
                queryset = queryset.filter(is_active=False)

        if buscar:
            queryset = queryset.filter(
                Q(email__icontains=buscar)
                | Q(username__icontains=buscar)
                | Q(first_name__icontains=buscar)
                | Q(last_name__icontains=buscar)
            )

        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return UsuarioCrearSerializer

        if self.action in {
            "update",
            "partial_update",
        }:
            return UsuarioActualizarSerializer

        return UsuarioLecturaSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        usuario = serializer.save()

        registrar_evento(
            request=self.request,
            usuario=self.request.user,
            accion="CREAR_USUARIO",
            entidad="Usuario",
            entidad_id=usuario.pk,
            resultado=Bitacora.Resultado.EXITO,
            detalle=(
                f"Se creó la cuenta {usuario.email}."
            ),
        )
        crear_notificacion(
            usuario=usuario,
            tipo=Notificacion.Tipo.SISTEMA,
            titulo="Cuenta creada",
            mensaje=(
                "Su cuenta fue creada por un administrador."
            ),
        )

    @transaction.atomic
    def perform_update(self, serializer):
        usuario = self.get_object()

        nuevo_rol = serializer.validated_data.get("rol")

        if (
            usuario.pk == self.request.user.pk
            and nuevo_rol is not None
            and nuevo_rol != usuario.rol
        ):
            raise ValidationError(
                {
                    "rol_id": (
                        "No puede modificar su propio rol."
                    )
                }
            )

        usuario = serializer.save()

        registrar_evento(
            request=self.request,
            usuario=self.request.user,
            accion="ACTUALIZAR_USUARIO",
            entidad="Usuario",
            entidad_id=usuario.pk,
            resultado=Bitacora.Resultado.EXITO,
            detalle=(
                f"Se actualizó la cuenta {usuario.email}."
            ),
        )

    @extend_schema(tags=["Usuarios"])
    @action(
        detail=True,
        methods=["patch"],
        url_path="estado",
    )
    def cambiar_estado(self, request, pk=None):
        usuario = self.get_object()

        serializer = UsuarioEstadoSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        nuevo_estado = serializer.validated_data["activo"]

        if usuario.is_active == nuevo_estado:
            return Response(
                {
                    "success": True,
                    "message": (
                        "El usuario ya tenía el estado solicitado."
                    ),
                    "data": UsuarioLecturaSerializer(
                        usuario
                    ).data,
                },
                status=status.HTTP_200_OK,
            )

        if (
            usuario.pk == request.user.pk
            and nuevo_estado is False
        ):
            return Response(
                {
                    "success": False,
                    "message": (
                        "No puede desactivar su propia cuenta."
                    ),
                    "errors": {
                        "activo": [
                            "Seleccione otro usuario."
                        ]
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if usuario.is_superuser and nuevo_estado is False:
            return Response(
                {
                    "success": False,
                    "message": (
                        "No se puede desactivar "
                        "una cuenta de superusuario."
                    ),
                    "errors": {},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            usuario.is_active = nuevo_estado
            usuario.save(
                update_fields=[
                    "is_active",
                    "actualizado_en",
                ]
            )

            registrar_evento(
                request=request,
                usuario=request.user,
                accion="CAMBIAR_ESTADO_USUARIO",
                entidad="Usuario",
                entidad_id=usuario.pk,
                resultado=Bitacora.Resultado.EXITO,
                detalle=(
                    f"Estado de {usuario.email}: "
                    f"{'activo' if nuevo_estado else 'inactivo'}."
                ),
            )
            crear_notificacion(
                usuario=usuario,
                tipo=Notificacion.Tipo.SISTEMA,
                titulo=(
                    "Cuenta activada"
                    if nuevo_estado
                    else "Cuenta desactivada"
                ),
                mensaje=(
                    "Su cuenta fue activada por un administrador."
                    if nuevo_estado
                    else (
                        "Su cuenta fue desactivada por un "
                        "administrador."
                    )
                ),
            )

        return Response(
            {
                "success": True,
                "message": (
                    "El estado del usuario fue "
                    "actualizado correctamente."
                ),
                "data": UsuarioLecturaSerializer(
                    usuario
                ).data,
            },
            status=status.HTTP_200_OK,
        )