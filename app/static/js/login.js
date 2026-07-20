/* app/static/js/login.js
 *
 * Pantalla de inicio de sesión.
 * Requiere api.js.
 */

(function () {
    "use strict";
  
    const formulario =
      document.getElementById(
        "form-login"
      );
  
    if (!formulario) {
      return;
    }
  
    if (
      sessionStorage.getItem(
        "access_token"
      )
    ) {
      window.location.href = "/panel/";
      return;
    }
  
    const boton =
      document.getElementById(
        "boton-login"
      );
  
    const contenedorError =
      document.getElementById(
        "mensaje-error"
      );
  
    const mensajeError =
      contenedorError?.querySelector(
        "[data-msg]"
      );
  
    const botonMostrar =
      document.getElementById(
        "toggle-password"
      );
  
    const inputPassword =
      document.getElementById(
        "password"
      );
  
    const inputEmail =
      document.getElementById(
        "email"
      );
  
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
  
      boton.disabled = activa;
  
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
            : "Continuar";
      }
    }
  
    botonMostrar?.addEventListener(
      "click",
      () => {
        const mostrar =
          inputPassword.type ===
          "password";
  
        inputPassword.type =
          mostrar
            ? "text"
            : "password";
  
        botonMostrar.setAttribute(
          "aria-pressed",
          String(mostrar)
        );
  
        botonMostrar.setAttribute(
          "aria-label",
          mostrar
            ? "Ocultar contraseña"
            : "Mostrar contraseña"
        );
  
        const icono =
          botonMostrar.querySelector("i");
  
        icono?.classList.toggle(
          "bi-eye",
          !mostrar
        );
  
        icono?.classList.toggle(
          "bi-eye-slash",
          mostrar
        );
      }
    );
  
    formulario.addEventListener(
      "submit",
      async (evento) => {
        evento.preventDefault();
  
        ocultarError();
  
        const email =
          inputEmail.value.trim();
  
        const password =
          inputPassword.value;
  
        if (!email || !password) {
          mostrarError(
            "Ingrese el correo electrónico y la contraseña."
          );
  
          return;
        }
  
        if (!inputEmail.validity.valid) {
          mostrarError(
            "Ingrese un correo electrónico válido."
          );
  
          inputEmail.focus();
          return;
        }
  
        establecerCarga(true);
  
        try {
          const datos =
            await API.post(
              "/api/auth/login/",
              {
                email,
                password,
              },
              {
                anonimo: true,
              }
            );
  
          if (!datos?.otp_token) {
            mostrarError(
              "No fue posible generar el código de verificación."
            );
  
            return;
          }
  
          sessionStorage.setItem(
            "otp_token",
            datos.otp_token
          );
  
          const codigoDemo =
            datos.codigo_otp_demo ||
            datos.codigo_demo;
  
          if (codigoDemo) {
            sessionStorage.setItem(
              "codigo_otp_demo",
              codigoDemo
            );
          } else {
            sessionStorage.removeItem(
              "codigo_otp_demo"
            );
          }
  
          window.location.href =
            "/verificar-otp/";
        } catch (error) {
          mostrarError(
            error.mensaje ||
            "Las credenciales ingresadas no son válidas."
          );
        } finally {
          establecerCarga(false);
        }
      }
    );
  })();