
document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    const tabla = document.getElementById("tabla-aeronaves");
    const btnNueva = document.getElementById("btn-nueva-aeronave");
    const modalElemento = document.getElementById("modal-aeronave");
    const formulario = document.getElementById("form-aeronave");
    const mensaje = document.getElementById("mensaje-aeronave");

    const inputCodigo = document.getElementById("codigo");
    const inputModelo = document.getElementById("modelo");
    const inputCapacidad = document.getElementById("capacidad");
    const inputEstado = document.getElementById("estado");

    const tituloModal = modalElemento?.querySelector(".modal-title");
    const botonGuardar = formulario?.querySelector(
        'button[type="submit"]'
    );

    let modal = null;
    let aeronaveEditandoId = null;

    if (modalElemento && typeof bootstrap !== "undefined") {
        modal = new bootstrap.Modal(modalElemento);
    }

    // ==========================================
    // OBTENER TOKEN JWT
    // ==========================================

    function obtenerToken() {
        return (
            sessionStorage.getItem("access_token") ||
            localStorage.getItem("access_token") ||
            sessionStorage.getItem("access") ||
            localStorage.getItem("access") ||
            ""
        );
    }

    // ==========================================
    // MOSTRAR MENSAJE
    // ==========================================

    function mostrarMensaje(texto, tipo = "danger") {
        if (!mensaje) {
            return;
        }

        mensaje.className = `alert alert-${tipo}`;
        mensaje.textContent = texto;
        mensaje.classList.remove("d-none");
    }

    // ==========================================
    // OCULTAR MENSAJE
    // ==========================================

    function ocultarMensaje() {
        if (!mensaje) {
            return;
        }

        mensaje.className = "alert d-none";
        mensaje.textContent = "";
    }

    // ==========================================
    // PREPARAR MODAL PARA CREAR
    // ==========================================

    function prepararModalCrear() {
        aeronaveEditandoId = null;

        formulario.reset();

        if (tituloModal) {
            tituloModal.textContent = "Nueva aeronave";
        }

        if (botonGuardar) {
            botonGuardar.textContent = "Guardar aeronave";
        }

        ocultarMensaje();
    }

    // ==========================================
    // PREPARAR MODAL PARA EDITAR
    // ==========================================

    function prepararModalEditar(aeronave) {
        aeronaveEditandoId = aeronave.id;

        inputCodigo.value = aeronave.codigo || "";
        inputModelo.value = aeronave.modelo || "";
        inputCapacidad.value = aeronave.capacidad || "";
        inputEstado.value = aeronave.estado || "ACTIVA";

        if (tituloModal) {
            tituloModal.textContent = "Editar aeronave";
        }

        if (botonGuardar) {
            botonGuardar.textContent = "Guardar cambios";
        }

        ocultarMensaje();

        modal.show();
    }

    // ==========================================
    // CARGAR AERONAVES
    // ==========================================

    async function cargarAeronaves() {
        tabla.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    Cargando aeronaves...
                </td>
            </tr>
        `;

        const token = obtenerToken();

        if (!token) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-danger">
                        No se encontró el token de autenticación.
                    </td>
                </tr>
            `;

            return;
        }

        try {
            const respuesta = await fetch(
                "/api/vuelos/aeronaves/",
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
                        <td colspan="5" class="text-center text-danger">
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

            const aeronaves = resultado.data || [];

            if (aeronaves.length === 0) {
                tabla.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">
                            No hay aeronaves registradas.
                        </td>
                    </tr>
                `;

                return;
            }

            tabla.innerHTML = aeronaves.map(function (aeronave) {

                const estadoClase =
                    aeronave.estado === "ACTIVA"
                        ? "bg-success"
                        : aeronave.estado === "MANTENIMIENTO"
                            ? "bg-warning text-dark"
                            : "bg-secondary";

                return `
                    <tr>

                        <td>
                            ${aeronave.codigo}
                        </td>

                        <td>
                            ${aeronave.modelo}
                        </td>

                        <td>
                            ${aeronave.capacidad}
                        </td>

                        <td>
                            <span class="badge ${estadoClase}">
                                ${aeronave.estado}
                            </span>
                        </td>

                        <td>

                            <button
                                type="button"
                                class="btn btn-sm btn-outline-primary btn-editar-aeronave"
                                data-id="${aeronave.id}"
                            >
                                <i class="bi bi-pencil"></i>
                                Editar
                            </button>

                        </td>

                    </tr>
                `;

            }).join("");

            // ==========================================
            // EVENTOS DE BOTONES EDITAR
            // ==========================================

            document
                .querySelectorAll(".btn-editar-aeronave")
                .forEach(function (boton) {

                    boton.addEventListener(
                        "click",
                        function () {

                            const id = boton.dataset.id;

                            const aeronave =
                                aeronaves.find(function (item) {
                                    return String(item.id) === String(id);
                                });

                            if (!aeronave) {
                                mostrarMensaje(
                                    "No fue posible encontrar la aeronave seleccionada."
                                );

                                return;
                            }

                            prepararModalEditar(aeronave);
                        }
                    );

                });

        } catch (error) {

            console.error(
                "Error cargando aeronaves:",
                error
            );

            tabla.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-danger">
                        No fue posible cargar las aeronaves.
                    </td>
                </tr>
            `;
        }
    }

    // ==========================================
    // BOTÓN NUEVA AERONAVE
    // ==========================================

    if (btnNueva) {

        btnNueva.addEventListener(
            "click",
            function () {

                prepararModalCrear();

                modal.show();
            }
        );

    }

    // ==========================================
    // GUARDAR AERONAVE
    // CREAR = POST
    // EDITAR = PATCH
    // ==========================================

    formulario.addEventListener(
        "submit",
        async function (evento) {

            evento.preventDefault();

            ocultarMensaje();

            const token = obtenerToken();

            if (!token) {

                mostrarMensaje(
                    "No se encontró el token de autenticación."
                );

                return;
            }

            const datos = {

                codigo: inputCodigo.value.trim(),

                modelo: inputModelo.value.trim(),

                capacidad: Number(
                    inputCapacidad.value
                ),

                estado: inputEstado.value

            };

            const esEdicion =
                aeronaveEditandoId !== null;

            const metodo =
                esEdicion
                    ? "PATCH"
                    : "POST";

            const url =
                esEdicion
                    ? `/api/vuelos/aeronaves/${aeronaveEditandoId}/`
                    : "/api/vuelos/aeronaves/";

            if (botonGuardar) {
                botonGuardar.disabled = true;
                botonGuardar.textContent =
                    esEdicion
                        ? "Guardando cambios..."
                        : "Guardando...";
            }

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

                    console.error(
                        "Error API:",
                        resultado
                    );

                    let mensajeError =
                        resultado.message ||
                        "No fue posible guardar la aeronave.";

                    if (resultado.errors) {

                        const errores =
                            Object.entries(
                                resultado.errors
                            )
                            .map(function (
                                [campo, mensajes]
                            ) {
                                return `${campo}: ${mensajes.join(", ")}`;
                            })
                            .join(" ");

                        mensajeError =
                            errores ||
                            mensajeError;
                    }

                    throw new Error(
                        mensajeError
                    );
                }

                mostrarMensaje(
                    esEdicion
                        ? "Aeronave actualizada correctamente."
                        : "Aeronave creada correctamente.",
                    "success"
                );

                setTimeout(
                    function () {

                        modal.hide();

                        formulario.reset();

                        aeronaveEditandoId = null;

                        cargarAeronaves();

                    },
                    700
                );

            } catch (error) {

                console.error(
                    "Error guardando aeronave:",
                    error
                );

                mostrarMensaje(
                    error.message ||
                    "Ocurrió un error al guardar la aeronave."
                );

            } finally {

                if (botonGuardar) {

                    botonGuardar.disabled = false;

                    botonGuardar.textContent =
                        aeronaveEditandoId !== null
                            ? "Guardar cambios"
                            : "Guardar aeronave";
                }
            }

        }
    );

    // ==========================================
    // INICIAR
    // ==========================================

    cargarAeronaves();

});