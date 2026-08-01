document.addEventListener("DOMContentLoaded", function () {

const tabla = document.getElementById("tabla-rutas");
const btnNueva = document.getElementById("btn-nueva-ruta");
const modalElemento = document.getElementById("modal-ruta");
const formulario = document.getElementById("form-ruta");
const mensaje = document.getElementById("mensaje-ruta");
const tituloModal = document.getElementById("titulo-modal-ruta");

const inputId = document.getElementById("ruta-id");
const inputOrigen = document.getElementById("origen");
const inputDestino = document.getElementById("destino");
const inputEstado = document.getElementById("estado");
const btnGuardar = document.getElementById("btn-guardar-ruta");

let modal = null;

if (modalElemento) {
    modal = new bootstrap.Modal(modalElemento);
}


// ==========================================
// OBTENER TOKEN JWT
// ==========================================

function obtenerToken() {

    return (
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token") ||
        localStorage.getItem("access") ||
        sessionStorage.getItem("access") ||
        ""
    );

}


// ==========================================
// MOSTRAR MENSAJE
// ==========================================

function mostrarMensaje(texto, tipo = "danger") {

    mensaje.className = `alert alert-${tipo}`;
    mensaje.textContent = texto;

}


// ==========================================
// LIMPIAR FORMULARIO
// ==========================================

function limpiarFormulario() {

    formulario.reset();

    inputId.value = "";

    inputEstado.value = "ACTIVA";

    mensaje.className = "alert d-none";
    mensaje.textContent = "";

    tituloModal.textContent = "Nueva ruta";

    btnGuardar.textContent = "Guardar ruta";

}


// ==========================================
// CARGAR RUTAS
// ==========================================

async function cargarRutas() {

    tabla.innerHTML = `
        <tr>
            <td colspan="4" class="text-center">
                Cargando rutas...
            </td>
        </tr>
    `;

    const token = obtenerToken();

    if (!token) {

        tabla.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger">
                    No se encontró el token de autenticación.
                </td>
            </tr>
        `;

        return;

    }


    try {

        const respuesta = await fetch(
            "/api/vuelos/rutas/",
            {
                method: "GET",

                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        if (respuesta.status === 401) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger">
                        La sesión ha expirado. Inicie sesión nuevamente.
                    </td>
                </tr>
            `;

            return;

        }


        if (!respuesta.ok) {

            throw new Error(
                `Error HTTP ${respuesta.status}`
            );

        }


        const resultado = await respuesta.json();

        const rutas = resultado.data || [];


        if (rutas.length === 0) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        No hay rutas registradas.
                    </td>
                </tr>
            `;

            return;

        }


        tabla.innerHTML = rutas.map(function (ruta) {

            let claseEstado = "bg-secondary";

            if (ruta.estado === "ACTIVA") {
                claseEstado = "bg-success";
            }

            if (ruta.estado === "INACTIVA") {
                claseEstado = "bg-secondary";
            }


            return `
                <tr>

                    <td>
                        ${ruta.origen}
                    </td>

                    <td>
                        ${ruta.destino}
                    </td>

                    <td>

                        <span class="badge ${claseEstado}">
                            ${ruta.estado}
                        </span>

                    </td>

                    <td>

                        <button
                            type="button"
                            class="btn btn-sm btn-outline-primary btn-editar-ruta"
                            data-id="${ruta.id}"
                        >
                            Editar
                        </button>

                        ${
                            ruta.estado === "ACTIVA"
                                ? `
                                    <button
                                        type="button"
                                        class="btn btn-sm btn-outline-danger btn-desactivar-ruta"
                                        data-id="${ruta.id}"
                                    >
                                        Desactivar
                                    </button>
                                  `
                                : ""
                        }

                    </td>

                </tr>
            `;

        }).join("");


        // ==========================================
        // BOTONES EDITAR
        // ==========================================

        document
            .querySelectorAll(".btn-editar-ruta")
            .forEach(function (boton) {

                boton.addEventListener(
                    "click",
                    function () {

                        const id = boton.dataset.id;

                        editarRuta(id);

                    }
                );

            });


        // ==========================================
        // BOTONES DESACTIVAR
        // ==========================================

        document
            .querySelectorAll(".btn-desactivar-ruta")
            .forEach(function (boton) {

                boton.addEventListener(
                    "click",
                    function () {

                        const id = boton.dataset.id;

                        desactivarRuta(id);

                    }
                );

            });


    } catch (error) {

        console.error(
            "Error cargando rutas:",
            error
        );

        tabla.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger">
                    No fue posible cargar las rutas.
                </td>
            </tr>
        `;

    }

}


// ==========================================
// ABRIR MODAL NUEVA RUTA
// ==========================================

btnNueva.addEventListener(
    "click",
    function () {

        limpiarFormulario();

        modal.show();

    }
);


// ==========================================
// EDITAR RUTA
// ==========================================

async function editarRuta(id) {

    const token = obtenerToken();

    if (!token) {

        alert(
            "No se encontró el token de autenticación."
        );

        return;

    }


    try {

        const respuesta = await fetch(
            `/api/vuelos/rutas/${id}/`,
            {
                method: "GET",

                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        const resultado = await respuesta.json();

        if (!respuesta.ok) {

            throw new Error(
                resultado.message ||
                "No fue posible obtener la ruta."
            );

        }


        const ruta = resultado.data || resultado;


        inputId.value = ruta.id;
        inputOrigen.value = ruta.origen;
        inputDestino.value = ruta.destino;
        inputEstado.value = ruta.estado;


        tituloModal.textContent = "Editar ruta";

        btnGuardar.textContent = "Actualizar ruta";

        mensaje.className = "alert d-none";
        mensaje.textContent = "";

        modal.show();


    } catch (error) {

        console.error(
            "Error obteniendo ruta:",
            error
        );

        alert(
            error.message ||
            "No fue posible cargar la ruta."
        );

    }

}


// ==========================================
// GUARDAR / ACTUALIZAR RUTA
// ==========================================

formulario.addEventListener(
    "submit",
    async function (evento) {

        evento.preventDefault();


        const token = obtenerToken();

        if (!token) {

            mostrarMensaje(
                "No se encontró el token de autenticación."
            );

            return;

        }


        const id = inputId.value.trim();


        const datos = {

            origen: inputOrigen.value.trim(),

            destino: inputDestino.value.trim(),

            estado: inputEstado.value

        };


        if (!datos.origen || !datos.destino) {

            mostrarMensaje(
                "Debe ingresar el origen y el destino."
            );

            return;

        }


        if (
            datos.origen.toLowerCase() ===
            datos.destino.toLowerCase()
        ) {

            mostrarMensaje(
                "El origen y el destino deben ser diferentes."
            );

            return;

        }


        const url = id
            ? `/api/vuelos/rutas/${id}/`
            : "/api/vuelos/rutas/";


        const metodo = id
            ? "PUT"
            : "POST";


        btnGuardar.disabled = true;


        try {

            const respuesta = await fetch(
                url,
                {

                    method: metodo,

                    headers: {

                        "Accept":
                            "application/json",

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`

                    },

                    body:
                        JSON.stringify(datos)

                }
            );


            const resultado =
                await respuesta.json();


            if (!respuesta.ok) {

                let mensajeError =
                    resultado.message ||
                    "No fue posible guardar la ruta.";


                if (resultado.errors) {

                    const errores =
                        Object.values(
                            resultado.errors
                        )
                        .flat()
                        .join(" ");

                    if (errores) {
                        mensajeError = errores;
                    }

                }


                throw new Error(
                    mensajeError
                );

            }


            mostrarMensaje(
                id
                    ? "Ruta actualizada correctamente."
                    : "Ruta creada correctamente.",
                "success"
            );


            setTimeout(
                function () {

                    modal.hide();

                    limpiarFormulario();

                    cargarRutas();

                },
                800
            );


        } catch (error) {

            console.error(
                "Error guardando ruta:",
                error
            );

            mostrarMensaje(
                error.message ||
                "Ocurrió un error al guardar la ruta."
            );

        } finally {

            btnGuardar.disabled = false;

        }

    }
);


// ==========================================
// DESACTIVAR RUTA
// ==========================================

async function desactivarRuta(id) {

    const confirmar =
        confirm(
            "¿Está seguro de que desea desactivar esta ruta?"
        );


    if (!confirmar) {
        return;
    }


    const token = obtenerToken();


    if (!token) {

        alert(
            "No se encontró el token de autenticación."
        );

        return;

    }


    try {

        const respuesta = await fetch(
            `/api/vuelos/rutas/${id}/desactivar/`,
            {

                method: "PATCH",

                headers: {

                    "Accept":
                        "application/json",

                    "Authorization":
                        `Bearer ${token}`

                }

            }
        );


        const resultado =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                resultado.message ||
                "No fue posible desactivar la ruta."
            );

        }


        alert(
            "La ruta fue desactivada correctamente."
        );


        cargarRutas();


    } catch (error) {

        console.error(
            "Error desactivando ruta:",
            error
        );

        alert(
            error.message ||
            "Ocurrió un error al desactivar la ruta."
        );

    }

}


// ==========================================
// INICIAR
// ==========================================

cargarRutas();

});
