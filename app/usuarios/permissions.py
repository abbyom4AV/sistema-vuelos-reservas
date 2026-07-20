from rest_framework.permissions import BasePermission


class EsAdministrador(BasePermission):
    message = (
        "Esta operación requiere el rol de administrador."
    )

    def has_permission(self, request, view):
        usuario = request.user

        if not usuario or not usuario.is_authenticated:
            return False

        return (
            usuario.is_superuser
            or usuario.tiene_rol("ADMINISTRADOR")
        )