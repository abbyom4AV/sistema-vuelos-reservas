import pytest
from django.utils import timezone

from auditoria.models import Bitacora


@pytest.mark.django_db
def test_administrador_consulta_bitacora_y_filtros(
    authenticated_admin,
    admin_user,
):
    event = Bitacora.objects.create(
        usuario=admin_user,
        accion="PRUEBA",
        entidad="Usuario",
        resultado=Bitacora.Resultado.EXITO,
        metodo_http="POST",
    )

    response = authenticated_admin.get(
        "/api/bitacora/",
        {
            "usuario": str(admin_user.pk),
            "accion": "PRUEBA",
            "entidad": "Usuario",
            "resultado": "EXITO",
            "metodo": "POST",
            "fecha_desde": timezone.localdate().isoformat(),
            "fecha_hasta": timezone.localdate().isoformat(),
        },
    )

    assert response.status_code == 200
    assert response.data["data"][0]["id"] == event.pk


@pytest.mark.django_db
def test_cliente_no_consulta_bitacora(authenticated_client):
    response = authenticated_client.get("/api/bitacora/")

    assert response.status_code == 403
    assert response.data["errorCode"] == "ROL_NO_AUTORIZADO"


@pytest.mark.django_db
def test_bitacora_es_solo_lectura(authenticated_admin):
    bitacora = Bitacora.objects.create(
        accion="SOLO_LECTURA",
        entidad="Sistema",
    )

    responses = [
        authenticated_admin.post("/api/bitacora/", {}, format="json"),
        authenticated_admin.put(
            f"/api/bitacora/{bitacora.pk}/",
            {},
            format="json",
        ),
        authenticated_admin.patch(
            f"/api/bitacora/{bitacora.pk}/",
            {},
            format="json",
        ),
    ]

    assert all(response.status_code == 405 for response in responses)
