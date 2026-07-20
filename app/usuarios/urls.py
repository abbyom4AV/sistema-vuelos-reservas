from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PerfilView, UsuarioViewSet


router = DefaultRouter()

router.register(
    "",
    UsuarioViewSet,
    basename="usuarios",
)


urlpatterns = [
    path(
        "perfil/",
        PerfilView.as_view(),
        name="perfil",
    ),
    path(
        "",
        include(router.urls),
    ),
]