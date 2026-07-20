from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Rol, Usuario


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = (
        "nombre",
        "activo",
        "creado_en",
    )
    list_filter = (
        "activo",
    )
    search_fields = (
        "nombre",
        "descripcion",
    )


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    model = Usuario

    list_display = (
        "email",
        "username",
        "first_name",
        "last_name",
        "rol",
        "is_active",
        "is_staff",
    )

    list_filter = (
        "rol",
        "is_active",
        "is_staff",
        "is_superuser",
    )

    search_fields = (
        "email",
        "username",
        "first_name",
        "last_name",
    )

    ordering = (
        "email",
    )

    fieldsets = UserAdmin.fieldsets + (
        (
            "Rol del sistema",
            {
                "fields": (
                    "rol",
                    "actualizado_en",
                )
            },
        ),
    )

    readonly_fields = (
        "actualizado_en",
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "Información adicional",
            {
                "fields": (
                    "email",
                    "first_name",
                    "last_name",
                    "rol",
                )
            },
        ),
    )
