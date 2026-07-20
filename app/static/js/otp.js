/* app/static/js/otp.js
 *
 * Pantalla de verificación OTP.
 * Requiere api.js.
 */

(function () {
    "use strict";
  
    const formulario =
      document.getElementById(
        "form-otp"
      );
  
    if (!formulario) {
      return;
    }
  
    const boton =
      document.getElementById(
        "boton-verificar"
      );
  
    const input =
      document.getElementById(
        "codigo"
      );
  
    const contenedorError =
      document.getElementById(
        "mensaje-error"
      );
  
    const mensajeError =
      contenedorError?.querySelector(
        "[data-msg]"
      );
  
    const contenedorDemo =
      document.getElementById(
        "codigo-demo"
      );
  
    const textoDemo =
      contenedorDemo?.querySelector(
        "[data-demo]"
      );
  
    const cronometro =
      document.querySelector(
        "[data-timer]"
      );
  
    const botonVolver =
      document.getElementById(
        "boton-volver"
      );
  
    const otpToken =
      sessionStorage.getItem(
        "otp_token"
      );
  
    let codigoExpirado = false;
    let tiempoRestante = 300;
  
    if (!otpToken) {
      window.location.href = "/";
      return;
    }
  
    const codigoDemo =
      sessionStorage.getItem(
        "codigo_otp_demo"
      );
  
    if (
      codigoDemo &&
      contenedorDemo
    ) {
      contenedorDemo.hidden = false;
      contenedorDemo.classList.remove(
        "d-none"
      );
  
      if (textoDemo) {
        textoDemo.textContent =
          codigoDemo;
      }
    }
  
    function mostrarError(mensaje) {
      if (!contenedorError) {
        return;
      }
  
      if (mensajeError) {
        mensajeError.textContent =
          mensaje;
      } else {
        contenedorError.textContent =
          mensaje;
      }
  
      contenedorError.hidden = false;
      contenedorError.classList.remove(
        "d-none"
      );
    }
  
    function ocultarError() {
      if (!contenedorError) {
        return;
      }
  
      if (mensajeError) {
        mensajeError.textContent = "";
      } else {
        contenedorError.textContent = "";
      }
  
      contenedorError.hidden = true;
      contenedorError.classList.add(
        "d-none"
      );
    }
  
    function establecerCarga(activa) {
      if (!boton) {
        return;
      }
  
      boton.disabled =
        activa || codigoExpirado;
  
      const spinner =
        boton.querySelector(".spinner");
  
      const etiqueta =
        boton.querySelector(
          "[data-label]"
        );
  
      if (spinner) {
        spinner.hidden = !activa;
      }
  
      if (etiqueta) {
        etiqueta.textContent =
          activa
            ? "Verificando…"
            : "Verificar código";
      }
    }
  
    function formatearTiempo(segundos) {
      const minutos =
        Math.floor(segundos / 60);
  
      const segundosRestantes =
        segundos % 60;
  
      return (
        String(minutos).padStart(
          2,
          "0"
        ) +
        ":" +
        String(
          segundosRestantes
        ).padStart(2, "0")
      );
    }
  
    function limpiarDatosOtp() {
      sessionStorage.removeItem(
        "otp_token"
      );
  
      sessionStorage.removeItem(
        "codigo_otp_demo"
      );
    }
  
    if (cronometro) {
      cronometro.textContent =
        formatearTiempo(
          tiempoRestante
        );
    }
  
    const intervalo =
      window.setInterval(
        () => {
          tiempoRestante = Math.max(
            0,
            tiempoRestante - 1
          );
  
          if (cronometro) {
            cronometro.textContent =
              formatearTiempo(
                tiempoRestante
              );
          }
  
          if (
            tiempoRestante === 0
          ) {
            window.clearInterval(
              intervalo
            );
  
            codigoExpirado = true;
  
            mostrarError(
              "El código ha expirado. Vuelva a iniciar sesión."
            );
  
            if (boton) {
              boton.disabled = true;
            }
          }
        },
        1000
      );
  
    input?.addEventListener(
      "input",
      () => {
        input.value =
          input.value
            .replace(/\D/g, "")
            .slice(0, 6);
  
        ocultarError();
      }
    );
  
    botonVolver?.addEventListener(
      "click",
      () => {
        window.clearInterval(
          intervalo
        );
  
        limpiarDatosOtp();
  
        window.location.href = "/";
      }
    );
  
    formulario.addEventListener(
      "submit",
      async (evento) => {
        evento.preventDefault();
  
        ocultarError();
  
        if (codigoExpirado) {
          mostrarError(
            "El código ha expirado. Vuelva a iniciar sesión."
          );
  
          return;
        }
  
        const codigo =
          input.value.trim();
  
        if (
          !/^\d{6}$/.test(codigo)
        ) {
          mostrarError(
            "El código debe contener exactamente 6 dígitos."
          );
  
          input.focus();
          return;
        }
  
        establecerCarga(true);
  
        try {
          const datos =
            await API.post(
              "/api/auth/verificar-otp/",
              {
                otp_token: otpToken,
                codigo,
              },
              {
                anonimo: true,
              }
            );
  
          if (
            !datos?.access ||
            !datos?.refresh
          ) {
            mostrarError(
              "No fue posible completar el inicio de sesión."
            );
  
            return;
          }
  
          sessionStorage.setItem(
            "access_token",
            datos.access
          );
  
          sessionStorage.setItem(
            "refresh_token",
            datos.refresh
          );
  
          if (datos.usuario) {
            sessionStorage.setItem(
              "usuario",
              JSON.stringify(
                datos.usuario
              )
            );
          }
  
          limpiarDatosOtp();
  
          window.clearInterval(
            intervalo
          );
  
          window.location.href =
            "/panel/";
        } catch (error) {
          mostrarError(
            error.mensaje ||
            "El código ingresado no es válido."
          );
  
          input.select();
          input.focus();
        } finally {
          establecerCarga(false);
        }
      }
    );
  })();