import os

from django.core.management.base import BaseCommand, CommandError

from auditoria.models import Bitacora
from notificaciones.models import Notificacion
from usuarios.models import Rol, Usuario


class Command(BaseCommand):
    help = "Crea datos base idempotentes para los módulos del Integrante 1."

    def add_arguments(self, parser):
        parser.add_argument(
            "--admin-password",
            dest="admin_password",
            help="Contraseña del administrador demo.",
        )

    def handle(self, *args, **options):
        password = (
            options["admin_password"]
            or os.getenv("SEED_ADMIN_PASSWORD")
        )

        if not password:
            raise CommandError(
                "Indique --admin-password o SEED_ADMIN_PASSWORD."
            )

        admin_role, _ = Rol.objects.update_or_create(
            nombre="ADMINISTRADOR",
            defaults={
                "descripcion": (
                    "Administra usuarios y módulos del sistema."
                ),
                "activo": True,
            },
        )
        client_role, _ = Rol.objects.update_or_create(
            nombre="CLIENTE",
            defaults={
                "descripcion": (
                    "Consulta vuelos y administra sus reservas."
                ),
                "activo": True,
            },
        )

        admin = self._upsert_user(
            email="admin.demo@flytrack.local",
            username="admin_demo",
            first_name="Administrador",
            last_name="Demo",
            role=admin_role,
            is_active=True,
            password=password,
            is_staff=True,
        )
        cliente_1 = self._upsert_user(
            email="cliente.uno@flytrack.local",
            username="cliente_uno",
            first_name="Cliente",
            last_name="Uno",
            role=client_role,
            is_active=True,
            password=password,
        )
        cliente_2 = self._upsert_user(
            email="cliente.dos@flytrack.local",
            username="cliente_dos",
            first_name="Cliente",
            last_name="Dos",
            role=client_role,
            is_active=True,
            password=password,
        )
        inactive = self._upsert_user(
            email="cliente.inactivo@flytrack.local",
            username="cliente_inactivo",
            first_name="Cliente",
            last_name="Inactivo",
            role=client_role,
            is_active=False,
            password=password,
        )

        Notificacion.objects.get_or_create(
            usuario=admin,
            titulo="Datos semilla cargados",
            defaults={
                "tipo": Notificacion.Tipo.SISTEMA,
                "mensaje": (
                    "Los datos de demostración fueron creados."
                ),
            },
        )
        Notificacion.objects.get_or_create(
            usuario=cliente_1,
            titulo="Bienvenido a FlyTrack",
            defaults={
                "tipo": Notificacion.Tipo.SISTEMA,
                "mensaje": (
                    "Tu cuenta de demostración está lista."
                ),
            },
        )
        Bitacora.objects.get_or_create(
            usuario=admin,
            accion="DATOS_SEMILLA_CARGADOS",
            entidad="Sistema",
            entidad_id="base",
            defaults={
                "resultado": Bitacora.Resultado.EXITO,
                "detalle": "Datos base creados o verificados.",
                "metodo_http": "COMMAND",
                "endpoint": "manage.py seed_base",
            },
        )

        self.stdout.write(
            self.style.SUCCESS(
                "Datos base verificados para "
                f"{admin.email}, {cliente_1.email}, "
                f"{cliente_2.email} y {inactive.email}."
            )
        )

    @staticmethod
    def _upsert_user(
        *,
        email,
        username,
        first_name,
        last_name,
        role,
        is_active,
        password,
        is_staff=False,
    ):
        user, created = Usuario.objects.get_or_create(
            email=email,
            defaults={
                "username": username,
                "first_name": first_name,
                "last_name": last_name,
                "rol": role,
                "is_active": is_active,
                "is_staff": is_staff,
            },
        )

        if created:
            user.set_password(password)

        user.username = username
        user.first_name = first_name
        user.last_name = last_name
        user.rol = role
        user.is_active = is_active
        user.is_staff = is_staff
        user.save()
        return user
