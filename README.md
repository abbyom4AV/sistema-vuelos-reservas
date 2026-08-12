# FlyTrack

Proyecto al transporte aéreo. “Vehículos” se representa mediante
aeronaves, “rutas y horarios” mediante rutas aéreas y vuelos programados, y los
asientos se asociarán a cada vuelo cuando ese módulo sea implementado.

## Tecnologías verificadas

- Python 3.12.13
- Django 5.2.16 y Django REST Framework 3.16.1
- MySQL 8.4.9 (`db`)
- JWT con `djangorestframework-simplejwt` 5.5.1
- drf-spectacular 0.28.0
- Docker Compose (`web` ejecuta Django)

## Roles

- `ADMINISTRADOR`: administra usuarios y consulta bitácora.
- `CLIENTE`: usa funcionalidades propias, perfil y notificaciones.

## Pruebas

Las pruebas usan SQLite en memoria mediante `config.settings_test`, por lo que
no modifican la base MySQL de desarrollo:

```powershell
docker compose exec web pytest
```

## Datos de demostración

Con los contenedores activos, un integrante puede cargar los mismos datos
locales de demostración con los siguientes comandos:

```powershell
docker compose exec web python manage.py migrate --noinput
docker compose exec web python manage.py seed_base --admin-password "UnaClaveDemoSegura"
Get-Content app/vuelos/seed_operatico.sql -Raw | docker compose exec -T db sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
docker compose exec web python manage.py seed_demo_reservas
```

La última semilla es idempotente y crea 15 reservas con pagos aprobados,
pendientes, en verificación y rechazados para el panel administrativo.
