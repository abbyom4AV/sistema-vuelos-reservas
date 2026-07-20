/* app/static/js/api.js
 *
 * Cliente HTTP centralizado.
 * Compatible con Django REST Framework y JWT.
 *
 * Expone:
 * - API.get()
 * - API.post()
 * - API.put()
 * - API.patch()
 * - API.delete()
 * - API.limpiarSesion()
 *
 * Mantiene compatibilidad con ApiCliente usado por los archivos anteriores.
 */

(function (global) {
    "use strict";
  
    const BASE = "";
    const STORAGE = window.sessionStorage;
  
    function getToken(nombre) {
      return STORAGE.getItem(nombre);
    }
  
    function setToken(nombre, valor) {
      if (valor) {
        STORAGE.setItem(nombre, valor);
      } else {
        STORAGE.removeItem(nombre);
      }
    }
  
    function limpiarSesion() {
      [
        "access_token",
        "refresh_token",
        "usuario",
        "otp_token",
        "codigo_otp_demo",
      ].forEach((nombre) => {
        STORAGE.removeItem(nombre);
      });
    }
  
    function tryJson(texto) {
      try {
        return JSON.parse(texto);
      } catch (error) {
        return texto;
      }
    }
  
    function extraerMensajeError(datos, estado) {
      if (!datos) {
        return `Error ${estado}`;
      }
  
      if (typeof datos === "string") {
        return datos;
      }
  
      if (datos.message) {
        return datos.message;
      }
  
      if (datos.mensaje) {
        return datos.mensaje;
      }
  
      if (datos.detail) {
        return datos.detail;
      }
  
      if (datos.error) {
        return datos.error;
      }
  
      if (datos.errors && typeof datos.errors === "object") {
        const primerError = Object.values(datos.errors)[0];
  
        if (Array.isArray(primerError)) {
          return primerError[0];
        }
  
        if (typeof primerError === "string") {
          return primerError;
        }
      }
  
      const primerValor = Object.values(datos)[0];
  
      if (Array.isArray(primerValor)) {
        return primerValor[0];
      }
  
      if (typeof primerValor === "string") {
        return primerValor;
      }
  
      return `Error ${estado}`;
    }
  
    function crearError(estado, datos) {
      const mensaje = extraerMensajeError(
        datos,
        estado
      );
  
      const error = new Error(mensaje);
  
      error.status = estado;
      error.mensaje = mensaje;
      error.data = datos;
  
      return error;
    }
  
    function normalizarRespuesta(datos) {
      if (
        datos &&
        typeof datos === "object" &&
        !Array.isArray(datos) &&
        Object.prototype.hasOwnProperty.call(datos, "data") &&
        (
          Object.prototype.hasOwnProperty.call(datos, "success") ||
          Object.prototype.hasOwnProperty.call(datos, "message") ||
          Object.prototype.hasOwnProperty.call(datos, "mensaje")
        )
      ) {
        return datos.data;
      }
  
      return datos;
    }
  
    async function ejecutarPeticion(
      metodo,
      ruta,
      cuerpo,
      opciones = {}
    ) {
      const headers = {
        Accept: "application/json",
        ...(opciones.headers || {}),
      };
  
      const esFormData =
        cuerpo instanceof FormData;
  
      if (
        cuerpo !== undefined &&
        cuerpo !== null &&
        !esFormData
      ) {
        headers["Content-Type"] =
          "application/json";
      }
  
      const accessToken =
        getToken("access_token");
  
      if (
        accessToken &&
        !opciones.anonimo
      ) {
        headers.Authorization =
          `Bearer ${accessToken}`;
      }
  
      const configuracion = {
        method: metodo,
        headers,
      };
  
      if (
        cuerpo !== undefined &&
        cuerpo !== null
      ) {
        configuracion.body =
          esFormData
            ? cuerpo
            : JSON.stringify(cuerpo);
      }
  
      let respuesta = await fetch(
        BASE + ruta,
        configuracion
      );
  
      const debeRenovar =
        respuesta.status === 401 &&
        !opciones.anonimo &&
        !opciones._retry &&
        ruta !== "/api/auth/refresh/";
  
      if (debeRenovar) {
        try {
          const nuevoToken =
            await refrescarToken();
  
          configuracion.headers.Authorization =
            `Bearer ${nuevoToken}`;
  
          respuesta = await fetch(
            BASE + ruta,
            configuracion
          );
        } catch (error) {
          window.dispatchEvent(
            new CustomEvent(
              "api:sesion-expirada"
            )
          );
  
          throw error;
        }
      }
  
      const texto =
        await respuesta.text();
  
      const datos =
        texto
          ? tryJson(texto)
          : null;
  
      if (!respuesta.ok) {
        throw crearError(
          respuesta.status,
          datos
        );
      }
  
      return {
        status: respuesta.status,
        datos,
      };
    }
  
    async function refrescarToken() {
      const refreshToken =
        getToken("refresh_token");
  
      if (!refreshToken) {
        limpiarSesion();
  
        throw crearError(
          401,
          {
            message: "La sesión ha expirado.",
          }
        );
      }
  
      const respuesta = await fetch(
        BASE + "/api/auth/refresh/",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh: refreshToken,
          }),
        }
      );
  
      const texto =
        await respuesta.text();
  
      const datos =
        texto
          ? tryJson(texto)
          : null;
  
      if (!respuesta.ok) {
        limpiarSesion();
  
        throw crearError(
          respuesta.status,
          datos || {
            message: "La sesión ha expirado.",
          }
        );
      }
  
      const contenido =
        normalizarRespuesta(datos);
  
      if (!contenido?.access) {
        limpiarSesion();
  
        throw crearError(
          401,
          {
            message:
              "No fue posible renovar la sesión.",
          }
        );
      }
  
      setToken(
        "access_token",
        contenido.access
      );
  
      if (contenido.refresh) {
        setToken(
          "refresh_token",
          contenido.refresh
        );
      }
  
      return contenido.access;
    }
  
    async function request(
      metodo,
      ruta,
      cuerpo,
      opciones = {}
    ) {
      const respuesta =
        await ejecutarPeticion(
          metodo,
          ruta,
          cuerpo,
          opciones
        );
  
      return normalizarRespuesta(
        respuesta.datos
      );
    }
  
    function escapeHtml(valor) {
      return String(valor || "").replace(
        /[&<>"']/g,
        (caracter) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[caracter]
      );
    }
  
    const API = {
      get(ruta, opciones) {
        return request(
          "GET",
          ruta,
          undefined,
          opciones
        );
      },
  
      post(ruta, cuerpo, opciones) {
        return request(
          "POST",
          ruta,
          cuerpo,
          opciones
        );
      },
  
      put(ruta, cuerpo, opciones) {
        return request(
          "PUT",
          ruta,
          cuerpo,
          opciones
        );
      },
  
      patch(ruta, cuerpo, opciones) {
        return request(
          "PATCH",
          ruta,
          cuerpo,
          opciones
        );
      },
  
      delete(ruta, opciones) {
        return request(
          "DELETE",
          ruta,
          undefined,
          opciones
        );
      },
  
      limpiarSesion,
  
      escapeHtml,
    };
  
    API.mostrarError = function (mensaje) {
      const contenedor =
        document.getElementById(
          "mensaje-error"
        );
  
      if (!contenedor) {
        return;
      }
  
      contenedor.hidden = false;
      contenedor.classList.remove("d-none");
  
      if (
        contenedor.classList.contains(
          "position-fixed"
        )
      ) {
        contenedor.innerHTML = `
          <div class="alert alert-danger shadow-sm mb-0">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <span>${escapeHtml(mensaje)}</span>
          </div>
        `;
  
        window.setTimeout(() => {
          contenedor.hidden = true;
          contenedor.innerHTML = "";
        }, 4500);
  
        return;
      }
  
      const texto =
        contenedor.querySelector(
          "[data-msg]"
        );
  
      if (texto) {
        texto.textContent = mensaje;
      } else {
        contenedor.textContent = mensaje;
      }
    };
  
    const ApiCliente = {
      obtenerAccessToken() {
        return getToken("access_token");
      },
  
      obtenerRefreshToken() {
        return getToken("refresh_token");
      },
  
      limpiarSesion,
  
      async renovarAccessToken() {
        try {
          await refrescarToken();
          return true;
        } catch (error) {
          return false;
        }
      },
  
      async solicitar(
        ruta,
        opciones = {},
        requiereAutenticacion = true
      ) {
        const metodo =
          opciones.method || "GET";
  
        let cuerpo;
  
        if (opciones.body instanceof FormData) {
          cuerpo = opciones.body;
        } else if (
          typeof opciones.body === "string"
        ) {
          try {
            cuerpo = JSON.parse(
              opciones.body
            );
          } catch (error) {
            cuerpo = opciones.body;
          }
        } else {
          cuerpo = opciones.body;
        }
  
        try {
          const respuesta =
            await ejecutarPeticion(
              metodo,
              ruta,
              cuerpo,
              {
                headers: opciones.headers,
                anonimo:
                  !requiereAutenticacion,
              }
            );
  
          return {
            ok: true,
            status: respuesta.status,
            data: respuesta.datos,
          };
        } catch (error) {
          return {
            ok: false,
            status: error.status || 500,
            data:
              error.data || {
                message:
                  error.mensaje ||
                  "Ocurrió un error inesperado.",
              },
          };
        }
      },
    };
  
    window.addEventListener(
      "api:sesion-expirada",
      () => {
        limpiarSesion();
  
        const rutasPublicas = [
          "/",
          "/verificar-otp/",
        ];
  
        if (
          !rutasPublicas.includes(
            window.location.pathname
          )
        ) {
          window.location.href = "/";
        }
      }
    );
  
    global.API = API;
    global.ApiCliente = ApiCliente;
  })(window);