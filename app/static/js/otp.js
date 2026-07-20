document.addEventListener(
    "DOMContentLoaded",
    () => {
        const otpToken =
            sessionStorage.getItem("otp_token");

        if (!otpToken) {
            window.location.href = "/";
            return;
        }

        const codigoDemo =
            sessionStorage.getItem("codigo_otp_demo");

        const contenedorDemo =
            document.getElementById("codigo-demo");

        if (codigoDemo) {
            contenedorDemo.textContent =
                `Código académico de demostración: ${codigoDemo}`;

            contenedorDemo.classList.remove("d-none");
        }

        const formulario =
            document.getElementById("form-otp");

        const mensajeError =
            document.getElementById("mensaje-error");

        const boton =
            document.getElementById("boton-verificar");

        formulario.addEventListener(
            "submit",
            async (evento) => {
                evento.preventDefault();

                mensajeError.classList.add("d-none");
                boton.disabled = true;
                boton.textContent = "Verificando...";

                const codigo =
                    document.getElementById("codigo")
                        .value
                        .trim();

                const respuesta = await ApiCliente.solicitar(
                    "/api/auth/verificar-otp/",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            otp_token: otpToken,
                            codigo: codigo,
                        }),
                    },
                    false
                );

                if (!respuesta.ok) {
                    mensajeError.textContent =
                        respuesta.data.message
                        || "El código no pudo validarse.";

                    mensajeError.classList.remove("d-none");
                    boton.disabled = false;
                    boton.textContent = "Verificar código";
                    return;
                }

                const datos = respuesta.data.data;

                sessionStorage.setItem(
                    "access_token",
                    datos.access
                );

                sessionStorage.setItem(
                    "refresh_token",
                    datos.refresh
                );

                sessionStorage.setItem(
                    "usuario",
                    JSON.stringify(datos.usuario)
                );

                sessionStorage.removeItem("otp_token");
                sessionStorage.removeItem("codigo_otp_demo");

                window.location.href = "/panel/";
            }
        );
    }
);