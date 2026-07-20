document.addEventListener(
    "DOMContentLoaded",
    () => {
        if (ApiCliente.obtenerAccessToken()) {
            window.location.href = "/panel/";
            return;
        }

        const formulario =
            document.getElementById("form-login");

        const mensajeError =
            document.getElementById("mensaje-error");

        const boton =
            document.getElementById("boton-login");

        formulario.addEventListener(
            "submit",
            async (evento) => {
                evento.preventDefault();

                mensajeError.classList.add("d-none");
                boton.disabled = true;
                boton.textContent = "Validando...";

                const respuesta = await ApiCliente.solicitar(
                    "/api/auth/login/",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            email:
                                document.getElementById("email").value,
                            password:
                                document.getElementById("password").value,
                        }),
                    },
                    false
                );

                if (!respuesta.ok) {
                    mensajeError.textContent =
                        respuesta.data.message
                        || "No fue posible iniciar sesión.";

                    mensajeError.classList.remove("d-none");
                    boton.disabled = false;
                    boton.textContent = "Continuar";
                    return;
                }

                const datos = respuesta.data.data;

                sessionStorage.setItem(
                    "otp_token",
                    datos.otp_token
                );

                if (datos.codigo_otp_demo) {
                    sessionStorage.setItem(
                        "codigo_otp_demo",
                        datos.codigo_otp_demo
                    );
                }

                window.location.href = "/verificar-otp/";
            }
        );
    }
);