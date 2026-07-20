import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from usuarios.models import Rol, Usuario


@pytest.fixture
def roles(db):
    admin, _ = Rol.objects.get_or_create(nombre="ADMINISTRADOR")
    client, _ = Rol.objects.get_or_create(nombre="CLIENTE")
    return admin, client


@pytest.fixture
def admin_user(db, roles):
    admin, _ = roles
    return Usuario.objects.create_user(
        email="admin@test.local",
        username="admin_test",
        password="ClaveSegura123!",
        rol=admin,
        is_staff=True,
    )


@pytest.fixture
def client_user(db, roles):
    _, client = roles
    return Usuario.objects.create_user(
        email="cliente@test.local",
        username="cliente_test",
        password="ClaveSegura123!",
        rol=client,
    )


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def authenticated_admin(api_client, admin_user):
    token = RefreshToken.for_user(admin_user).access_token
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return api_client


@pytest.fixture
def authenticated_client(api_client, client_user):
    token = RefreshToken.for_user(client_user).access_token
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return api_client
