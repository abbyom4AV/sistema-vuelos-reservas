from django.contrib import admin

from .models import Bitacora


@admin.register(Bitacora)
class BitacoraAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "usuario",
        "accion",
        "entidad",
        "resultado",
        "metodo_http",
        "creado_en",
    )

    list_filter = (
        "resultado",
        "accion",
        "entidad",
        "metodo_http",
        "creado_en",
    )

    search_fields = (
        "usuario__email",
        "accion",
        "entidad",
        "entidad_id",
        "detalle",
        "endpoint",
        "direccion_ip",
    )

    ordering = (
        "-creado_en",
    )

    readonly_fields = (
        "usuario",
        "accion",
        "entidad",
        "entidad_id",
        "resultado",
        "detalle",
        "metodo_http",
        "endpoint",
        "direccion_ip",
        "creado_en",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(
        self,
        request,
        obj=None,
    ):
        return False

    def has_delete_permission(
        self,
        request,
        obj=None,
    ):
        return False
