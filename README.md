# FlyTrack

FlyTrack es un sistema web para la gestión de vuelos y reservas. Permite
administrar aeronaves, rutas, vuelos, usuarios, reservas, pagos,
notificaciones y reportes.

## Tecnologías verificadas

- Python 3.12.13
- Django 5.2.16 y Django REST Framework 3.16.1
- MySQL 8.4.9 (`db`)
- JWT con `djangorestframework-simplejwt` 5.5.1
- drf-spectacular 0.28.0
- Docker Compose (`web` ejecuta Django)

## Roles

- `ADMINISTRADOR`: administra usuarios, vuelos, reservas y consultas del sistema.
- `CLIENTE`: busca vuelos, realiza reservas y consulta sus pagos y notificaciones.

## Pruebas

Las pruebas usan SQLite en memoria mediante `config.settings_test`, por lo que
no modifican la base MySQL de desarrollo:

```powershell
docker compose exec web pytest
```

## Datos para probar el sistema

Con los contenedores activos, ejecute estos comandos una sola vez para cargar
usuarios, vuelos, asientos, reservas y pagos de ejemplo:

```powershell
docker compose exec web python manage.py migrate --noinput
docker compose exec web python manage.py seed_base --admin-password "UnaClaveDemoSegura"
Get-Content app/vuelos/seed_operatico.sql -Raw | docker compose exec -T db sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
docker compose exec web python manage.py seed_demo_reservas
```

El último comando crea 15 reservas de prueba. Incluye pagos aprobados,
pendientes, en verificación y rechazados. Puede ejecutarse de nuevo sin
duplicar los datos.

Los vuelos estarán disponibles para las cuentas de cliente. El administrador
puede revisar todas las reservas en **Reservas**, mientras que cada cliente ve
solamente las suyas en **Mis reservas**.
