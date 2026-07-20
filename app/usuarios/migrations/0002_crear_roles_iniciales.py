from django.db import migrations


def crear_roles_iniciales(apps, schema_editor):
    Rol = apps.get_model("usuarios", "Rol")

    Rol.objects.get_or_create(
        nombre="ADMINISTRADOR",
        defaults={
            "descripcion": (
                "Gestiona usuarios, vuelos, reservas, "
                "bitácoras y reportes del sistema."
            ),
            "activo": True,
        },
    )

    Rol.objects.get_or_create(
        nombre="CLIENTE",
        defaults={
            "descripcion": (
                "Consulta vuelos y administra sus "
                "propias reservas y pagos."
            ),
            "activo": True,
        },
    )


class Migration(migrations.Migration):

    dependencies = [
        ("usuarios", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(
            crear_roles_iniciales,
            migrations.RunPython.noop,
        ),
    ]