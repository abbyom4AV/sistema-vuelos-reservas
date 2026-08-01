document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const formulario = document.querySelector("#form-busqueda-vuelos");
  const origenInput = document.querySelector("#vuelo-origen");
  const destinoInput = document.querySelector("#vuelo-destino");
  const fechaInput = document.querySelector("#vuelo-fecha");
  const estadoBusqueda = document.querySelector("#estado-busqueda");
  const listaResultados = document.querySelector("#lista-resultados-vuelos");

  if (!formulario) {
    return;
  }

  formulario.addEventListener("submit", async function (event) {
    event.preventDefault();

    const origen = origenInput.value.trim().toLowerCase();
    const destino = destinoInput.value.trim().toLowerCase();
    const fecha = fechaInput.value;

    estadoBusqueda.className = "alert alert-info";
    estadoBusqueda.textContent = "Buscando vuelos disponibles...";
    listaResultados.innerHTML = "";

    try {
      const parametros = new URLSearchParams();

      if (origen) parametros.set("origen", origen);
      if (destino) parametros.set("destino", destino);
      if (fecha) parametros.set("fecha", fecha);
      parametros.set("disponibles", "true");

      const respuesta = await API.get(
        `/api/vuelos/vuelos/?${parametros.toString()}`
      );

      let vuelos = [];

      if (Array.isArray(respuesta)) {
        vuelos = respuesta;
      } else if (Array.isArray(respuesta?.data)) {
        vuelos = respuesta.data;
      } else if (Array.isArray(respuesta?.results)) {
        vuelos = respuesta.results;
      }

      console.log("Vuelos recibidos:", vuelos);

      const vuelosDisponibles = vuelos.filter(function (vuelo) {
        const ruta = vuelo.ruta_detalle || {};

        const origenVuelo = String(
          ruta.origen || ""
        ).trim().toLowerCase();

        const destinoVuelo = String(
          ruta.destino || ""
        ).trim().toLowerCase();

        const coincideOrigen =
          !origen ||
          origenVuelo.includes(origen);

        const coincideDestino =
          !destino ||
          destinoVuelo.includes(destino);

        const coincideFecha =
          !fecha ||
          vuelo.fecha === fecha;

        const estaDisponible =
          vuelo.estado === "PROGRAMADO" ||
          vuelo.estado === "ACTIVO";

        const tieneCupos =
          Number(vuelo.cupos_disponibles ?? 0) > 0;

        return (
          coincideOrigen &&
          coincideDestino &&
          coincideFecha &&
          estaDisponible &&
          tieneCupos
        );
      });

      renderizarVuelos(vuelosDisponibles);

    } catch (error) {
      console.error("Error buscando vuelos:", error);

      estadoBusqueda.className = "alert alert-danger";
      estadoBusqueda.textContent =
        "No fue posible consultar los vuelos. Intenta nuevamente.";
    }
  });

  function renderizarVuelos(vuelos) {
    listaResultados.innerHTML = "";

    if (!vuelos || vuelos.length === 0) {
      estadoBusqueda.className = "alert alert-warning";
      estadoBusqueda.textContent =
        "No se encontraron vuelos disponibles con los criterios seleccionados.";
      return;
    }

    estadoBusqueda.className = "alert alert-success";
    estadoBusqueda.textContent =
      `Se encontraron ${vuelos.length} vuelo(s) disponible(s).`;

    vuelos.forEach(function (vuelo) {
      const ruta = vuelo.ruta_detalle || {};
      const aeronave = vuelo.aeronave_detalle || {};

      const tarjeta = document.createElement("div");
      tarjeta.className = "col-12 col-lg-6";

      tarjeta.innerHTML = `
        <article class="card h-100 shadow-sm">
          <div class="card-body">

            <div class="d-flex justify-content-between align-items-start mb-3">
              <span class="badge bg-success">
                Disponible
              </span>

              <strong class="text-primary">
                ${API.escapeHtml(vuelo.precio_base ?? "—")}
              </strong>
            </div>

            <h3 class="h5">
              ${API.escapeHtml(ruta.origen || "—")}
              <i class="bi bi-arrow-right"></i>
              ${API.escapeHtml(ruta.destino || "—")}
            </h3>

            <div class="mt-3">

              <p class="mb-2">
                <i class="bi bi-calendar3"></i>
                <strong>Fecha:</strong>
                ${API.escapeHtml(vuelo.fecha || "—")}
              </p>

              <p class="mb-2">
                <i class="bi bi-clock"></i>
                <strong>Hora:</strong>
                ${API.escapeHtml(vuelo.hora || "—")}
              </p>

              <p class="mb-2">
                <i class="bi bi-airplane"></i>
                <strong>Aeronave:</strong>
                ${API.escapeHtml(aeronave.codigo || "—")}
              </p>

              <p class="mb-3">
                <i class="bi bi-person-check"></i>
                <strong>Cupos disponibles:</strong>
                ${API.escapeHtml(vuelo.cupos_disponibles ?? "0")}
              </p>

              <button
                type="button"
                class="btn btn-primary w-100 btn-seleccionar-vuelo"
                data-vuelo-id="${vuelo.id}"
              >
                <i class="bi bi-grid-3x3-gap"></i>
                Seleccionar vuelo
              </button>

            </div>
          </div>
        </article>
      `;

      listaResultados.appendChild(tarjeta);
    });

    document
      .querySelectorAll(".btn-seleccionar-vuelo")
      .forEach(function (boton) {
        boton.addEventListener(
          "click",
          function () {

            const vueloId =
              this.dataset.vueloId;


            if (!vueloId) {

              alert(
                "No fue posible identificar el vuelo seleccionado."
              );

              return;

            }


            window.location.href =
              `/asientos/?vuelo=${encodeURIComponent(vueloId)}`;

          }
        );
      });
  }
});