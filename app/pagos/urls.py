from rest_framework.routers import DefaultRouter

from .views import PagoViewSet

router = DefaultRouter()

router.register(
    "pagos",
    PagoViewSet,
    basename="pago",
)

urlpatterns = router.urls