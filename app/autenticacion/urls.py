from django.urls import path
from .views import (
    CambiarContrasenaView,
    LoginView,
    LogoutView,
    RefreshJWTView,
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
        RefreshJWTView.as_view(),
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