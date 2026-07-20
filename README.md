# FlyTrack

Proyecto #9 delimitado al transporte aéreo. “Vehículos” se representa mediante
aeronaves, “rutas y horarios” mediante rutas aéreas y vuelos programados, y los
asientos se asociarán a cada vuelo cuando ese módulo sea implementado.

Este paquete técnico del Integrante 1 incluye autenticación JWT con OTP
académico, roles, usuarios, cambio de contraseña, bitácora y notificaciones.
No implementa aeronaves, rutas, vuelos, asientos, reservas, pagos,
comprobantes, cancelaciones ni reportes.

## Alcance y delimitación

Fuera de alcance: autobuses, trenes, transporte privado, escalas, conexiones,
múltiples aerolíneas, mapa complejo de avión, clases de cabina, recuperación
automática de contraseña, pasarelas reales, reembolsos y reservas de múltiples
pasajeros.

## Tecnologías verificadas

- Python 3.12.13
- Django 5.2.16 y Django REST Framework 3.16.1
- MySQL 8.4.9 (`db`)
- JWT con `djangorestframework-simplejwt` 5.5.1
- drf-spectacular 0.28.0
- Docker Compose (`web` ejecuta Django)

## Inicio rápido

1. Copie `.env.example` a `.env` y reemplace los valores de ejemplo.
2. Ejecute `docker compose up --build`.
3. Aplique migraciones: `docker compose exec web python manage.py migrate`.
4. Cree semillas sin exponer contraseñas en el repositorio:

   ```powershell
   docker compose exec web python manage.py seed_base --admin-password "una-clave-local-segura"
   ```

5. Abra `http://localhost:8000/`.

No ejecute `flush`. El comando de semillas es idempotente y no elimina datos.

## Servicios y accesos

- Aplicación: `http://localhost:8000/`
- Swagger UI: `http://localhost:8000/api/docs/`
- OpenAPI: `http://localhost:8000/api/schema/`
- MySQL local: puerto `3307`

## Roles

- `ADMINISTRADOR`: administra usuarios y consulta bitácora.
- `CLIENTE`: usa funcionalidades propias, perfil y notificaciones.

## API base

Las respuestas usan `success`, `message`, `data`; los errores controlados
incluyen `errorCode` y `errors`. Los módulos disponibles son:

- `/api/auth/`: login, OTP, refresh, logout y cambio de contraseña.
- `/api/usuarios/`: perfil y gestión administrativa de usuarios.
- `/api/bitacora/`: consulta administrativa de eventos.
- `/api/notificaciones/`: consulta y marcado de notificaciones propias.

La documentación detallada está en Swagger y `Docs/Integrante_1/`.

## Pruebas

Las pruebas usan SQLite en memoria mediante `config.settings_test`, por lo que
no modifican la base MySQL de desarrollo:

```powershell
docker compose exec web pytest -q
```

## Validación

```powershell
docker compose exec web python manage.py check
docker compose exec web python manage.py makemigrations --check --dry-run
docker compose exec web python manage.py spectacular --file /tmp/openapi.yaml --validate
docker compose exec web pytest -q
```

## Flujo para integrantes posteriores

No cambie contratos, IDs de interfaz ni helpers base. Los módulos de dominio
deben reutilizar `registrar_evento` para bitácora y `crear_notificacion` para
notificaciones, además de los roles y el formato uniforme de respuesta.
