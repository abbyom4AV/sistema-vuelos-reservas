# FlyTrack

Proyecto  al transporte aéreo. “Vehículos” se representa mediante
aeronaves, “rutas y horarios” mediante rutas aéreas y vuelos programados, y los
asientos se asociarán a cada vuelo cuando ese módulo sea implementado.


## Tecnologías verificadas

- Python 3.12.13
- Django 5.2.16 y Django REST Framework 3.16.1
- MySQL 8.4.9 (`db`)
- JWT con `djangorestframework-simplejwt` 5.5.1
- drf-spectacular 0.28.0
- Docker Compose (`web` ejecuta Django)

## Servicios y accesos

- Aplicación: `http://localhost:8000/`
- Swagger UI: `http://localhost:8000/api/docs/`
- OpenAPI: `http://localhost:8000/api/schema/`
- MySQL local: puerto `3307`

## Roles

- `ADMINISTRADOR`: administra usuarios y consulta bitácora.
- `CLIENTE`: usa funcionalidades propias, perfil y notificaciones.

## Pruebas

Las pruebas usan SQLite en memoria mediante `config.settings_test`, por lo que
no modifican la base MySQL de desarrollo:
