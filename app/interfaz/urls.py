# app/interfaz/urls.py

from django.urls import path

from .views import (
    acceso_denegado_view,
    bitacora_view,
    cambiar_contrasena_view,
    login_view,
    notificaciones_view,
    panel_view,
    usuarios_view,
    verificar_otp_view,
)


app_name = "interfaz"


urlpatterns = [
    path(
        "",
        login_view,
        name="login",
    ),
    path(
        "verificar-otp/",
        verificar_otp_view,
        name="verificar-otp",
    ),
    path(
        "panel/",
        panel_view,
        name="panel",
    ),
    path(
        "usuarios/",
        usuarios_view,
        name="usuarios",
    ),
    path(
        "acceso-denegado/",
        acceso_denegado_view,
        name="acceso-denegado",
    ),
    path(
        "notificaciones/",
        notificaciones_view,
        name="notificaciones",
    ),
    path(
        "bitacora/",
        bitacora_view,
        name="bitacora",
    ),
    path(
        "cambiar-contrasena/",
        cambiar_contrasena_view,
        name="cambiar-contrasena",
    ),
]