document.addEventListener("DOMContentLoaded", function () {


"use strict";


/* =========================================================
   ELEMENTOS DEL DOM
========================================================= */

const selectVuelo =
    document.getElementById("select-vuelo");

const mapaAsientos =
    document.getElementById("mapa-asientos");

const detalleVuelo =
    document.getElementById("detalle-vuelo");

const mensaje =
    document.getElementById("mensaje-reserva");

const btnReservar =
    document.getElementById("btn-reservar");

const btnProcederPago =
    document.getElementById("btn-proceder-pago");

const accionPago =
    document.getElementById("accion-pago");

const listaReservas =
    document.getElementById("lista-reservas");


if (!selectVuelo) {
    return;
}


/* =========================================================
   VARIABLES
========================================================= */

let vueloSeleccionado = null;

let asientoSeleccionado = null;

let reservaCreada = null;

let vuelos = [];


/* =========================================================
   MENSAJES
========================================================= */

function mostrarMensaje(texto, tipo = "info") {

    if (!mensaje) {
        return;
    }

    mensaje.innerHTML = `
        <div
            class="alert alert-${tipo}"
            role="alert"
        >
            ${API.escapeHtml(texto)}
        </div>
    `;
}


/* =========================================================
   NORMALIZAR RESPUESTAS API
========================================================= */

function listaDe(respuesta) {

    if (Array.isArray(respuesta)) {
        return respuesta;
    }

    if (Array.isArray(respuesta?.data)) {
        return respuesta.data;
    }

    if (Array.isArray(respuesta?.results)) {
        return respuesta.results;
    }

    return [];
}


/* =========================================================
   CARGAR VUELOS DISPONIBLES
========================================================= */

async function cargarVuelos() {

    try {

        const respuesta =
            await API.get(
                "/api/vuelos/vuelos/"
            );

        vuelos = listaDe(respuesta).filter((vuelo) => {
            const estado = String(
                vuelo.estado || ""
            ).toUpperCase();

            return (
                estado === "DISPONIBLE" ||
                Number(vuelo.cupos_disponibles || 0) > 0
            );
        });


        selectVuelo.innerHTML = `
            <option value="">
                Seleccione un vuelo
            </option>
        `;


        vuelos.forEach((vuelo) => {

            const ruta =
                vuelo.ruta_detalle
                    ? `${vuelo.ruta_detalle.origen} → ${vuelo.ruta_detalle.destino}`
                    : `Vuelo #${vuelo.id}`;


            const option =
                document.createElement("option");


            option.value =
                vuelo.id;


            option.textContent =
                `${ruta} | ${vuelo.fecha} ${vuelo.hora} | ${vuelo.cupos_disponibles} cupos`;


            selectVuelo.appendChild(option);

        });


    } catch (error) {

        console.error(
            "Error cargando vuelos:",
            error
        );


        mostrarMensaje(
            error.message ||
            "No fue posible cargar los vuelos disponibles.",
            "danger"
        );

    }

}


/* =========================================================
   CARGAR ASIENTOS DEL VUELO
========================================================= */

async function cargarAsientos(vueloId) {

    mapaAsientos.innerHTML = `
        <div class="text-center p-4">

            <div class="spinner-border"></div>

            <p class="mt-2">
                Cargando matriz de asientos...
            </p>

        </div>
    `;


    try {

        const respuesta =
            await API.get(
                `/api/vuelos/asientos/?vuelo=${encodeURIComponent(vueloId)}`
            );


        const asientos =
            listaDe(respuesta);


        renderizarMapaAsientos(
            asientos
        );


    } catch (error) {

        console.error(
            "Error cargando asientos:",
            error
        );


        mapaAsientos.innerHTML = `
            <div class="alert alert-danger">
                ${API.escapeHtml(
                    error.message ||
                    "No se pudieron cargar los asientos."
                )}
            </div>
        `;

    }

}


/* =========================================================
   CÓDIGO DEL ASIENTO
========================================================= */

function codigoAsiento(asiento) {

    if (asiento.codigo) {

        return asiento.codigo;

    }


    const numero =
        Number(
            asiento.numero || 0
        );


    if (!numero) {

        return "N/A";

    }


    const fila =
        Math.ceil(
            numero / 6
        );


    const letras =
        "ABCDEF";


    const letra =
        letras[
            (numero - 1) % 6
        ];


    return `${fila}${letra}`;

}


/* =========================================================
   CREAR MATRIZ DE ASIENTOS
   
   ESTRUCTURA:

   A B C | D E F

   1A 1B 1C | 1D 1E 1F
   2A 2B 2C | 2D 2E 2F
   3A 3B 3C | 3D 3E 3F
========================================================= */

function renderizarMapaAsientos(asientos) {

    mapaAsientos.innerHTML = "";

    asientoSeleccionado = null;

    btnReservar.disabled = true;


    if (accionPago) {

        accionPago.classList.add(
            "d-none"
        );

    }


    if (!asientos.length) {

        mapaAsientos.innerHTML = `
            <div class="alert alert-warning">
                Este vuelo no tiene asientos registrados.
            </div>
        `;

        return;

    }


    /* =====================================================
       CONTENEDOR PRINCIPAL DEL AVIÓN
    ===================================================== */

    const contenedor =
        document.createElement(
            "div"
        );


    contenedor.className =
        "airplane-seat-map";


    /* =====================================================
       FRENTE DEL AVIÓN
    ===================================================== */

    const frente =
        document.createElement(
            "div"
        );


    frente.className =
        "airplane-nose";


    frente.innerHTML = `
        <i class="bi bi-airplane-fill"></i>
        <span>Frente del avión</span>
    `;


    contenedor.appendChild(
        frente
    );


    /* =====================================================
       ENCABEZADOS DE COLUMNAS
    ===================================================== */

    const encabezados =
        document.createElement(
            "div"
        );


    encabezados.className =
        "seat-column-labels";


    encabezados.innerHTML = `
        <span>A</span>
        <span>B</span>
        <span>C</span>

        <span class="pasillo-header"></span>

        <span>D</span>
        <span>E</span>
        <span>F</span>
    `;


    contenedor.appendChild(
        encabezados
    );


    /* =====================================================
       MATRIZ
    ===================================================== */

    const grid =
        document.createElement(
            "div"
        );


    grid.className =
        "seat-grid";


    /*
     * Ordenamos por número de asiento.
     */

    asientos.sort(
        (a, b) =>
            Number(a.numero || 0) -
            Number(b.numero || 0)
    );


    asientos.forEach(
        (asiento) => {


            const boton =
                document.createElement(
                    "button"
                );


            const codigo =
                codigoAsiento(
                    asiento
                );


            const estado =
                String(
                    asiento.estado || ""
                ).toUpperCase();


            boton.type =
                "button";


            boton.className =
                "asiento";


            boton.textContent =
                codigo;


            boton.title =
                `Asiento ${codigo}`;


            boton.dataset.id =
                asiento.id;


            /*
             * El pasillo se crea visualmente
             * entre C y D.
             */

            const letra =
                codigo.slice(-1)
                    .toUpperCase();


            if (
                letra === "D"
            ) {

                boton.classList.add(
                    "asiento-pasillo"
                );

            }


            /* =================================================
               ASIENTO DISPONIBLE
            ================================================= */

            if (
                estado ===
                "DISPONIBLE"
            ) {

                boton.classList.add(
                    "asiento-disponible"
                );


                boton.addEventListener(
                    "click",
                    function () {


                        /*
                         * Quitar selección anterior.
                         */

                        document
                            .querySelectorAll(
                                "#mapa-asientos .asiento-seleccionado"
                            )
                            .forEach(
                                (elemento) => {

                                    elemento.classList.remove(
                                        "asiento-seleccionado"
                                    );

                                    elemento.classList.add(
                                        "asiento-disponible"
                                    );

                                }
                            );


                        /*
                         * Seleccionar asiento actual.
                         */

                        boton.classList.remove(
                            "asiento-disponible"
                        );


                        boton.classList.add(
                            "asiento-seleccionado"
                        );


                        asientoSeleccionado =
                            asiento;


                        btnReservar.disabled =
                            false;


                        mostrarDetalleAsiento(
                            asiento
                        );


                        /*
                         * Ocultar botón de pago
                         * si el usuario cambia
                         * de asiento antes de reservar.
                         */

                        if (accionPago) {

                            accionPago.classList.add(
                                "d-none"
                            );

                        }


                    }
                );

            }


            /* =================================================
               ASIENTO RESERVADO
            ================================================= */

            else if (
                estado ===
                "RESERVADO"
            ) {

                boton.classList.add(
                    "asiento-reservado"
                );


                boton.disabled =
                    true;

            }


            /* =================================================
               ASIENTO BLOQUEADO
            ================================================= */

            else {

                boton.classList.add(
                    "asiento-bloqueado"
                );


                boton.disabled =
                    true;

            }


            grid.appendChild(
                boton
            );

        }
    );


    contenedor.appendChild(
        grid
    );


    /* =====================================================
       PARTE TRASERA DEL AVIÓN
    ===================================================== */

    const cola =
        document.createElement(
            "div"
        );


    cola.className =
        "airplane-tail";


    cola.innerHTML = `
        <span>Parte trasera</span>
    `;


    contenedor.appendChild(
        cola
    );


    mapaAsientos.appendChild(
        contenedor
    );

}


/* =========================================================
   MOSTRAR DETALLE DEL ASIENTO
========================================================= */

function mostrarDetalleAsiento(
    asiento
) {

    if (!vueloSeleccionado) {

        return;

    }


    const ruta =
        vueloSeleccionado.ruta_detalle ||
        {};


    const codigo =
        codigoAsiento(
            asiento
        );


    detalleVuelo.innerHTML = `

        <div class="card border-primary">

            <div class="card-body">

                <h5 class="card-title">

                    <i class="bi bi-airplane"></i>

                    Vuelo seleccionado

                </h5>


                <p class="mb-1">

                    <strong>
                        Ruta:
                    </strong>

                    ${API.escapeHtml(
                        ruta.origen ||
                        "—"
                    )}

                    →

                    ${API.escapeHtml(
                        ruta.destino ||
                        "—"
                    )}

                </p>


                <p class="mb-1">

                    <strong>
                        Fecha:
                    </strong>

                    ${API.escapeHtml(
                        vueloSeleccionado.fecha ||
                        "—"
                    )}

                </p>


                <p class="mb-1">

                    <strong>
                        Hora:
                    </strong>

                    ${API.escapeHtml(
                        vueloSeleccionado.hora ||
                        "—"
                    )}

                </p>


                <p class="mb-0">

                    <strong>
                        Asiento seleccionado:
                    </strong>

                    <span class="badge bg-primary">

                        ${API.escapeHtml(
                            codigo
                        )}

                    </span>

                </p>

            </div>

        </div>

    `;

}


/* =========================================================
   CAMBIO DE VUELO
========================================================= */

selectVuelo.addEventListener(
    "change",
    function () {


        const vueloId =
            this.value;


        mapaAsientos.innerHTML =
            "";


        detalleVuelo.innerHTML =
            "";


        asientoSeleccionado =
            null;


        reservaCreada =
            null;


        btnReservar.disabled =
            true;


        if (accionPago) {

            accionPago.classList.add(
                "d-none"
            );

        }


        if (!vueloId) {

            vueloSeleccionado =
                null;

            return;

        }


        vueloSeleccionado =
            vuelos.find(
                (vuelo) =>
                    String(vuelo.id) ===
                    String(vueloId)
            );


        if (
            vueloSeleccionado
        ) {

            cargarAsientos(
                vueloId
            );

        }

    }
);


/* =========================================================
   CREAR RESERVA
========================================================= */

btnReservar.addEventListener(
    "click",
    async function () {


        if (
            !vueloSeleccionado ||
            !asientoSeleccionado
        ) {

            mostrarMensaje(
                "Debe seleccionar un vuelo y un asiento.",
                "warning"
            );

            return;

        }


        btnReservar.disabled =
            true;


        btnReservar.innerHTML = `

            <span
                class="spinner-border
                spinner-border-sm"
            ></span>

            Creando reserva...

        `;


        try {


            /* =============================================
               CREAR RESERVA
            ============================================= */

            const reserva =
                await API.post(
                    "/api/reservas/reservas/",
                    {
                        vuelo:
                            Number(
                                vueloSeleccionado.id
                            ),

                        asiento:
                            Number(
                                asientoSeleccionado.id
                            ),
                    }
                );


            reservaCreada =
                reserva;


            mostrarMensaje(

                `Reserva #${reserva.id} creada correctamente. Asiento ${codigoAsiento(asientoSeleccionado)}.`,

                "success"

            );


            /* =============================================
               OCULTAR BOTÓN DE RESERVA
            ============================================= */

            btnReservar.classList.add(
                "d-none"
            );


            /* =============================================
               MOSTRAR BOTÓN PROCEDER AL PAGO
               
               ESTE BOTÓN ES PARA EL INTEGRANTE #3.
               TODAVÍA NO PROCESA NINGÚN PAGO.
            ============================================= */

            if (
                accionPago
            ) {

                accionPago.classList.remove(
                    "d-none"
                );

            }


            /*
             * IMPORTANTE:
             *
             * NO redirigimos todavía.
             *
             * El Integrante #3 agregará
             * aquí el flujo real de pago.
             */


            if (
                btnProcederPago
            ) {

                btnProcederPago.onclick =
                    function () {


                        /*
                         * POR AHORA SOLO MOSTRAMOS
                         * UN MENSAJE.
                         *
                         * EL INTEGRANTE #3 REEMPLAZARÁ
                         * ESTA PARTE POR LA RUTA DE PAGO.
                         */

                        mostrarMensaje(

                            `Reserva #${reserva.id} lista para continuar con el pago.`,

                            "info"

                        );

                    };

            }


            /*
             * Actualizar matriz de asientos.
             */

            await cargarAsientos(
                vueloSeleccionado.id
            );


            /*
             * Restaurar el botón de reserva
             * visualmente oculto.
             */

            btnReservar.classList.add(
                "d-none"
            );


            /*
             * Mantener visible
             * el botón de pago.
             */

            if (
                accionPago
            ) {

                accionPago.classList.remove(
                    "d-none"
                );

            }


            /*
             * Actualizar lista de reservas.
             */

            await cargarMisReservas();


        } catch (
            error
        ) {


            console.error(
                "Error creando reserva:",
                error
            );


            mostrarMensaje(

                error.message ||

                "No se pudo crear la reserva. El asiento puede haber sido reservado por otro usuario.",

                "danger"

            );


            btnReservar.classList.remove(
                "d-none"
            );


            btnReservar.innerHTML = `

                <i class="bi bi-check-circle"></i>

                Confirmar asiento y crear reserva

            `;


            btnReservar.disabled =
                false;

        }

    }
);


/* =========================================================
   CARGAR MIS RESERVAS
========================================================= */

async function cargarMisReservas() {


    try {


        const respuesta =
            await API.get(
                "/api/reservas/reservas/"
            );


        renderizarReservas(
            listaDe(
                respuesta
            )
        );


    } catch (
        error
    ) {


        console.error(
            "Error cargando reservas:",
            error
        );


        listaReservas.innerHTML = `

            <div class="alert alert-danger">

                ${API.escapeHtml(

                    error.message ||

                    "No se pudieron cargar las reservas."

                )}

            </div>

        `;

    }

}


/* =========================================================
   MOSTRAR MIS RESERVAS
   
   IMPORTANTE:
   YA NO SE MUESTRA "PROCEDER AL PAGO" AQUÍ.
   
   EL BOTÓN DE PAGO SOLO APARECE DESPUÉS
   DE CREAR UNA RESERVA DESDE LA MATRIZ.
========================================================= */

function renderizarReservas(
    reservas
) {


    listaReservas.innerHTML =
        "";


    if (
        !reservas.length
    ) {


        listaReservas.innerHTML = `

            <div class="alert alert-info">

                No tienes reservas registradas.

            </div>

        `;


        return;

    }


    reservas.forEach(
        (reserva) => {


            const vuelo =
                reserva.vuelo_detalle ||
                {};


            const ruta =
                vuelo.ruta ||
                {};


            const asiento =
                reserva.asiento_detalle ||
                {};


            const estadoClase =
                reserva.estado ===
                "CONFIRMADA"

                    ? "success"

                    : reserva.estado ===
                      "CANCELADA"

                        ? "danger"

                        : "secondary";


            const tarjeta =
                document.createElement(
                    "div"
                );


            tarjeta.className =
                "card mb-3";


            tarjeta.innerHTML = `

                <div class="card-body">

                    <div
                        class="
                        d-flex
                        justify-content-between
                        align-items-center
                        "
                    >

                        <h5
                            class="card-title mb-0"
                        >

                            <i
                                class="
                                bi
                                bi-ticket-perforated
                                "
                            ></i>

                            Reserva #

                            ${API.escapeHtml(
                                reserva.id
                            )}

                        </h5>


                        <span
                            class="
                            badge
                            bg-${estadoClase}
                            "
                        >

                            ${API.escapeHtml(
                                reserva.estado
                            )}

                        </span>

                    </div>


                    <hr>


                    <p class="mb-1">

                        <strong>
                            Ruta:
                        </strong>

                        ${API.escapeHtml(
                            ruta.origen ||
                            "—"
                        )}

                        →

                        ${API.escapeHtml(
                            ruta.destino ||
                            "—"
                        )}

                    </p>


                    <p class="mb-1">

                        <strong>
                            Fecha:
                        </strong>

                        ${API.escapeHtml(
                            vuelo.fecha ||
                            "—"
                        )}

                    </p>


                    <p class="mb-1">

                        <strong>
                            Hora:
                        </strong>

                        ${API.escapeHtml(
                            vuelo.hora ||
                            "—"
                        )}

                    </p>


                    <p class="mb-1">

                        <strong>
                            Asiento:
                        </strong>

                        ${API.escapeHtml(
                            asiento.codigo ||
                            asiento.numero ||
                            "—"
                        )}

                    </p>


                    <p class="mb-3">

                        <strong>
                            Precio:
                        </strong>

                        ${API.escapeHtml(
                            vuelo.precio_base ||
                            "—"
                        )}

                    </p>


                    <div
                        class="
                        d-flex
                        flex-wrap
                        gap-2
                        "
                    >

                        ${
                            reserva.estado ===
                            "CONFIRMADA"

                                ? `

                                    <button
                                        type="button"
                                        class="
                                        btn
                                        btn-outline-danger
                                        btn-cancelar-reserva
                                        "
                                        data-id="${reserva.id}"
                                    >

                                        <i
                                            class="
                                            bi
                                            bi-x-circle
                                            "
                                        ></i>

                                        Cancelar reserva

                                    </button>

                                `

                                : ""

                        }

                    </div>

                </div>

            `;


            listaReservas.appendChild(
                tarjeta
            );

        }
    );


    document
        .querySelectorAll(
            ".btn-cancelar-reserva"
        )
        .forEach(
            (boton) => {


                boton.addEventListener(
                    "click",
                    () =>
                        cancelarReserva(
                            boton.dataset.id
                        )
                );


            }
        );

}


/* =========================================================
   CANCELAR RESERVA
========================================================= */

async function cancelarReserva(
    reservaId
) {


    if (
        !window.confirm(
            "¿Desea cancelar esta reserva?"
        )
    ) {

        return;

    }


    try {


        await API.post(

            `/api/reservas/reservas/${reservaId}/cancelar/`

        );


        mostrarMensaje(

            "La reserva fue cancelada correctamente y el asiento quedó disponible.",

            "success"

        );


        await cargarMisReservas();


        if (
            vueloSeleccionado
        ) {

            await cargarAsientos(

                vueloSeleccionado.id

            );

        }


    } catch (
        error
    ) {


        console.error(

            "Error cancelando reserva:",

            error

        );


        mostrarMensaje(

            error.message ||

            "No se pudo cancelar la reserva.",

            "danger"

        );

    }

}


/* =========================================================
   INICIALIZAR
========================================================= */

cargarVuelos();

cargarMisReservas();


});
