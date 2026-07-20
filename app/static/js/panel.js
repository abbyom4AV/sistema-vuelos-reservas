/* app/static/js/panel.js
 * Layout autenticado: sesión, usuario, sidebar, logout, KPIs y actividad.
 */

(function () {
    "use strict";
  
    const accessToken =
      sessionStorage.getItem("access_token");
  
    if (!accessToken) {
      window.location.href = "/";
      return;
    }
  
    let usuario = {};
  
    try {
      usuario = JSON.parse(
        sessionStorage.getItem("usuario") || "{}"
      );
    } catch (error) {
      usuario = {};
    }
  
    let rol = obtenerRol(usuario);
  
    function obtenerRol(datosUsuario) {
      if (!datosUsuario?.rol) {
        return "";
      }
  
      if (typeof datosUsuario.rol === "string") {
        return datosUsuario.rol.toUpperCase();
      }
  
      return (
        datosUsuario.rol.nombre ||
        datosUsuario.rol.name ||
        ""
      ).toUpperCase();
    }
  
    function obtenerNombre(datosUsuario) {
      if (datosUsuario?.nombre_completo) {
        return datosUsuario.nombre_completo;
      }
  
      const nombreCompleto = [
        datosUsuario?.first_name,
        datosUsuario?.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();
  
      return (
        nombreCompleto ||
        datosUsuario?.username ||
        datosUsuario?.email ||
        "Usuario"
      );
    }
  
    function validarAccesoRequerido() {
      const appShell =
        document.querySelector(".app-shell");

      const rolRequerido =
        appShell?.dataset.rolRequerido;

      if (
        rolRequerido &&
        rol !== rolRequerido
      ) {
        window.location.replace(
          "/acceso-denegado/"
        );

        return false;
      }

      return true;
    }

    function setText(id, valor) {
      const elemento =
        document.getElementById(id);
  
      if (elemento) {
        elemento.textContent = valor;
      }
    }
  
    function iniciales(nombre) {
      return (
        String(nombre || "")
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((parte) => parte[0])
          .join("")
          .toUpperCase() || "··"
      );
    }
  
    function setKpi(nombre, valor) {
      const elemento =
        document.querySelector(
          `[data-kpi="${nombre}"]`
        );
  
      if (!elemento) {
        return;
      }
  
      if (
        valor === undefined ||
        valor === null ||
        valor === ""
      ) {
        elemento.textContent = "—";
        return;
      }
  
      elemento.textContent =
        typeof valor === "number"
          ? valor.toLocaleString("es-CR")
          : valor;
    }
  
    function extraerTotal(datos) {
      if (!datos) {
        return 0;
      }
  
      if (typeof datos.count === "number") {
        return datos.count;
      }
  
      if (Array.isArray(datos)) {
        return datos.length;
      }
  
      if (Array.isArray(datos.results)) {
        return datos.results.length;
      }
  
      if (Array.isArray(datos.items)) {
        return datos.items.length;
      }
  
      return 0;
    }
  
    function listaDe(datos) {
      if (!datos) {
        return [];
      }
  
      if (Array.isArray(datos)) {
        return datos;
      }
  
      if (Array.isArray(datos.results)) {
        return datos.results;
      }
  
      if (Array.isArray(datos.items)) {
        return datos.items;
      }
  
      return [];
    }
  
    function fechaCorta(fecha) {
      if (!fecha) {
        return "—";
      }
  
      try {
        return new Date(fecha).toLocaleString(
          "es-CR",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        );
      } catch (error) {
        return String(fecha);
      }
    }
  
    function aplicarUsuario(datosUsuario) {
      usuario = datosUsuario || {};
      rol = obtenerRol(usuario);
  
      const nombre =
        obtenerNombre(usuario);
  
      setText(
        "nombre-usuario",
        nombre
      );
  
      setText(
        "rol-usuario",
        rol || "—"
      );
  
      setText(
        "menu-usuario-email",
        usuario.email || ""
      );
  
      const avatar =
        document.getElementById(
          "avatar-usuario"
        );
  
      if (avatar) {
        avatar.textContent =
          iniciales(nombre);
      }
  
      document
        .querySelectorAll(
          "[data-scope='admin']"
        )
        .forEach((elemento) => {
          elemento.hidden =
            rol !== "ADMINISTRADOR";
        });
  
      document
        .querySelectorAll(
          "[data-scope='cliente']"
        )
        .forEach((elemento) => {
          elemento.hidden =
            rol !== "CLIENTE";
        });
  
      document
        .querySelectorAll(
          ".nav-sidebar"
        )
        .forEach((nav) => {
          nav.dataset.rol = rol;
        });
  
      const panelCliente =
        document.getElementById(
          "panel-cliente"
        );

      if (panelCliente) {
        panelCliente.hidden =
          rol !== "CLIENTE";
      }

      const panelAdministrador =
        document.getElementById(
          "panel-administrador"
        );

      if (panelAdministrador) {
        panelAdministrador.hidden =
          rol !== "ADMINISTRADOR";
      }

      const accionesAdministrador =
        document.getElementById(
          "acciones-administrador"
        );
  
      if (accionesAdministrador) {
        accionesAdministrador.hidden =
          rol !== "ADMINISTRADOR";
      }
  
      const tarjetaUsuarios =
        document.getElementById(
          "tarjeta-usuarios"
        );
  
      if (tarjetaUsuarios) {
        tarjetaUsuarios.hidden =
          rol !== "ADMINISTRADOR";
      }
  
      const tarjetaBitacora =
        document.getElementById(
          "tarjeta-bitacora"
        );
  
      if (tarjetaBitacora) {
        tarjetaBitacora.hidden =
          rol !== "ADMINISTRADOR";
      }
  
      sessionStorage.setItem(
        "usuario",
        JSON.stringify(usuario)
      );
  
      window.PANEL.usuario = usuario;
      window.PANEL.rol = rol;
    }
  
    function badgeEstadoVuelo(estado) {
      const valor =
        String(estado || "").toUpperCase();
  
      const clases = {
        PROGRAMADO: "badge-info",
        DISPONIBLE: "badge-success",
        CERRADO: "badge-neutral",
        CANCELADO: "badge-danger",
      };
  
      return `
        <span class="badge-pill ${clases[valor] || "badge-neutral"}">
          ${API.escapeHtml(valor || "—")}
        </span>
      `;
    }
  
    function badgeResultado(resultado) {
      const valor =
        String(resultado || "").toUpperCase();
  
      if (!valor) {
        return "";
      }
  
      const clases = {
        EXITO: "badge-success",
        "ÉXITO": "badge-success",
        ERROR: "badge-danger",
        DENEGADO: "badge-warning",
      };
  
      return `
        <span class="badge-pill ${clases[valor] || "badge-neutral"} ms-2">
          ${API.escapeHtml(valor)}
        </span>
      `;
    }
  
    window.PANEL = {
      usuario,
      rol,
      iniciales,
      fechaCorta,
      listaDe,
      extraerTotal,
      aplicarUsuario,
      actualizarContadorNotificaciones,
    };
  
    aplicarUsuario(usuario);
  
    document
      .getElementById("boton-logout")
      ?.addEventListener(
        "click",
        async () => {
          const refreshToken =
            sessionStorage.getItem(
              "refresh_token"
            );
  
          try {
            if (refreshToken) {
              await API.post(
                "/api/auth/logout/",
                {
                  refresh: refreshToken,
                }
              );
            }
          } catch (error) {
            /* El cierre local continúa aunque falle el endpoint. */
          }
  
          API.limpiarSesion();
          window.location.href = "/";
        }
      );
  
    async function actualizarPerfil() {
      try {
        const datos =
          await API.get(
            "/api/usuarios/perfil/"
          );
  
        aplicarUsuario(datos);
        return validarAccesoRequerido();
      } catch (error) {
        if (error.status === 401) {
          API.limpiarSesion();
          window.location.href = "/";
          return false;
        }

        return true;
      }
    }
  
    async function actualizarContadorNotificaciones() {
      try {
        const datos =
          await API.get(
            "/api/notificaciones/?leida=false"
          );
  
        const total =
          extraerTotal(datos);
  
        const contador =
          document.getElementById(
            "contador-notificaciones"
          );
  
        if (!contador) {
          return;
        }
  
        if (total > 0) {
          contador.hidden = false;
          contador.textContent =
            total > 99
              ? "99+"
              : String(total);
        } else {
          contador.hidden = true;
          contador.textContent = "0";
        }
      } catch (error) {
        /* El contador no bloquea la navegación. */
      }
    }
  
    async function cargarDashboard() {
      if (
        rol !== "ADMINISTRADOR" ||
        !document.getElementById(
          "tarjetas-kpi"
        )
      ) {
        return;
      }
  
      const peticiones = [
        rol === "ADMINISTRADOR"
          ? API.get("/api/usuarios/")
          : Promise.resolve(null),
  
        API.get(
          "/api/vuelos/?estado=DISPONIBLE"
        ),
  
        API.get(
          "/api/reservas/?estado=CONFIRMADA"
        ),
  
        API.get(
          "/api/reservas/?estado=PENDIENTE"
        ),
  
        API.get(
          "/api/notificaciones/?leida=false"
        ),
      ];
  
      const resultados =
        await Promise.allSettled(
          peticiones
        );
  
      const valor = (resultado) =>
        resultado.status === "fulfilled"
          ? resultado.value
          : null;
  
      setKpi(
        "usuarios",
        rol === "ADMINISTRADOR"
          ? extraerTotal(valor(resultados[0]))
          : "—"
      );
  
      setKpi(
        "vuelos_disponibles",
        resultados[1].status === "fulfilled"
          ? extraerTotal(
              valor(resultados[1])
            )
          : "—"
      );
  
      setKpi(
        "reservas_confirmadas",
        resultados[2].status === "fulfilled"
          ? extraerTotal(
              valor(resultados[2])
            )
          : "—"
      );
  
      setKpi(
        "reservas_pendientes",
        resultados[3].status === "fulfilled"
          ? extraerTotal(
              valor(resultados[3])
            )
          : "—"
      );
  
      setKpi(
        "notificaciones_pendientes",
        resultados[4].status === "fulfilled"
          ? extraerTotal(
              valor(resultados[4])
            )
          : "—"
      );
  
      setKpi(
        "ocupacion_pct",
        "—"
      );
  
      await cargarVuelosProximos();
  
      if (rol === "ADMINISTRADOR") {
        await cargarBitacoraReciente();
      }
    }
  
    async function cargarVuelosProximos() {
      try {
        const datos =
          await API.get(
            "/api/vuelos/"
          );
  
        renderVuelosProximos(
          listaDe(datos).slice(0, 6)
        );
      } catch (error) {
        renderVuelosProximos([]);
      }
    }
  
    function renderVuelosProximos(items) {
      const tbody =
        document.querySelector(
          "#tabla-vuelos-proximos tbody"
        );
  
      if (!tbody) {
        return;
      }
  
      if (!items.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6">
              <div class="empty-state py-4">
                <div class="empty-icon">
                  <i class="bi bi-send"></i>
                </div>
                <h3>Sin vuelos próximos</h3>
                <p>
                  Cuando se programen vuelos aparecerán en esta lista.
                </p>
              </div>
            </td>
          </tr>
        `;
  
        return;
      }
  
      tbody.innerHTML =
        items
          .map((vuelo) => {
            const origen =
              vuelo.origen?.codigo ||
              vuelo.origen ||
              vuelo.ruta?.origen?.codigo ||
              vuelo.ruta?.origen ||
              "—";
  
            const destino =
              vuelo.destino?.codigo ||
              vuelo.destino ||
              vuelo.ruta?.destino?.codigo ||
              vuelo.ruta?.destino ||
              "—";
  
            const aeronave =
              vuelo.aeronave?.codigo ||
              vuelo.aeronave?.modelo ||
              vuelo.aeronave ||
              "—";
  
            return `
              <tr>
                <td class="mono">
                  ${API.escapeHtml(
                    vuelo.codigo ||
                    vuelo.codigo_vuelo ||
                    "—"
                  )}
                </td>
  
                <td>
                  ${API.escapeHtml(
                    `${origen} → ${destino}`
                  )}
                </td>
  
                <td>
                  ${API.escapeHtml(
                    aeronave
                  )}
                </td>
  
                <td class="mono">
                  ${fechaCorta(
                    vuelo.fecha_salida ||
                    vuelo.salida ||
                    vuelo.departure_at
                  )}
                </td>
  
                <td>
                  ${badgeEstadoVuelo(
                    vuelo.estado
                  )}
                </td>
  
                <td class="text-end mono">
                  ${API.escapeHtml(
                    vuelo.asientos_disponibles ??
                    vuelo.seats_available ??
                    "—"
                  )}
                </td>
              </tr>
            `;
          })
          .join("");
    }
  
    async function cargarBitacoraReciente() {
      try {
        const datos =
          await API.get(
            "/api/bitacora/"
          );
  
        renderBitacoraReciente(
          listaDe(datos).slice(0, 6)
        );
      } catch (error) {
        renderBitacoraReciente([]);
      }
    }
  
    function renderBitacoraReciente(items) {
      const lista =
        document.getElementById(
          "lista-bitacora-reciente"
        );
  
      if (!lista) {
        return;
      }
  
      if (!items.length) {
        lista.innerHTML = `
          <li class="p-3 empty-state">
            <div class="empty-icon">
              <i class="bi bi-clock-history"></i>
            </div>
  
            <p class="mb-0">
              Aún no hay actividad registrada.
            </p>
          </li>
        `;
  
        return;
      }
  
      lista.innerHTML =
        items
          .map((evento) => {
            const metodo =
              evento.metodo_http ||
              "—";
  
            return `
              <li class="p-3 border-top">
                <div class="d-flex justify-content-between gap-2 small">
                  <strong>
                    ${API.escapeHtml(
                      evento.usuario_email ||
                      evento.usuario?.email ||
                      "Sistema"
                    )}
                  </strong>
  
                  <span class="text-subtle mono">
                    ${fechaCorta(
                      evento.creado_en
                    )}
                  </span>
                </div>
  
                <div class="small text-muted-2 mt-1">
                  <span class="method-badge m-${API.escapeHtml(metodo)}">
                    ${API.escapeHtml(metodo)}
                  </span>
  
                  ${API.escapeHtml(
                    evento.accion || ""
                  )}
  
                  ·
  
                  ${API.escapeHtml(
                    evento.entidad || ""
                  )}
  
                  ${badgeResultado(
                    evento.resultado
                  )}
                </div>
              </li>
            `;
          })
          .join("");
    }
  
    actualizarPerfil()
      .then((tieneAcceso) => {
        if (!tieneAcceso) {
          return;
        }

        actualizarContadorNotificaciones();
        cargarDashboard();
      });
  
    window.setInterval(
      actualizarContadorNotificaciones,
      60000
    );
  })();