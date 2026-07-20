from django.urls import path

from .views import (
    login_view,
    panel_view,
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
]