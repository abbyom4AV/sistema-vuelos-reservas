from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models
from django.db.models import Q


class Migration(migrations.Migration):

    dependencies = [
        ("vuelos", "0002_alter_aeronave_estado"),
    ]

    operations = [
        migrations.AlterField(
            model_name="aeronave",
            name="capacidad",
            field=models.PositiveIntegerField(
                validators=[
                    MinValueValidator(1),
                    MaxValueValidator(150),
                ]
            ),
        ),
        migrations.AddConstraint(
            model_name="aeronave",
            constraint=models.CheckConstraint(
                condition=Q(capacidad__gte=1, capacidad__lte=150),
                name="aeronave_capacidad_1_150",
            ),
        ),
    ]
