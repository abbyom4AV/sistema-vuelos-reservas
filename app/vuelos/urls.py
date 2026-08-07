from rest_framework.routers import DefaultRouter

from .views import (
    AeronaveViewSet,
    RutaViewSet,
    VueloViewSet,
    AsientoViewSet,
)


router = DefaultRouter()

router.register(
    "aeronaves",
    AeronaveViewSet,
    basename="aeronave",
)

router.register(
    "rutas",
    RutaViewSet,
    basename="ruta",
)

router.register(
    "vuelos",
    VueloViewSet,
    basename="vuelo",
)

router.register(
    "asientos",
    AsientoViewSet,
    basename="asiento",
)


urlpatterns = router.urls