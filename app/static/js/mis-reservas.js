document.addEventListener("DOMContentLoaded", function () {
"use strict";

const estadoMisReservas = document.querySelector("#estado-mis-reservas");
const listaMisReservas = document.querySelector("#lista-mis-reservas");
const sinReservas = document.querySelector("#sin-reservas");

function obtenerLista(respuesta) {

  if (Array.isArray(respuesta)) {
    return respuesta;
  }

  if (Array.isArray(respuesta?.results)) {
    return respuesta.results;
  }

  if (Array.isArray(respuesta?.data)) {
    return respuesta.data;
  }

  return [];
}

function badgeEstado(estado) {

  const mapa = {
    PENDIENTE_PAGO: "badge-warning",
    CONFIRMADA: "badge-success",
    CANCELADA: "badge-danger",
  };

  const textoLegible = {
    PENDIENTE_PAGO: "Pendiente de pago",
    CONFIRMADA: "Confirmada",
    CANCELADA: "Cancelada",
  };

  const clase = mapa[estado] || "badge-neutral";
  const texto = textoLegible[estado] || estado;

  return `<span class="badge-pill ${clase}">${API.escapeHtml(texto)}</span>`;
}

async function cargarMisReservas() {

  try {

    const data = await API.get(
      "/api/reservas/reservas/"
    );

    const reservas = obtenerLista(data);

    if (estadoMisReservas) {
      estadoMisReservas.style.display = "none";
    }

    if (!reservas.length) {

      if (sinReservas) {
        sinReservas.style.display = "flex";
      }

      return;
    }

    renderizarReservas(reservas);

  } catch (error) {

    console.error(
      "Error cargando mis reservas:",
      error
    );

    if (estadoMisReservas) {
      estadoMisReservas.className = "alert alert-danger";
      estadoMisReservas.textContent =
        error.message ||
        "No fue posible cargar tus reservas.";
    }
  }
}

function renderizarReservas(reservas) {

  if (!listaMisReservas) return;

  listaMisReservas.innerHTML = "";

  reservas.forEach(function (reserva) {

    const vuelo = reserva.vuelo_detalle || {};
    const ruta = vuelo.ruta || {};
    const asiento = reserva.asiento_detalle || {};

    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4";

    const puedeCancel =
      reserva.estado === "PENDIENTE_PAGO" ||
      reserva.estado === "CONFIRMADA";

    const puedeDescargarComprobante =
      reserva.estado === "CONFIRMADA";

    col.innerHTML = `
      <article class="card h-100">

        <div class="card-body">

          <div class="d-flex justify-content-between align-items-start mb-2">

            <strong class="mono">
              ${API.escapeHtml(reserva.codigo || ("#" + reserva.id))}
            </strong>

            ${badgeEstado(reserva.estado)}

          </div>

          <p class="mb-1">
            <i class="bi bi-airplane"></i>
            ${API.escapeHtml(ruta.origen || "—")}
            →
            ${API.escapeHtml(ruta.destino || "—")}
          </p>

          <p class="mb-1 text-subtle">
            ${API.escapeHtml(vuelo.fecha || "—")}
            ·
            ${API.escapeHtml(vuelo.hora || "—")}
          </p>

          <p class="mb-3">
            Asiento:
            <strong>
              ${API.escapeHtml(asiento.codigo || "—")}
            </strong>
          </p>

          <div class="d-flex flex-wrap gap-2">

            ${
              puedeDescargarComprobante
                ? `
                  <button
                    type="button"
                    class="btn btn-outline-primary btn-sm btn-comprobante"
                    data-reserva-id="${reserva.id}"
                  >
                    <i class="bi bi-file-earmark-pdf"></i>
                    Descargar comprobante
                  </button>
                `
                : ""
            }

            ${
              puedeCancel
                ? `
                  <button
                    type="button"
                    class="btn btn-danger-soft btn-sm btn-cancelar-mi-reserva"
                    data-reserva-id="${reserva.id}"
                  >
                    <i class="bi bi-x-circle"></i>
                    Cancelar
                  </button>
                `
                : ""
            }

          </div>

        </div>

      </article>
    `;

    listaMisReservas.appendChild(col);
  });

  document
    .querySelectorAll(".btn-cancelar-mi-reserva")
    .forEach(function (boton) {

      boton.addEventListener("click", function () {
        cancelarMiReserva(
          boton.dataset.reservaId
        );
      });
    });

  document
    .querySelectorAll(".btn-comprobante")
    .forEach(function (boton) {

      boton.addEventListener("click", function () {
        descargarComprobante(
          boton.dataset.reservaId,
          boton
        );
      });
    });
}

async function cancelarMiReserva(reservaId) {

  if (
    !window.confirm(
      "¿Deseas cancelar esta reserva? Esta acción no se puede deshacer."
    )
  ) {
    return;
  }

  try {

    await API.post(
      `/api/reservas/reservas/${reservaId}/cancelar/`
    );

    await cargarMisReservas();

  } catch (error) {

    console.error(
      "Error cancelando reserva:",
      error
    );

    window.alert(
      error.message ||
      "No fue posible cancelar la reserva."
    );
  }
}

async function descargarComprobante(reservaId, boton) {

  const textoOriginal = boton.innerHTML;

  boton.disabled = true;

  boton.innerHTML = `
    <span class="spinner spinner-border-sm"></span>
    Buscando pago...
  `;

  try {

    /*
     * Esta llamada usa API.get(), que ya sabe
     * renovar el access_token automáticamente
     * si expiró (ver api.js -> ejecutarPeticion).
     *
     * Así garantizamos que el token en
     * sessionStorage esté fresco antes del
     * fetch() manual de más abajo, que necesita
     * el binario del PDF y no puede pasar por
     * API.get()/API.post().
     */
    const pagos = await API.get(
      "/api/pagos/pagos/"
    );

    const listaPagos = obtenerLista(pagos);

    const pago = listaPagos.find(function (p) {
      return String(p.reserva) === String(reservaId);
    });

    if (!pago) {
      window.alert(
        "No se encontró un pago asociado a esta reserva."
      );
      return;
    }

    const token = window.sessionStorage.getItem("access_token");

    const respuesta = await fetch(
      `/api/pagos/pagos/${pago.id}/comprobante/`,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );

    if (respuesta.status === 401) {
      window.alert(
        "Tu sesión expiró. Vuelve a iniciar sesión e intenta de nuevo."
      );
      return;
    }

    if (!respuesta.ok) {
      throw new Error(
        "No fue posible generar el comprobante."
      );
    }

    const blob = await respuesta.blob();
    const url = window.URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = `comprobante_pago_${pago.id}.pdf`;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    window.URL.revokeObjectURL(url);

  } catch (error) {

    console.error(
      "Error descargando comprobante:",
      error
    );

    window.alert(
      error.message ||
      "No fue posible descargar el comprobante."
    );

  } finally {

    boton.disabled = false;
    boton.innerHTML = textoOriginal;
  }
}

cargarMisReservas();

});