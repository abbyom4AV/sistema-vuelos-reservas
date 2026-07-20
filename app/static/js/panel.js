document.addEventListener(
    "DOMContentLoaded",
    async () => {
        if (!ApiCliente.obtenerAccessToken()) {
            window.location.href = "/";
            return;
        }

        const respuesta = await ApiCliente.solicitar(
            "/api/usuarios/perfil/",
            {
                method: "GET",
            }
        );

        if (!respuesta.ok) {
            ApiCliente.limpiarSesion();
            window.location.href = "/";
            return;
        }

        const usuario = respuesta.data.data;

        const nombre =
            usuario.nombre_completo
            || usuario.email;

        document.getElementById(
            "nombre-usuario"
        ).textContent = nombre;

        const nombreRol =
            usuario.rol
            ? usuario.rol.nombre
            : "SIN ROL";

        document.getElementById(
            "rol-usuario"
        ).textContent = nombreRol;

        if (nombreRol !== "ADMINISTRADOR") {
            document.getElementById(
                "tarjeta-usuarios"
            ).classList.add("d-none");

            document.getElementById(
                "tarjeta-bitacora"
            ).classList.add("d-none");
        }

        document.getElementById(
            "boton-logout"
        ).addEventListener(
            "click",
            async () => {
                const refresh =
                    ApiCliente.obtenerRefreshToken();

                if (refresh) {
                    await ApiCliente.solicitar(
                        "/api/auth/logout/",
                        {
                            method: "POST",
                            body: JSON.stringify({
                                refresh: refresh,
                            }),
                        }
                    );
                }

                ApiCliente.limpiarSesion();
                window.location.href = "/";
            }
        );
    }
);