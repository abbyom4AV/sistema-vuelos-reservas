window.ApiCliente = {
    obtenerAccessToken() {
        return sessionStorage.getItem("access_token");
    },

    obtenerRefreshToken() {
        return sessionStorage.getItem("refresh_token");
    },

    limpiarSesion() {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
        sessionStorage.removeItem("usuario");
        sessionStorage.removeItem("otp_token");
        sessionStorage.removeItem("codigo_otp_demo");
    },

    async renovarAccessToken() {
        const refresh = this.obtenerRefreshToken();

        if (!refresh) {
            return false;
        }

        const respuesta = await fetch(
            "/api/auth/refresh/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    refresh: refresh,
                }),
            }
        );

        if (!respuesta.ok) {
            this.limpiarSesion();
            return false;
        }

        const datos = await respuesta.json();

        sessionStorage.setItem(
            "access_token",
            datos.access
        );

        if (datos.refresh) {
            sessionStorage.setItem(
                "refresh_token",
                datos.refresh
            );
        }

        return true;
    },

    async solicitar(
        url,
        opciones = {},
        requiereAutenticacion = true
    ) {
        const encabezados = {
            "Content-Type": "application/json",
            ...(opciones.headers || {}),
        };

        if (requiereAutenticacion) {
            const access = this.obtenerAccessToken();

            if (access) {
                encabezados.Authorization =
                    `Bearer ${access}`;
            }
        }

        let respuesta = await fetch(
            url,
            {
                ...opciones,
                headers: encabezados,
            }
        );

        if (
            respuesta.status === 401
            && requiereAutenticacion
            && this.obtenerRefreshToken()
        ) {
            const renovado = await this.renovarAccessToken();

            if (renovado) {
                encabezados.Authorization =
                    `Bearer ${this.obtenerAccessToken()}`;

                respuesta = await fetch(
                    url,
                    {
                        ...opciones,
                        headers: encabezados,
                    }
                );
            }
        }

        let datos = {};

        if (respuesta.status !== 204) {
            datos = await respuesta
                .json()
                .catch(() => ({}));
        }

        return {
            ok: respuesta.ok,
            status: respuesta.status,
            data: datos,
        };
    },
};