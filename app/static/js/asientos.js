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

asientos.sort(function (a, b) {
  return (
    Number(a.numero || 0) -
    Number(b.numero || 0)
  );
});

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

    const fila = document.createElement("div");

    fila.className =
      "fila-asientos";

    const numero = document.createElement(
      "div"
    );

    numero.className =
      "numero-fila";

    numero.textContent =
      numeroFila;

    fila.appendChild(numero);

    const bloqueIzquierdo =
      document.createElement("div");

    bloqueIzquierdo.className =
      "bloque-asientos";

    const pasillo =
      document.createElement("div");

    pasillo.className =
      "pasillo-asientos";

    pasillo.innerHTML =
      "<span>PASILLO</span>";

    const bloqueDerecho =
      document.createElement("div");

    bloqueDerecho.className =
      "bloque-asientos";

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

      if (posicion < 3) {

        bloqueIzquierdo.appendChild(
          boton
        );

      } else {

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

document
  .querySelectorAll(
    ".asiento-boton.asiento-seleccionado"
  )
  .forEach(function (elemento) {

    elemento.classList.remove(
      "asiento-seleccionado"
    );

  });

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
 * =========================================================
 * FLUJO DE PAGO — 3 etapas, todo dentro de #panel-pago
 *
 * Etapa A: método (Tarjeta/PayPal) + cuenta -> POST .../iniciar/
 * Etapa B: código de verificación -> POST .../{id}/verificar/
 * Etapa C: resultado final (confirmado o rechazado)
 * =========================================================
 */

function pintarEtapaMetodo(panel, reserva) {

  panel.innerHTML = `

    <p class="fw-semibold mb-2">
      Completa el pago de tu reserva:
    </p>

    <div class="mb-3">
      <label for="select-metodo-pago" class="form-label">
        Método de pago
      </label>
      <select id="select-metodo-pago" class="form-select">
        <option value="TARJETA">Tarjeta</option>
        <option value="PAYPAL">PayPal</option>
      </select>
    </div>

    <div class="mb-3" id="campo-cuenta-tarjeta">
      <label for="input-numero-tarjeta" class="form-label">
        Número de tarjeta
      </label>
      <input
        type="text"
        id="input-numero-tarjeta"
        class="form-control"
        placeholder="0000000000000000"
        maxlength="20"
      >
    </div>

    <div class="mb-3 d-none" id="campo-cuenta-paypal">
      <label for="input-correo-paypal" class="form-label">
        Correo de PayPal
      </label>
      <input
        type="email"
        id="input-correo-paypal"
        class="form-control"
        placeholder="correo@ejemplo.com"
      >
    </div>

    <div id="error-pago" class="alert alert-danger d-none"></div>

    <button
      type="button"
      id="btn-pagar"
      class="btn btn-primary btn-lg w-100"
    >
      <i class="bi bi-credit-card"></i>
      Pagar
    </button>
  `;

  const selectMetodo = panel.querySelector("#select-metodo-pago");
  const campoTarjeta = panel.querySelector("#campo-cuenta-tarjeta");
  const campoPaypal = panel.querySelector("#campo-cuenta-paypal");

  if (selectMetodo) {

    selectMetodo.addEventListener("change", function () {

      if (this.value === "PAYPAL") {
        campoTarjeta.classList.add("d-none");
        campoPaypal.classList.remove("d-none");
      } else {
        campoPaypal.classList.add("d-none");
        campoTarjeta.classList.remove("d-none");
      }
    });
  }

  const btnPagar = panel.querySelector("#btn-pagar");

  if (btnPagar) {

    btnPagar.addEventListener("click", async function () {

      const metodo = selectMetodo ? selectMetodo.value : "TARJETA";

      let cuenta = "";

      if (metodo === "PAYPAL") {
        const inputPaypal = panel.querySelector("#input-correo-paypal");
        cuenta = inputPaypal ? inputPaypal.value.trim() : "";
      } else {
        const inputTarjeta = panel.querySelector("#input-numero-tarjeta");
        cuenta = inputTarjeta ? inputTarjeta.value.trim() : "";
      }

      const errorPago = panel.querySelector("#error-pago");

      if (errorPago) errorPago.classList.add("d-none");

      if (!cuenta) {
        if (errorPago) {
          errorPago.textContent = "Ingresa los datos de la cuenta de pago.";
          errorPago.classList.remove("d-none");
        }
        return;
      }

      btnPagar.disabled = true;
      btnPagar.innerHTML = `
        <span class="spinner-border spinner-border-sm"></span>
        Procesando...
      `;

      try {

        const pago = await API.post(
          "/api/pagos/pagos/iniciar/",
          {
            reserva: Number(reserva?.id),
            metodo: metodo,
            cuenta: cuenta,
            monto: Number(vueloActual?.precio_base || 0),
          }
        );

        if (pago.estado === "RECHAZADO") {
          pintarEtapaResultado(panel, false);
          await cargarAsientos();
          return;
        }

        pintarEtapaVerificacion(panel, pago);

      } catch (error) {

        console.error("Error iniciando el pago:", error);

        if (errorPago) {
          errorPago.textContent =
            error.message || "No fue posible procesar el pago.";
          errorPago.classList.remove("d-none");
        }

        btnPagar.disabled = false;
        btnPagar.innerHTML = `
          <i class="bi bi-credit-card"></i>
          Pagar
        `;
      }
    });
  }
}

function pintarEtapaVerificacion(panel, pago) {

  panel.innerHTML = `

    <div class="alert alert-info">
      <i class="bi bi-envelope-check"></i>
      Se envió un código de verificación a tu correo (simulado).
      <br>
      <span class="text-subtle small">
        Código de prueba (solo demo):
        <strong>${API.escapeHtml(pago.codigo_demo || "")}</strong>
      </span>
    </div>

    <div class="mb-3">
      <label for="input-codigo-verificacion" class="form-label">
        Código de verificación
      </label>
      <input
        type="text"
        id="input-codigo-verificacion"
        class="form-control"
        maxlength="6"
        placeholder="000000"
      >
    </div>

    <div id="error-verificacion" class="alert alert-danger d-none"></div>

    <button
      type="button"
      id="btn-verificar-codigo"
      class="btn btn-success btn-lg w-100"
    >
      <i class="bi bi-check-circle"></i>
      Verificar y confirmar reserva
    </button>
  `;

  const btnVerificar = panel.querySelector("#btn-verificar-codigo");

  if (btnVerificar) {

    btnVerificar.addEventListener("click", async function () {

      const inputCodigo = panel.querySelector("#input-codigo-verificacion");
      const codigo = inputCodigo ? inputCodigo.value.trim() : "";

      const errorVerificacion = panel.querySelector("#error-verificacion");

      if (errorVerificacion) errorVerificacion.classList.add("d-none");

      if (!codigo) {
        if (errorVerificacion) {
          errorVerificacion.textContent = "Ingresa el código de verificación.";
          errorVerificacion.classList.remove("d-none");
        }
        return;
      }

      btnVerificar.disabled = true;
      btnVerificar.innerHTML = `
        <span class="spinner-border spinner-border-sm"></span>
        Verificando...
      `;

      try {

        await API.post(
          `/api/pagos/pagos/${pago.id}/verificar/`,
          { codigo: codigo }
        );

        pintarEtapaResultado(panel, true);
        await cargarAsientos();

      } catch (error) {

        console.error("Error verificando el pago:", error);

        if (errorVerificacion) {
          errorVerificacion.textContent =
            error.message || "No fue posible verificar el código.";
          errorVerificacion.classList.remove("d-none");
        }

        btnVerificar.disabled = false;
        btnVerificar.innerHTML = `
          <i class="bi bi-check-circle"></i>
          Verificar y confirmar reserva
        `;
      }
    });
  }
}

function pintarEtapaResultado(panel, aprobado) {

  if (aprobado) {

    panel.innerHTML = `
      <div class="alert alert-success mb-0">
        <i class="bi bi-check-circle-fill"></i>
        Pago verificado. Tu reserva quedó <strong>confirmada</strong>.
      </div>
    `;

  } else {

    panel.innerHTML = `
      <div class="alert alert-danger mb-0">
        <i class="bi bi-x-circle-fill"></i>
        El saldo de la cuenta no cubre el monto de la reserva.
        El pago fue <strong>rechazado</strong> y el asiento
        quedó disponible nuevamente.
      </div>
    `;
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

        /*
         * El encabezado ("Reserva creada") vive
         * fijo. #panel-pago es el contenedor
         * separado que las 3 etapas del pago
         * van sobreescribiendo, sin tocar el
         * encabezado.
         */
        resumenAsiento.innerHTML = `

          <div class="alert alert-success">

            <h4 class="alert-heading">
              <i class="bi bi-check-circle-fill"></i>
              Reserva creada correctamente
            </h4>

            <p class="mb-2">
              Tu asiento seleccionado es:
              <strong>${API.escapeHtml(codigo)}</strong>
            </p>

            <p class="mb-0">
              Código de reserva:
              <strong>#${API.escapeHtml(reserva?.id || "")}</strong>
            </p>

          </div>

          <div id="panel-pago"></div>
        `;

        const panelPago =
          resumenAsiento.querySelector("#panel-pago");

        if (panelPago) {
          pintarEtapaMetodo(panelPago, reserva);
        }
      }

      if (estadoAsientos) {

        estadoAsientos.className =
          "alert alert-success";

        estadoAsientos.textContent =
          "Reserva registrada correctamente. El asiento ya no está disponible para otra reserva.";

      }

      await cargarAsientos();

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