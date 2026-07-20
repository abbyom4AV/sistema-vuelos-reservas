import pytest

from notificaciones.models import Notificacion
from usuarios.models import Usuario


@pytest.mark.django_db
def test_administrador_lista_usuarios(authenticated_admin, admin_user):
    response = authenticated_admin.get("/api/usuarios/")

    assert response.status_code == 200
    assert response.data["success"] is True
    assert any(
        item["email"] == admin_user.email
        for item in response.data["data"]
    )


@pytest.mark.django_db
def test_cliente_no_lista_usuarios(authenticated_client):
    response = authenticated_client.get("/api/usuarios/")

    assert response.status_code == 403
    assert response.data["errorCode"] == "ROL_NO_AUTORIZADO"


@pytest.mark.django_db
def test_administrador_crea_usuario_y_notifica(
    authenticated_admin,
    roles,
):
    _, client_role = roles
    response = authenticated_admin.post(
        "/api/usuarios/",
        {
            "email": "nuevo@test.local",
            "username": "nuevo_test",
            "first_name": "Nuevo",
            "last_name": "Usuario",
            "rol_id": client_role.pk,
            "password": "ClaveSegura123!",
        },
        format="json",
    )

    assert response.status_code == 201
    user = Usuario.objects.get(email="nuevo@test.local")
    notification = Notificacion.objects.get(usuario=user)
    assert notification.tipo == Notificacion.Tipo.SISTEMA
    assert notification.titulo == "Cuenta creada"


@pytest.mark.django_db
def test_cambio_estado_notifica_una_sola_vez(
    authenticated_admin,
    client_user,
):
    url = f"/api/usuarios/{client_user.pk}/estado/"
    first = authenticated_admin.patch(
        url,
        {"activo": False},
        format="json",
    )
    second = authenticated_admin.patch(
        url,
        {"activo": False},
        format="json",
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert Notificacion.objects.filter(
        usuario=client_user,
        titulo="Cuenta desactivada",
    ).count() == 1


@pytest.mark.django_db
def test_perfil_autenticado(authenticated_client, client_user):
    response = authenticated_client.get("/api/usuarios/perfil/")

    assert response.status_code == 200
    assert response.data["data"]["email"] == client_user.email
