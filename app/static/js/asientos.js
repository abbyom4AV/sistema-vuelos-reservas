document.addEventListener("DOMContentLoaded", function () {
"use strict";

const listaAsientos = document.querySelector("#lista-asientos");
const estadoAsientos = document.querySelector("#estado-asientos");
const informacionVuelo = document.querySelector("#informacion-vuelo");
const resumenAsiento = document.querySelector("#resumen-asiento");
const asientoSeleccionadoElemento =
document.querySelector("#asiento-seleccionado");
const botonConfirmar =
document.querySelector("#btn-confirmar-asiento");

const parametros = new URLSearchParams(
window.location.search
);

const vueloId = parametros.get("vuelo");

let asientoSeleccionado = null;
let vueloActual = null;

if (!vueloId) {
if (estadoAsientos) {
estadoAsientos.className = "alert alert-danger";
estadoAsientos.textContent =
"No se indicó el vuelo que deseas reservar.";
}


if (botonConfirmar) {
  botonConfirmar.disabled = true;
}

return;


}

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

async function cargarVuelo() {
try {
const vuelo = await API.get(
`/api/vuelos/vuelos/${encodeURIComponent(vueloId)}/`
);


  vueloActual = vuelo;

  const ruta = vuelo?.ruta_detalle || {};
  const aeronave = vuelo?.aeronave_detalle || {};

  if (informacionVuelo) {
    informacionVuelo.innerHTML = `
      <strong>
        ${API.escapeHtml(ruta.origen || "—")}
      </strong>

      <i class="bi bi-arrow-right"></i>

      <strong>
        ${API.escapeHtml(ruta.destino || "—")}
      </strong>

      · ${API.escapeHtml(vuelo.fecha || "—")}
      · ${API.escapeHtml(vuelo.hora || "—")}
      · ${API.escapeHtml(
        aeronave.modelo ||
        aeronave.codigo ||
        "—"
      )}
    `;
  }

} catch (error) {
  console.error(
    "Error cargando vuelo:",
    error
  );

  if (informacionVuelo) {
    informacionVuelo.textContent =
      "No fue posible cargar la información del vuelo.";
  }
}


}

async function cargarAsientos() {
try {
if (estadoAsientos) {
estadoAsientos.className =
"alert alert-info";


    estadoAsientos.textContent =
      "Cargando matriz de asientos...";
  }

  const respuesta = await API.get(
    `/api/vuelos/asientos/?vuelo=${encodeURIComponent(vueloId)}`
  );

  const asientos = obtenerLista(respuesta);

  renderizarAsientos(asientos);

} catch (error) {
  console.error(
    "Error cargando asientos:",
    error
  );

  if (estadoAsientos) {
    estadoAsientos.className =
      "alert alert-danger";

    estadoAsientos.textContent =
      error.message ||
      "No fue posible consultar los asientos.";
  }
}


}

function renderizarAsientos(asientos) {
if (!listaAsientos) {
return;
}


listaAsientos.innerHTML = "";

if (!asientos.length) {
  listaAsientos.innerHTML = `
    <div class="alert alert-warning">
      No hay asientos disponibles para este vuelo.
    </div>
  `;

  return;
}

/*
 * Ordenar por número de asiento.
 */
asientos.sort(function (a, b) {
  return (
    Number(a.numero || 0) -
    Number(b.numero || 0)
  );
});

/*
 * Agrupar los asientos en filas de 6.
 *
 * Distribución:
 *
 * A B C | D E F
 *
 * El espacio central representa el PASILLO.
 */
const filas = {};

asientos.forEach(function (asiento) {
  let fila =
    asiento.fila ||
    Math.ceil(
      Number(asiento.numero || 1) / 6
    );

  if (!filas[fila]) {
    filas[fila] = [];
  }

  filas[fila].push(asiento);
});

const contenedor = document.createElement("div");

contenedor.className =
  "matriz-asientos";

Object.keys(filas)
  .sort(function (a, b) {
    return Number(a) - Number(b);
  })
  .forEach(function (numeroFila) {

    const filaAsientos =
      filas[numeroFila];

    /*
     * Crear una fila visual.
     */
    const fila = document.createElement("div");

    fila.className =
      "fila-asientos";

    /*
     * Número de fila.
     */
    const numero = document.createElement(
      "div"
    );

    numero.className =
      "numero-fila";

    numero.textContent =
      numeroFila;

    fila.appendChild(numero);

    /*
     * Asientos A, B, C
     */
    const bloqueIzquierdo =
      document.createElement("div");

    bloqueIzquierdo.className =
      "bloque-asientos";

    /*
     * Pasillo.
     */
    const pasillo =
      document.createElement("div");

    pasillo.className =
      "pasillo-asientos";

    pasillo.innerHTML =
      "<span>PASILLO</span>";

    /*
     * Asientos D, E, F.
     */
    const bloqueDerecho =
      document.createElement("div");

    bloqueDerecho.className =
      "bloque-asientos";

    /*
     * Crear exactamente 6 posiciones.
     */
    for (let posicion = 0;
         posicion < 6;
         posicion++) {

      const asiento =
        filaAsientos[posicion];

      const boton =
        document.createElement("button");

      boton.type = "button";

      boton.className =
        "asiento-boton";

      /*
       * Si no existe asiento en esa posición,
       * dejamos el espacio vacío.
       */
      if (!asiento) {

        boton.classList.add(
          "asiento-vacio"
        );

        boton.disabled = true;

      } else {

        const estado = String(
          asiento.estado || "DISPONIBLE"
        )
          .trim()
          .toUpperCase();

        const letra =
          asiento.letra ||
          "ABCDEF"[posicion];

        boton.textContent =
          `${numeroFila}${letra}`;

        boton.dataset.asientoId =
          asiento.id;

        boton.dataset.estado =
          estado;

        if (
          estado === "RESERVADO" ||
          estado === "BLOQUEADO"
        ) {

          boton.disabled = true;

          boton.classList.add(
            estado === "RESERVADO"
              ? "asiento-reservado"
              : "asiento-bloqueado"
          );

        } else {

          boton.classList.add(
            "asiento-disponible"
          );

          boton.addEventListener(
            "click",
            function () {

              seleccionarAsiento(
                asiento,
                boton
              );

            }
          );
        }
      }

      /*
       * A, B, C
       */
      if (posicion < 3) {

        bloqueIzquierdo.appendChild(
          boton
        );

      } else {

        /*
         * D, E, F
         */
        bloqueDerecho.appendChild(
          boton
        );
      }
    }

    fila.appendChild(
      bloqueIzquierdo
    );

    fila.appendChild(
      pasillo
    );

    fila.appendChild(
      bloqueDerecho
    );

    contenedor.appendChild(
      fila
    );
  });

listaAsientos.appendChild(
  contenedor
);

if (estadoAsientos) {
  estadoAsientos.className =
    "alert alert-success";

  estadoAsientos.textContent =
    "Selecciona un asiento disponible.";
}


}

function seleccionarAsiento(
asiento,
boton
) {


/*
 * Quitar selección anterior.
 */
document
  .querySelectorAll(
    ".asiento-boton.asiento-seleccionado"
  )
  .forEach(function (elemento) {

    elemento.classList.remove(
      "asiento-seleccionado"
    );

  });

/*
 * Marcar nuevo asiento.
 */
boton.classList.add(
  "asiento-seleccionado"
);

asientoSeleccionado =
  asiento;

const codigo =
  asiento.codigo ||
  `${asiento.fila || Math.ceil(
    asiento.numero / 6
  )}${
    asiento.letra ||
    "ABCDEF"[
      (asiento.numero - 1) % 6
    ]
  }`;

if (asientoSeleccionadoElemento) {

  asientoSeleccionadoElemento.textContent =
    codigo;

}

if (resumenAsiento) {

  resumenAsiento.style.display =
    "block";

}

if (botonConfirmar) {

  botonConfirmar.disabled =
    false;

}


}

/*
 * Envía el resultado del pago simulado
 * al backend y actualiza la interfaz
 * con el resultado real de la reserva.
 */
async function procesarPago(
resultado,
reserva,
metodo
) {

const btnAprobado =
  document.querySelector(
    "#btn-pago-aprobado"
  );

const btnRechazado =
  document.querySelector(
    "#btn-pago-rechazado"
  );

const resultadoPago =
  document.querySelector(
    "#resultado-pago"
  );

if (btnAprobado) btnAprobado.disabled = true;
if (btnRechazado) btnRechazado.disabled = true;

try {

  const pago = await API.post(
    "/api/pagos/pagos/",
    {
      reserva: Number(reserva?.id),
      resultado: resultado,
      monto: Number(
        vueloActual?.precio_base || 0
      ),
      metodo: metodo,
    }
  );

  if (resultadoPago) {

    if (pago.estado === "APROBADO") {

      resultadoPago.innerHTML = `
        <div class="alert alert-success mb-0">
          <i class="bi bi-check-circle-fill"></i>
          Pago aprobado. Tu reserva quedó
          <strong>confirmada</strong>.
        </div>
      `;

    } else {

      resultadoPago.innerHTML = `
        <div class="alert alert-danger mb-0">
          <i class="bi bi-x-circle-fill"></i>
          Pago rechazado. Tu reserva fue
          <strong>cancelada</strong> y el asiento
          quedó disponible nuevamente.
        </div>
      `;
    }
  }

  if (btnAprobado) btnAprobado.style.display = "none";
  if (btnRechazado) btnRechazado.style.display = "none";

  /*
   * Recargar la matriz para reflejar
   * el estado real del asiento tras el pago.
   */
  await cargarAsientos();

} catch (error) {

  console.error(
    "Error procesando el pago:",
    error
  );

  if (resultadoPago) {

    resultadoPago.innerHTML = `
      <div class="alert alert-danger mb-0">
        ${API.escapeHtml(
          error.message ||
          "No fue posible procesar el pago."
        )}
      </div>
    `;
  }

  if (btnAprobado) btnAprobado.disabled = false;
  if (btnRechazado) btnRechazado.disabled = false;
}


}

if (botonConfirmar) {


botonConfirmar.addEventListener(
  "click",
  async function () {

    if (!asientoSeleccionado) {

      window.alert(
        "Selecciona un asiento antes de continuar."
      );

      return;
    }

    botonConfirmar.disabled =
      true;

    botonConfirmar.innerHTML = `
      <span
        class="spinner-border spinner-border-sm"
      ></span>

      Creando reserva...
    `;

    try {

      const reserva =
        await API.post(
          "/api/reservas/reservas/",
          {
            vuelo:
              Number(vueloId),

            asiento:
              Number(
                asientoSeleccionado.id
              ),
          }
        );

      const codigo =
        reserva?.asiento_detalle?.codigo ||
        asientoSeleccionado.codigo ||
        `Asiento ${
          asientoSeleccionado.numero
        }`;

      if (resumenAsiento) {

        resumenAsiento.style.display =
          "block";

        resumenAsiento.innerHTML = `

          <div class="alert alert-success">

            <h4 class="alert-heading">

              <i
                class="bi bi-check-circle-fill"
              ></i>

              Reserva creada correctamente

            </h4>

            <p class="mb-2">

              Tu asiento seleccionado es:

              <strong>
                ${API.escapeHtml(
                  codigo
                )}
              </strong>

            </p>

            <p class="mb-0">

              Código de reserva:

              <strong>
                #${API.escapeHtml(
                  reserva?.id || ""
                )}
              </strong>

            </p>

          </div>

<div class="mb-3">

            <label
              for="select-metodo-pago"
              class="form-label fw-semibold"
            >
              Método de pago
            </label>

            <select
              id="select-metodo-pago"
              class="form-select"
            >
              <option value="TARJETA">
                Tarjeta
              </option>
              <option value="EFECTIVO">
                Efectivo
              </option>
            </select>

          </div>

          <p class="fw-semibold mb-2">
            Simula el resultado del pago:
          </p>

          <div
            class="d-grid gap-2 d-sm-flex"
          >

            <button
              type="button"
              id="btn-pago-aprobado"
              class="btn btn-success btn-lg flex-fill"
            >

              <i
                class="bi bi-check-circle"
              ></i>

              Simular pago aprobado

            </button>

            <button
              type="button"
              id="btn-pago-rechazado"
              class="btn btn-outline-danger btn-lg flex-fill"
            >

              <i
                class="bi bi-x-circle"
              ></i>

              Simular pago rechazado

            </button>

          </div>

          <div
            id="resultado-pago"
            class="mt-3"
          ></div>

        `;

        const btnPagoAprobado =
          document.querySelector(
            "#btn-pago-aprobado"
          );

        const btnPagoRechazado =
          document.querySelector(
            "#btn-pago-rechazado"
          );

if (btnPagoAprobado) {

          btnPagoAprobado.addEventListener(
            "click",
            function () {

              const selectMetodo =
                document.querySelector(
                  "#select-metodo-pago"
                );

              procesarPago(
                "APROBADO",
                reserva,
                selectMetodo
                  ? selectMetodo.value
                  : "TARJETA"
              );
            }
          );
        }

        if (btnPagoRechazado) {

          btnPagoRechazado.addEventListener(
            "click",
            function () {

              const selectMetodo =
                document.querySelector(
                  "#select-metodo-pago"
                );

              procesarPago(
                "RECHAZADO",
                reserva,
                selectMetodo
                  ? selectMetodo.value
                  : "TARJETA"
              );
            }
          );
        }
      }

      if (estadoAsientos) {

        estadoAsientos.className =
          "alert alert-success";

        estadoAsientos.textContent =
          "Reserva registrada correctamente. El asiento ya no está disponible para otra reserva.";

      }

      /*
       * Recargar la matriz para que el asiento
       * confirmado pase inmediatamente a reservado.
       */
      await cargarAsientos();

      /*
       * Evitar que se pueda crear otra reserva
       * desde el mismo flujo.
       */
      botonConfirmar.style.display =
        "none";

    } catch (error) {

      console.error(
        "Error creando reserva:",
        error
      );

      if (estadoAsientos) {

        estadoAsientos.className =
          "alert alert-danger";

        estadoAsientos.textContent =
          error.message ||
          "No fue posible crear la reserva. El asiento puede haber sido reservado por otro usuario.";

      }

      botonConfirmar.disabled =
        false;

      botonConfirmar.innerHTML = `

        <i
          class="bi bi-check-circle"
        ></i>

        Confirmar asiento y crear reserva

      `;
    }
  }
);


}

cargarVuelo();

cargarAsientos();

});