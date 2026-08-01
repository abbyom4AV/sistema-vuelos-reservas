from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


MAX_CAPACIDAD_AERONAVE = 150


class Aeronave(models.Model):
    class Estado(models.TextChoices):
        ACTIVA = "ACTIVA", "Activa"
        MANTENIMIENTO = "MANTENIMIENTO", "Mantenimiento"
        INACTIVA = "INACTIVA", "Inactiva"

    codigo = models.CharField(max_length=20, unique=True)
    modelo = models.CharField(max_length=100)
    capacidad = models.PositiveIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(MAX_CAPACIDAD_AERONAVE),
        ]
    )
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.ACTIVA,
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "aeronaves"
        ordering = ["codigo"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(capacidad__gte=1, capacidad__lte=150),
                name="aeronave_capacidad_1_150",
            ),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.modelo}"


class Ruta(models.Model):
    class Estado(models.TextChoices):
        ACTIVA = "ACTIVA", "Activa"
        INACTIVA = "INACTIVA", "Inactiva"

    origen = models.CharField(max_length=100)
    destino = models.CharField(max_length=100)
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.ACTIVA,
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "rutas"
        ordering = ["origen", "destino"]

    def __str__(self):
        return f"{self.origen} - {self.destino}"


class Vuelo(models.Model):
    class Estado(models.TextChoices):
        PROGRAMADO = "PROGRAMADO", "Programado"
        ACTIVO = "ACTIVO", "Activo"
        CERRADO = "CERRADO", "Cerrado"
        CANCELADO = "CANCELADO", "Cancelado"

    ruta = models.ForeignKey(
        Ruta,
        on_delete=models.PROTECT,
        related_name="vuelos",
    )
    aeronave = models.ForeignKey(
        Aeronave,
        on_delete=models.PROTECT,
        related_name="vuelos",
    )
    fecha = models.DateField()
    hora = models.TimeField()
    precio_base = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.PROGRAMADO,
    )
    cupos_disponibles = models.PositiveIntegerField(default=0)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "vuelos"
        ordering = ["fecha", "hora"]

    def __str__(self):
        return (
            f"{self.ruta.origen} → {self.ruta.destino} | "
            f"{self.fecha} {self.hora}"
        )


class Asiento(models.Model):
    class Estado(models.TextChoices):
        DISPONIBLE = "DISPONIBLE", "Disponible"
        RESERVADO = "RESERVADO", "Reservado"
        BLOQUEADO = "BLOQUEADO", "Bloqueado"

    vuelo = models.ForeignKey(
        Vuelo,
        on_delete=models.CASCADE,
        related_name="asientos",
    )
    numero = models.PositiveIntegerField()
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.DISPONIBLE,
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "asientos"
        ordering = ["vuelo", "numero"]
        constraints = [
            models.UniqueConstraint(
                fields=["vuelo", "numero"],
                name="unique_asiento_por_vuelo",
            ),
        ]

    @property
    def fila(self):
        return ((self.numero - 1) // 6) + 1

    @property
    def letra(self):
        return "ABCDEF"[(self.numero - 1) % 6]

    @property
    def codigo(self):
        return f"{self.fila}{self.letra}"

    def __str__(self):
        return f"Asiento {self.codigo} - Vuelo {self.vuelo_id}"
