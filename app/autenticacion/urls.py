from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CambiarContrasenaView,
    LoginView,
    LogoutView,
    VerificarOTPView,
)


app_name = "autenticacion"

urlpatterns = [
    path(
        "login/",
        LoginView.as_view(),
        name="login",
    ),
    path(
        "verificar-otp/",
        VerificarOTPView.as_view(),
        name="verificar-otp",
    ),
    path(
        "refresh/",
        TokenRefreshView.as_view(),
        name="refresh",
    ),
    path(
        "logout/",
        LogoutView.as_view(),
        name="logout",
    ),
    path(
        "cambiar-contrasena/",
        CambiarContrasenaView.as_view(),
        name="cambiar-contrasena",
    ),
]