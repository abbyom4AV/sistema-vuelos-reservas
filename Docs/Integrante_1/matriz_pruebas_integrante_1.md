# Matriz de pruebas — Integrante 1

Las pruebas automatizadas usan SQLite en memoria para mantener aislamiento y
evitar afectar la base MySQL de desarrollo. Las funciones principales se
validan adicionalmente mediante pruebas manuales e integración con MySQL en
Docker.

| ID | Módulo | Objetivo | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|
| AUT-01 | Autenticación | Login válido genera desafío OTP | HTTP 200 y OTP creado | Pendiente de ejecución final | `test_login_correcto_generates_otp` |
| AUT-02 | Autenticación | Rechazar credenciales inválidas | HTTP 401 | Pendiente de ejecución final | `test_login_incorrecto_uses_error_envelope` |
| AUT-03 | OTP | Rechazar código incorrecto | HTTP 401 / OTP_INVALIDO | Pendiente de ejecución final | `test_otp_incorrecto` |
| AUT-04 | OTP | Rechazar OTP expirado | HTTP 401 / OTP_EXPIRADO | Pendiente de ejecución final | `test_otp_expirado` |
| AUT-05 | Seguridad | Rechazar endpoint sin token | HTTP 401 / TOKEN_AUSENTE | Pendiente de ejecución final | `test_endpoint_protegido_sin_token_retorna_401` |
| PW-01 | Contraseña | Cambio correcto y login posterior | HTTP 200 + notificación | Pendiente de ejecución final | `test_cambio_contrasena_crea_notificacion_y_permite_nuevo_login` |
| PW-02 | Contraseña | Rechazar contraseña actual incorrecta | HTTP 400 | Pendiente de ejecución final | `test_cambio_contrasena_rechaza_contrasena_actual_incorrecta` |
| PW-03 | Contraseña | Rechazar confirmación diferente | HTTP 400 | Pendiente de ejecución final | `test_cambio_contrasena_rechaza_confirmacion_diferente` |
| USR-01 | Usuarios | Administrador lista usuarios | HTTP 200 | Pendiente de ejecución final | `test_administrador_lista_usuarios` |
| USR-02 | Permisos | Cliente no lista usuarios | HTTP 403 | Pendiente de ejecución final | `test_cliente_no_lista_usuarios` |
| AUD-01 | Bitácora | Consulta y filtros administrativos | HTTP 200 | Pendiente de ejecución final | `test_administrador_consulta_bitacora_y_filtros` |
| NOT-01 | Notificaciones | Privacidad entre usuarios | Solo registros propios | Pendiente de ejecución final | `test_usuario_solo_consulta_sus_notificaciones` |

## Evidencia manual pendiente

Insertar capturas de login, OTP, cambio de contraseña, bitácora y
notificaciones ejecutadas contra MySQL en Docker.
