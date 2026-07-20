from django.contrib.auth.models import AbstractUser
from django.db import models

from .managers import UsuarioManager


class Rol(models.Model):
    nombre = models.CharField(
        max_length=50,
        unique=True,
    )
    descripcion = models.CharField(
        max_length=255,
        blank=True,
    )
    activo = models.BooleanField(
        default=True,
    )
    creado_en = models.DateTimeField(
        auto_now_add=True,
    )
    actualizado_en = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "roles"
        ordering = ["nombre"]
        verbose_name = "rol"
        verbose_name_plural = "roles"

    def __str__(self):
        return self.nombre


class Usuario(AbstractUser):
    email = models.EmailField(
        unique=True,
    )
    rol = models.ForeignKey(
        Rol,
        on_delete=models.PROTECT,
        related_name="usuarios",
        null=True,
        blank=True,
    )
    actualizado_en = models.DateTimeField(
        auto_now=True,
    )

    objects = UsuarioManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "usuarios"
        ordering = ["first_name", "last_name", "email"]
        verbose_name = "usuario"
        verbose_name_plural = "usuarios"

    def __str__(self):
        nombre_completo = self.get_full_name().strip()
        return nombre_completo or self.email

    def tiene_rol(self, nombre_rol):
        if not self.rol:
            return False

        return (
            self.rol.activo
            and self.rol.nombre.upper()
            == nombre_rol.upper()
        )
