import pytest
from django.core import signing
from django.utils import timezone

from autenticacion.models import CodigoOTP
from autenticacion.services import generar_codigo_otp
from autenticacion.views import OTP_SIGNING_SALT
from notificaciones.models import Notificacion
from auditoria.models import Bitacora
from usuarios.models import Usuario


@pytest.mark.django_db
def test_login_correcto_generates_otp(api_client, client_user):
    response = api_client.post(
        "/api/auth/login/",
        {
            "email": client_user.email,
            "password": "ClaveSegura123!",
        },
        format="json",
    )

    assert response.status_code == 200
    assert response.data["success"] is True
    assert response.data["data"]["otp_requerido"] is True
    assert CodigoOTP.objects.filter(usuario=client_user).exists()


@pytest.mark.django_db
def test_registro_publico_crea_solo_cliente(
    api_client,
    roles,
):
    response = api_client.post(
        "/api/auth/registro/",
        {
            "first_name": "Nuevo",
            "last_name": "Cliente",
            "email": "nuevo.cliente@test.local",
            "username": "nuevo_cliente",
            "password": "ClaveSegura123!",
            "confirmar_password": "ClaveSegura123!",
        },
        format="json",
    )

    user = Usuario.objects.get(
        email="nuevo.cliente@test.local"
    )
    assert response.status_code == 201
    assert user.tiene_rol("CLIENTE")
    assert Notificacion.objects.filter(usuario=user).exists()
    assert Bitacora.objects.filter(
        usuario=user,
        accion="REGISTRO_CLIENTE",
    ).exists()


@pytest.mark.django_db
def test_login_incorrecto_uses_error_envelope(api_client, client_user):
    response = api_client.post(
        "/api/auth/login/",
        {
            "email": client_user.email,
            "password": "incorrecta",
        },
        format="json",
    )

    assert response.status_code == 401
    assert response.data["errorCode"] == "CREDENCIALES_INVALIDAS"


@pytest.mark.django_db
def test_usuario_inactivo_no_inicia_sesion(api_client, client_user):
    client_user.is_active = False
    client_user.save(update_fields=["is_active"])

    response = api_client.post(
        "/api/auth/login/",
        {
            "email": client_user.email,
            "password": "ClaveSegura123!",
        },
        format="json",
    )

    assert response.status_code == 403
    assert response.data["errorCode"] == "USUARIO_INACTIVO"


@pytest.mark.django_db
def test_otp_correcto_crea_tokens(api_client, client_user):
    _, code = generar_codigo_otp(client_user)
    otp_token = signing.dumps(
        {"usuario_id": client_user.pk},
        salt=OTP_SIGNING_SALT,
    )

    response = api_client.post(
        "/api/auth/verificar-otp/",
        {"otp_token": otp_token, "codigo": code},
        format="json",
    )

    assert response.status_code == 200
    assert response.data["data"]["access"]
    assert response.data["data"]["refresh"]


@pytest.mark.django_db
def test_otp_expirado(api_client, client_user):
    registro, code = generar_codigo_otp(client_user)
    registro.expira_en = timezone.now()
    registro.save(update_fields=["expira_en"])
    otp_token = signing.dumps(
        {"usuario_id": client_user.pk},
        salt=OTP_SIGNING_SALT,
    )

    response = api_client.post(
        "/api/auth/verificar-otp/",
        {"otp_token": otp_token, "codigo": code},
        format="json",
    )

    assert response.status_code == 401
    assert response.data["errorCode"] == "OTP_EXPIRADO"


@pytest.mark.django_db
def test_otp_incorrecto(api_client, client_user):
    generar_codigo_otp(client_user)
    otp_token = signing.dumps(
        {"usuario_id": client_user.pk},
        salt=OTP_SIGNING_SALT,
    )

    response = api_client.post(
        "/api/auth/verificar-otp/",
        {"otp_token": otp_token, "codigo": "000000"},
        format="json",
    )

    assert response.status_code == 401
    assert response.data["errorCode"] == "OTP_INVALIDO"


@pytest.mark.django_db
def test_endpoint_protegido_sin_token_retorna_401(api_client):
    response = api_client.get("/api/notificaciones/")

    assert response.status_code == 401
    assert response.data["errorCode"] == "TOKEN_AUSENTE"


@pytest.mark.django_db
def test_cambio_contrasena_rechaza_contrasena_actual_incorrecta(
    authenticated_client,
):
    response = authenticated_client.put(
        "/api/auth/cambiar-contrasena/",
        {
            "password_actual": "Incorrecta123!",
            "nueva_password": "NuevaClave123!",
            "confirmar_password": "NuevaClave123!",
        },
        format="json",
    )

    assert response.status_code == 400
    assert response.data["errorCode"] == (
        "CONTRASENA_ACTUAL_INCORRECTA"
    )


@pytest.mark.django_db
def test_cambio_contrasena_rechaza_confirmacion_diferente(
    authenticated_client,
):
    response = authenticated_client.put(
        "/api/auth/cambiar-contrasena/",
        {
            "password_actual": "ClaveSegura123!",
            "nueva_password": "NuevaClave123!",
            "confirmar_password": "OtraClave123!",
        },
        format="json",
    )

    assert response.status_code == 400
    assert response.data["errorCode"] == (
        "CONFIRMACION_CONTRASENA_INVALIDA"
    )


@pytest.mark.django_db
def test_cambio_contrasena_crea_notificacion_y_permite_nuevo_login(
    authenticated_client,
    client_user,
    api_client,
):
    response = authenticated_client.put(
        "/api/auth/cambiar-contrasena/",
        {
            "password_actual": "ClaveSegura123!",
            "nueva_password": "NuevaClave123!",
            "confirmar_password": "NuevaClave123!",
        },
        format="json",
    )

    assert response.status_code == 200
    assert Notificacion.objects.filter(
        usuario=client_user,
        tipo=Notificacion.Tipo.SEGURIDAD,
    ).exists()

    login = api_client.post(
        "/api/auth/login/",
        {
            "email": client_user.email,
            "password": "NuevaClave123!",
        },
        format="json",
    )
    assert login.status_code == 200
