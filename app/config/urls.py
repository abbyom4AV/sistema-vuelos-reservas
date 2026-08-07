from django.contrib import admin
from django.urls import include, path

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)


urlpatterns = [
    path(
        "admin/",
        admin.site.urls,
    ),
    path(
        "api/auth/",
        include("autenticacion.urls"),
    ),
    
    path(
    "api/usuarios/",
    include("usuarios.urls"),
),

    path(
        "api/notificaciones/",
        include("notificaciones.urls"),
    ),
    path(
        "api/bitacora/",
        include("auditoria.urls"),
    ),

    path(
        "api/schema/",
        SpectacularAPIView.as_view(),
        name="schema",
    ),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(
            url_name="schema"
        ),
        name="swagger-ui",
    ),
    
    path(
        "",
        include("interfaz.urls"),
    ),

    path(
        "api/vuelos/",
        include("vuelos.urls"),
    ),

    path(
        "api/reservas/",
        include("reservas.urls"),
    ),

    path(
        "api/pagos/",
        include("pagos.urls"),
    ),

    path(
        "api/reportes/",
        include("reportes.urls"),
    ),

]
