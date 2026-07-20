import pytest

from notificaciones.models import Notificacion


@pytest.mark.django_db
def test_usuario_solo_consulta_sus_notificaciones(
    authenticated_client,
    client_user,
    admin_user,
):
    own = Notificacion.objects.create(
        usuario=client_user,
        tipo=Notificacion.Tipo.SEGURIDAD,
        titulo="Propia",
        mensaje="Visible.",
    )
    Notificacion.objects.create(
        usuario=admin_user,
        tipo=Notificacion.Tipo.SISTEMA,
        titulo="Ajena",
        mensaje="No visible.",
    )

    response = authenticated_client.get("/api/notificaciones/")

    assert response.status_code == 200
    ids = [item["id"] for item in response.data["data"]]
    assert own.pk in ids
    assert len(ids) == 1


@pytest.mark.django_db
def test_usuario_no_consulta_ni_modifica_notificacion_ajena(
    authenticated_client,
    admin_user,
):
    foreign = Notificacion.objects.create(
        usuario=admin_user,
        tipo=Notificacion.Tipo.SISTEMA,
        titulo="Ajena",
        mensaje="Privada.",
    )

    get_response = authenticated_client.get(
        f"/api/notificaciones/{foreign.pk}/"
    )
    patch_response = authenticated_client.patch(
        f"/api/notificaciones/{foreign.pk}/leida/",
        format="json",
    )

    assert get_response.status_code == 404
    assert patch_response.status_code == 404


@pytest.mark.django_db
def test_marcar_notificaciones_leidas(authenticated_client, client_user):
    pending = Notificacion.objects.create(
        usuario=client_user,
        tipo=Notificacion.Tipo.SEGURIDAD,
        titulo="Pendiente",
        mensaje="Leer.",
    )

    response = authenticated_client.patch(
        f"/api/notificaciones/{pending.pk}/leida/",
        format="json",
    )

    pending.refresh_from_db()
    assert response.status_code == 200
    assert pending.leida is True

    all_response = authenticated_client.patch(
        "/api/notificaciones/marcar-todas-leidas/",
        format="json",
    )
    assert all_response.status_code == 200


@pytest.mark.django_db
def test_notificaciones_bloquean_crud_generico(
    authenticated_client,
    client_user,
):
    notification = Notificacion.objects.create(
        usuario=client_user,
        tipo=Notificacion.Tipo.SISTEMA,
        titulo="Sin CRUD",
        mensaje="Solo lectura.",
    )

    responses = [
        authenticated_client.post(
            "/api/notificaciones/",
            {},
            format="json",
        ),
        authenticated_client.put(
            f"/api/notificaciones/{notification.pk}/",
            {},
            format="json",
        ),
        authenticated_client.patch(
            f"/api/notificaciones/{notification.pk}/",
            {},
            format="json",
        ),
    ]

    assert all(response.status_code == 405 for response in responses)
