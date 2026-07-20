from django.contrib import admin

from .models import CodigoOTP


@admin.register(CodigoOTP)
class CodigoOTPAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "usuario",
        "expira_en",
        "usado",
        "intentos",
        "creado_en",
    )

    list_filter = (
        "usado",
        "creado_en",
        "expira_en",
    )

    search_fields = (
        "usuario__email",
        "usuario__username",
    )

    ordering = (
        "-creado_en",
    )

    readonly_fields = (
        "codigo_hash",
        "creado_en",
        "actualizado_en",
    )
