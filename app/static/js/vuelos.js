(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {

        const tabla =
            document.getElementById(
                "tabla-vuelos"
            );

        const btnNuevo =
            document.getElementById(
                "btn-nuevo-vuelo"
            );

        const modalElemento =
            document.getElementById(
                "modal-vuelo"
            );

        const formulario =
            document.getElementById(
                "form-vuelo"
            );

        const mensaje =
            document.getElementById(
                "mensaje-vuelo"
            );

        const selectRuta =
            document.getElementById(
                "ruta"
            );

        const selectAeronave =
            document.getElementById(
                "aeronave"
            );

        const formFiltros =
            document.getElementById(
                "form-filtros-vuelos"
            );

        const btnLimpiarFiltros =
            document.getElementById(
                "btn-limpiar-filtros"
            );

        const tituloModal =
            document.getElementById(
                "titulo-modal-vuelo"
            );

        const btnGuardar =
            document.getElementById(
                "btn-guardar-vuelo"
            );


        let modal = null;

        let vueloEditandoId = null;


        if (modalElemento) {

            modal =
                new bootstrap.Modal(
                    modalElemento
                );

        }


        // ==========================================
        // OBTENER TOKEN
        // ==========================================

        function obtenerToken() {

            return (
                sessionStorage.getItem(
                    "access_token"
                ) ||

                localStorage.getItem(
                    "access_token"
                ) ||

                sessionStorage.getItem(
                    "access"
                ) ||

                localStorage.getItem(
                    "access"
                ) ||

                ""
            );

        }


        // ==========================================
        // MOSTRAR MENSAJE
        // ==========================================

        function mostrarMensaje(
            texto,
            tipo = "danger"
        ) {

            if (!mensaje) {
                return;
            }

            mensaje.className =
                `alert alert-${tipo}`;

            mensaje.textContent =
                texto;

        }


        // ==========================================
        // ESCAPAR HTML
        // ==========================================

        function escaparHTML(valor) {

            if (
                valor === null ||
                valor === undefined
            ) {

                return "";

            }

            return String(valor)
                .replace(
                    /&/g,
                    "&amp;"
                )
                .replace(
                    /</g,
                    "&lt;"
                )
                .replace(
                    />/g,
                    "&gt;"
                )
                .replace(
                    /"/g,
                    "&quot;"
                )
                .replace(
                    /'/g,
                    "&#039;"
                );

        }


        // ==========================================
        // OBTENER DATOS DE API
        // ==========================================

        async function obtenerDatos(
            url
        ) {

            const token =
                obtenerToken();


            if (!token) {

                throw new Error(
                    "No se encontró el token de autenticación."
                );

            }


            const respuesta =
                await fetch(
                    url,
                    {
                        method: "GET",

                        headers: {
                            "Accept":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                );


            if (
                respuesta.status === 401
            ) {

                throw new Error(
                    "La sesión ha expirado. Inicie sesión nuevamente."
                );

            }


            if (
                !respuesta.ok
            ) {

                throw new Error(
                    `Error HTTP ${respuesta.status}`
                );

            }


            const resultado =
                await respuesta.json();


            return resultado.data || [];

        }


        // ==========================================
        // CARGAR RUTAS
        // ==========================================

        async function cargarRutas() {

            if (!selectRuta) {
                return;
            }


            selectRuta.innerHTML = `
                <option value="">
                    Cargando rutas...
                </option>
            `;


            try {

                const rutas =
                    await obtenerDatos(
                        "/api/vuelos/rutas/"
                    );


                const rutasActivas =
                    rutas.filter(
                        function (ruta) {

                            return (
                                ruta.estado ===
                                "ACTIVA"
                            );

                        }
                    );


                selectRuta.innerHTML = `
                    <option value="">
                        Seleccione una ruta
                    </option>
                `;


                rutasActivas.forEach(
                    function (ruta) {

                        const opcion =
                            document.createElement(
                                "option"
                            );


                        opcion.value =
                            ruta.id;


                        opcion.textContent =
                            `${ruta.origen} → ${ruta.destino}`;


                        selectRuta.appendChild(
                            opcion
                        );

                    }
                );


                if (
                    rutasActivas.length === 0
                ) {

                    selectRuta.innerHTML = `
                        <option value="">
                            No hay rutas activas disponibles
                        </option>
                    `;

                }


            } catch (error) {

                console.error(
                    "Error cargando rutas:",
                    error
                );


                selectRuta.innerHTML = `
                    <option value="">
                        No fue posible cargar las rutas
                    </option>
                `;

            }

        }


        // ==========================================
        // CARGAR AERONAVES
        // ==========================================

        async function cargarAeronaves() {

            if (!selectAeronave) {
                return;
            }


            selectAeronave.innerHTML = `
                <option value="">
                    Cargando aeronaves...
                </option>
            `;


            try {

                const aeronaves =
                    await obtenerDatos(
                        "/api/vuelos/aeronaves/"
                    );


                const aeronavesActivas =
                    aeronaves.filter(
                        function (aeronave) {

                            return (
                                aeronave.estado ===
                                "ACTIVA"
                            );

                        }
                    );


                selectAeronave.innerHTML = `
                    <option value="">
                        Seleccione una aeronave
                    </option>
                `;


                aeronavesActivas.forEach(
                    function (aeronave) {

                        const opcion =
                            document.createElement(
                                "option"
                            );


                        opcion.value =
                            aeronave.id;


                        opcion.textContent =
                            `${aeronave.codigo} - ${aeronave.modelo} (${aeronave.capacidad} asientos)`;


                        selectAeronave.appendChild(
                            opcion
                        );

                    }
                );


                if (
                    aeronavesActivas.length === 0
                ) {

                    selectAeronave.innerHTML = `
                        <option value="">
                            No hay aeronaves activas disponibles
                        </option>
                    `;

                }


            } catch (error) {

                console.error(
                    "Error cargando aeronaves:",
                    error
                );


                selectAeronave.innerHTML = `
                    <option value="">
                        No fue posible cargar las aeronaves
                    </option>
                `;

            }

        }


        // ==========================================
        // OBTENER FILTROS
        // ==========================================

        function obtenerFiltros() {

            const origen =
                document.getElementById(
                    "filtro-origen"
                ).value.trim();


            const destino =
                document.getElementById(
                    "filtro-destino"
                ).value.trim();


            const fecha =
                document.getElementById(
                    "filtro-fecha"
                ).value;


            return {
                origen,
                destino,
                fecha
            };

        }


        // ==========================================
        // CARGAR VUELOS
        // ==========================================

        async function cargarVuelos() {

            tabla.innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        class="text-center"
                    >
                        Cargando vuelos...
                    </td>
                </tr>
            `;


            try {

                const filtros =
                    obtenerFiltros();


                const parametros =
                    new URLSearchParams();


                if (
                    filtros.origen
                ) {

                    parametros.append(
                        "origen",
                        filtros.origen
                    );

                }


                if (
                    filtros.destino
                ) {

                    parametros.append(
                        "destino",
                        filtros.destino
                    );

                }


                if (
                    filtros.fecha
                ) {

                    parametros.append(
                        "fecha",
                        filtros.fecha
                    );

                }


                const url =
                    parametros.toString()
                        ? `/api/vuelos/vuelos/?${parametros.toString()}`
                        : "/api/vuelos/vuelos/";


                const vuelos =
                    await obtenerDatos(
                        url
                    );


                if (
                    vuelos.length === 0
                ) {

                    tabla.innerHTML = `
                        <tr>
                            <td
                                colspan="8"
                                class="text-center"
                            >
                                No hay vuelos registrados.
                            </td>
                        </tr>
                    `;

                    return;

                }


                tabla.innerHTML =
                    vuelos.map(
                        function (vuelo) {

                            const ruta =
                                vuelo.ruta_detalle
                                    ? `${escaparHTML(vuelo.ruta_detalle.origen)} → ${escaparHTML(vuelo.ruta_detalle.destino)}`
                                    : `Ruta #${vuelo.ruta}`;


                            const aeronave =
                                vuelo.aeronave_detalle
                                    ? `${escaparHTML(vuelo.aeronave_detalle.codigo)} - ${escaparHTML(vuelo.aeronave_detalle.modelo)}`
                                    : `Aeronave #${vuelo.aeronave}`;


                            let claseEstado =
                                "bg-secondary";


                            if (
                                vuelo.estado ===
                                "PROGRAMADO"
                            ) {

                                claseEstado =
                                    "bg-primary";

                            }


                            if (
                                vuelo.estado ===
                                "ACTIVO"
                            ) {

                                claseEstado =
                                    "bg-success";

                            }


                            if (
                                vuelo.estado ===
                                "CERRADO"
                            ) {

                                claseEstado =
                                    "bg-dark";

                            }


                            if (
                                vuelo.estado ===
                                "CANCELADO"
                            ) {

                                claseEstado =
                                    "bg-danger";

                            }


                            let botones =
                                "";


                            // ==========================================
                            // EDITAR
                            // ==========================================

                            if (
                                vuelo.estado !==
                                "CANCELADO"
                            ) {

                                botones += `
                                    <button
                                        type="button"
                                        class="btn btn-sm btn-outline-primary btn-editar-vuelo"
                                        data-id="${vuelo.id}"
                                    >
                                        Editar
                                    </button>
                                `;

                            }


                            // ==========================================
                            // CANCELAR
                            // ==========================================

                            if (
                                vuelo.estado !==
                                "CANCELADO" &&
                                vuelo.estado !==
                                "CERRADO"
                            ) {

                                botones += `
                                    <button
                                        type="button"
                                        class="btn btn-sm btn-outline-danger btn-cancelar-vuelo"
                                        data-id="${vuelo.id}"
                                    >
                                        Cancelar
                                    </button>
                                `;

                            }


                            // ==========================================
                            // CERRAR
                            // ==========================================

                            if (
                                vuelo.estado !==
                                "CANCELADO" &&
                                vuelo.estado !==
                                "CERRADO"
                            ) {

                                botones += `
                                    <button
                                        type="button"
                                        class="btn btn-sm btn-outline-secondary btn-cerrar-vuelo"
                                        data-id="${vuelo.id}"
                                    >
                                        Cerrar
                                    </button>
                                `;

                            }


                            // ==========================================
                            // REABRIR
                            // ==========================================

                            if (
                                vuelo.estado ===
                                "CERRADO"
                            ) {

                                botones += `
                                    <button
                                        type="button"
                                        class="btn btn-sm btn-outline-success btn-reabrir-vuelo"
                                        data-id="${vuelo.id}"
                                    >
                                        Reabrir
                                    </button>
                                `;

                            }


                            return `
                                <tr>

                                    <td>
                                        ${ruta}
                                    </td>

                                    <td>
                                        ${aeronave}
                                    </td>

                                    <td>
                                        ${escaparHTML(
                                            vuelo.fecha
                                        )}
                                    </td>

                                    <td>
                                        ${escaparHTML(
                                            vuelo.hora
                                        )}
                                    </td>

                                    <td>
                                        ${escaparHTML(
                                            vuelo.precio_base
                                        )}
                                    </td>

                                    <td>
                                        <span
                                            class="badge ${claseEstado}"
                                        >
                                            ${escaparHTML(
                                                vuelo.estado
                                            )}
                                        </span>
                                    </td>

                                    <td>
                                        ${escaparHTML(
                                            vuelo.cupos_disponibles
                                        )}
                                    </td>

                                    <td>

                                        <div
                                            class="d-flex gap-1 flex-wrap"
                                        >

                                            ${botones}

                                        </div>

                                    </td>

                                </tr>
                            `;

                        }
                    ).join("");


                conectarAcciones();


            } catch (error) {

                console.error(
                    "Error cargando vuelos:",
                    error
                );


                tabla.innerHTML = `
                    <tr>
                        <td
                            colspan="8"
                            class="text-center text-danger"
                        >
                            ${escaparHTML(
                                error.message ||
                                "No fue posible cargar los vuelos."
                            )}
                        </td>
                    </tr>
                `;

            }

        }


        // ==========================================
        // CONECTAR ACCIONES
        // ==========================================

        function conectarAcciones() {


            document
                .querySelectorAll(
                    ".btn-editar-vuelo"
                )
                .forEach(
                    function (boton) {

                        boton.addEventListener(
                            "click",
                            function () {

                                const id =
                                    boton.dataset.id;

                                editarVuelo(id);

                            }
                        );

                    }
                );


            document
                .querySelectorAll(
                    ".btn-cancelar-vuelo"
                )
                .forEach(
                    function (boton) {

                        boton.addEventListener(
                            "click",
                            function () {

                                cancelarVuelo(
                                    boton.dataset.id
                                );

                            }
                        );

                    }
                );


            document
                .querySelectorAll(
                    ".btn-cerrar-vuelo"
                )
                .forEach(
                    function (boton) {

                        boton.addEventListener(
                            "click",
                            function () {

                                cerrarVuelo(
                                    boton.dataset.id
                                );

                            }
                        );

                    }
                );


            document
                .querySelectorAll(
                    ".btn-reabrir-vuelo"
                )
                .forEach(
                    function (boton) {

                        boton.addEventListener(
                            "click",
                            function () {

                                reabrirVuelo(
                                    boton.dataset.id
                                );

                            }
                        );

                    }
                );

        }


        // ==========================================
        // EDITAR VUELO
        // ==========================================

        async function editarVuelo(id) {

            try {

                vueloEditandoId =
                    id;


                const token =
                    obtenerToken();


                const respuesta =
                    await fetch(
                        `/api/vuelos/vuelos/${id}/`,
                        {
                            method: "GET",

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


                if (
                    !respuesta.ok
                ) {

                    throw new Error(
                        resultado.message ||
                        "No fue posible obtener el vuelo."
                    );

                }


                const vuelo =
                    resultado.data;


                await Promise.all([
                    cargarRutas(),
                    cargarAeronaves()
                ]);


                selectRuta.value =
                    vuelo.ruta;


                selectAeronave.value =
                    vuelo.aeronave;


                document
                    .getElementById(
                        "fecha"
                    )
                    .value =
                    vuelo.fecha;


                document
                    .getElementById(
                        "hora"
                    )
                    .value =
                    vuelo.hora;


                document
                    .getElementById(
                        "precio_base"
                    )
                    .value =
                    vuelo.precio_base;


                document
                    .getElementById(
                        "estado-vuelo"
                    )
                    .value =
                    vuelo.estado;


                if (tituloModal) {

                    tituloModal.textContent =
                        "Editar vuelo";

                }


                if (btnGuardar) {

                    btnGuardar.textContent =
                        "Guardar cambios";

                }


                mensaje.className =
                    "alert d-none";


                mensaje.textContent =
                    "";


                modal.show();


            } catch (error) {

                console.error(
                    "Error editando vuelo:",
                    error
                );


                window.alert(
                    error.message ||
                    "No fue posible editar el vuelo."
                );

            }

        }


        // ==========================================
        // CANCELAR VUELO
        // ==========================================

        async function cancelarVuelo(
            id
        ) {

            const confirmar =
                window.confirm(
                    "¿Está seguro de cancelar este vuelo?"
                );


            if (!confirmar) {
                return;
            }


            const token =
                obtenerToken();


            try {

                const respuesta =
                    await fetch(
                        `/api/vuelos/vuelos/${id}/cancelar/`,
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


                if (
                    !respuesta.ok
                ) {

                    throw new Error(
                        resultado.message ||
                        "No fue posible cancelar el vuelo."
                    );

                }


                await cargarVuelos();


            } catch (error) {

                console.error(
                    "Error cancelando vuelo:",
                    error
                );


                window.alert(
                    error.message ||
                    "No fue posible cancelar el vuelo."
                );

            }

        }


        // ==========================================
        // CERRAR VUELO
        // ==========================================

        async function cerrarVuelo(
            id
        ) {

            const confirmar =
                window.confirm(
                    "¿Está seguro de cerrar este vuelo?"
                );


            if (!confirmar) {
                return;
            }


            const token =
                obtenerToken();


            try {

                const respuesta =
                    await fetch(
                        `/api/vuelos/vuelos/${id}/cerrar/`,
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


                if (
                    !respuesta.ok
                ) {

                    throw new Error(
                        resultado.message ||
                        "No fue posible cerrar el vuelo."
                    );

                }


                await cargarVuelos();


            } catch (error) {

                console.error(
                    "Error cerrando vuelo:",
                    error
                );


                window.alert(
                    error.message ||
                    "No fue posible cerrar el vuelo."
                );

            }

        }


        // ==========================================
        // REABRIR VUELO
        // ==========================================

        async function reabrirVuelo(
            id
        ) {

            const confirmar =
                window.confirm(
                    "¿Desea reabrir este vuelo y devolverlo a estado PROGRAMADO?"
                );


            if (!confirmar) {
                return;
            }


            const token =
                obtenerToken();


            try {

                const respuesta =
                    await fetch(
                        `/api/vuelos/vuelos/${id}/reabrir/`,
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


                if (
                    !respuesta.ok
                ) {

                    throw new Error(
                        resultado.message ||
                        "No fue posible reabrir el vuelo."
                    );

                }


                await cargarVuelos();


            } catch (error) {

                console.error(
                    "Error reabriendo vuelo:",
                    error
                );


                window.alert(
                    error.message ||
                    "No fue posible reabrir el vuelo."
                );

            }

        }


        // ==========================================
        // ABRIR MODAL NUEVO VUELO
        // ==========================================

        btnNuevo.addEventListener(
            "click",
            async function () {

                vueloEditandoId =
                    null;


                formulario.reset();


                if (tituloModal) {

                    tituloModal.textContent =
                        "Nuevo vuelo";

                }


                if (btnGuardar) {

                    btnGuardar.textContent =
                        "Guardar vuelo";

                }


                mensaje.className =
                    "alert d-none";


                mensaje.textContent =
                    "";


                await Promise.all([
                    cargarRutas(),
                    cargarAeronaves()
                ]);


                modal.show();

            }
        );


        // ==========================================
        // GUARDAR / EDITAR VUELO
        // ==========================================

        formulario.addEventListener(
            "submit",
            async function (evento) {

                evento.preventDefault();


                mensaje.className =
                    "alert d-none";


                const token =
                    obtenerToken();


                if (!token) {

                    mostrarMensaje(
                        "No se encontró el token de autenticación."
                    );

                    return;

                }


                const datos = {

                    ruta:
                        Number(
                            selectRuta.value
                        ),

                    aeronave:
                        Number(
                            selectAeronave.value
                        ),

                    fecha:
                        document
                            .getElementById(
                                "fecha"
                            )
                            .value,

                    hora:
                        document
                            .getElementById(
                                "hora"
                            )
                            .value,

                    precio_base:
                        document
                            .getElementById(
                                "precio_base"
                            )
                            .value,

                    estado:
                        document
                            .getElementById(
                                "estado-vuelo"
                            )
                            .value

                };


                if (
                    !datos.ruta ||
                    !datos.aeronave ||
                    !datos.fecha ||
                    !datos.hora ||
                    !datos.precio_base
                ) {

                    mostrarMensaje(
                        "Complete todos los campos obligatorios."
                    );

                    return;

                }


                try {

                    const esEdicion =
                        Boolean(
                            vueloEditandoId
                        );


                    const url =
                        esEdicion
                            ? `/api/vuelos/vuelos/${vueloEditandoId}/`
                            : "/api/vuelos/vuelos/";


                    const metodo =
                        esEdicion
                            ? "PUT"
                            : "POST";


                    const respuesta =
                        await fetch(
                            url,
                            {
                                method:
                                    metodo,

                                headers: {

                                    "Accept":
                                        "application/json",

                                    "Content-Type":
                                        "application/json",

                                    "Authorization":
                                        `Bearer ${token}`

                                },

                                body:
                                    JSON.stringify(
                                        datos
                                    )

                            }
                        );


                    const resultado =
                        await respuesta.json();


                    if (
                        !respuesta.ok
                    ) {

                        let mensajeError =
                            resultado.message ||
                            "No fue posible guardar el vuelo.";


                        if (
                            resultado.errors
                        ) {

                            const errores =
                                Object.entries(
                                    resultado.errors
                                )
                                .map(
                                    function (
                                        [
                                            campo,
                                            mensajes
                                        ]
                                    ) {

                                        return (
                                            `${campo}: ` +
                                            (
                                                Array.isArray(
                                                    mensajes
                                                )
                                                    ? mensajes.join(
                                                        ", "
                                                    )
                                                    : mensajes
                                            )
                                        );

                                    }
                                )
                                .join(
                                    " | "
                                );


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
                            ? "Vuelo actualizado correctamente."
                            : "Vuelo creado correctamente.",
                        "success"
                    );


                    setTimeout(
                        async function () {

                            modal.hide();

                            formulario.reset();

                            vueloEditandoId =
                                null;

                            await cargarVuelos();

                        },
                        800
                    );


                } catch (error) {

                    console.error(
                        "Error guardando vuelo:",
                        error
                    );


                    mostrarMensaje(
                        error.message ||
                        "Ocurrió un error al guardar el vuelo."
                    );

                }

            }
        );


        // ==========================================
        // FILTROS
        // ==========================================

        formFiltros.addEventListener(
            "submit",
            function (evento) {

                evento.preventDefault();

                cargarVuelos();

            }
        );


        btnLimpiarFiltros.addEventListener(
            "click",
            function () {

                formFiltros.reset();

                cargarVuelos();

            }
        );


        // ==========================================
        // RESTABLECER MODAL AL CERRAR
        // ==========================================

        if (modalElemento) {

            modalElemento.addEventListener(
                "hidden.bs.modal",
                function () {

                    vueloEditandoId =
                        null;


                    formulario.reset();


                    if (tituloModal) {

                        tituloModal.textContent =
                            "Nuevo vuelo";

                    }


                    if (btnGuardar) {

                        btnGuardar.textContent =
                            "Guardar vuelo";

                    }


                    mensaje.className =
                        "alert d-none";


                    mensaje.textContent =
                        "";

                }
            );

        }


        // ==========================================
        // INICIAR
        // ==========================================

        cargarVuelos();

    });

})();