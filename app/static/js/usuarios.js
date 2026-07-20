/* app/static/js/usuarios.js
 * Gestión de usuarios: listar, filtrar, crear, editar y cambiar estado.
 */

(function () {
  "use strict";

  const $tbody = $("#usr-tbody");
  const $contador = $("#usr-contador");

  const modalElemento =
    document.getElementById(
      "modalUsuario"
    );

  const modalConfirmacionElemento =
    document.getElementById(
      "modalConfirmarEstado"
    );

  if (
    !modalElemento ||
    !modalConfirmacionElemento
  ) {
    return;
  }

  const modal =
    new bootstrap.Modal(
      modalElemento
    );

  const modalConfirmacion =
    new bootstrap.Modal(
      modalConfirmacionElemento
    );

  const formulario =
    document.getElementById(
      "form-usuario"
    );

  const errorFormulario =
    document.getElementById(
      "form-usuario-error"
    );

  let pagina = 1;
  const pageSize = 10;
  let total = 0;
  let datosActuales = [];

  function redirigirAccesoDenegado() {
    window.location.replace(
      "/acceso-denegado/"
    );
  }

  function obtenerRol(usuario) {
    if (!usuario?.rol) {
      return "";
    }

    if (typeof usuario.rol === "string") {
      return usuario.rol.toUpperCase();
    }

    return String(
      usuario.rol.nombre ||
      usuario.rol.name ||
      ""
    ).toUpperCase();
  }

  async function verificarAcceso() {
    try {
      const usuario = await API.get(
        "/api/usuarios/perfil/"
      );

      if (obtenerRol(usuario) !== "ADMINISTRADOR") {
        redirigirAccesoDenegado();
        return false;
      }

      return true;
    } catch (error) {
      if (error.status === 403) {
        redirigirAccesoDenegado();
        return false;
      }

      return true;
    }
  }

  function mostrarErrorFormulario(mensaje) {
    const span =
      errorFormulario?.querySelector(
        "[data-msg]"
      );

    if (span) {
      span.textContent = mensaje;
    } else if (errorFormulario) {
      errorFormulario.textContent =
        mensaje;
    }

    if (errorFormulario) {
      errorFormulario.hidden = false;
    }
  }

  function ocultarErrorFormulario() {
    if (!errorFormulario) {
      return;
    }

    errorFormulario.hidden = true;

    const span =
      errorFormulario.querySelector(
        "[data-msg]"
      );

    if (span) {
      span.textContent = "";
    }
  }

  function nombreRol(usuario) {
    if (
      typeof usuario.rol === "object"
    ) {
      return (
        usuario.rol?.nombre || ""
      ).toUpperCase();
    }

    return String(
      usuario.rol || ""
    ).toUpperCase();
  }

  function idRol(usuario) {
    if (
      typeof usuario.rol === "object"
    ) {
      return usuario.rol?.id || "";
    }

    return usuario.rol_id || "";
  }

  function usuarioActivo(usuario) {
    return usuario.is_active === true;
  }

  function badgeRol(usuario) {
    const rol =
      nombreRol(usuario);

    const clase =
      rol === "ADMINISTRADOR"
        ? "badge-role-admin"
        : "badge-role-cliente";

    return `
      <span class="badge-pill ${clase}">
        ${API.escapeHtml(rol || "—")}
      </span>
    `;
  }

  function badgeEstado(usuario) {
    const activo =
      usuarioActivo(usuario);

    return `
      <span class="badge-pill ${activo ? "badge-success" : "badge-neutral"}">
        ${activo ? "ACTIVO" : "INACTIVO"}
      </span>
    `;
  }

  function filaSkeleton(cantidad) {
    return Array.from(
      { length: cantidad },
      () => `
        <tr>
          ${`
            <td>
              <span
                class="skeleton skeleton-line"
                style="width:80%;"
              ></span>
            </td>
          `.repeat(7)}
        </tr>
      `
    ).join("");
  }

  function render(items) {
    if (!items.length) {
      $tbody.html(`
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <div class="empty-icon">
                <i class="bi bi-people"></i>
              </div>

              <h3>
                Sin usuarios que coincidan
              </h3>

              <p>
                Ajusta los filtros o crea un nuevo usuario.
              </p>
            </div>
          </td>
        </tr>
      `);

      return;
    }

    $tbody.html(
      items
        .map((usuario) => {
          const nombre =
            usuario.nombre_completo ||
            [
              usuario.first_name,
              usuario.last_name,
            ]
              .filter(Boolean)
              .join(" ")
              .trim() ||
            "—";

          const activo =
            usuarioActivo(usuario);

          return `
            <tr data-id="${API.escapeHtml(usuario.id)}">
              <td>
                <strong>
                  ${API.escapeHtml(nombre)}
                </strong>
              </td>

              <td>
                ${API.escapeHtml(usuario.email || "—")}
              </td>

              <td class="mono">
                ${API.escapeHtml(usuario.username || "—")}
              </td>

              <td>
                ${badgeRol(usuario)}
              </td>

              <td>
                ${badgeEstado(usuario)}
              </td>

              <td class="mono">
                ${PANEL.fechaCorta(
                  usuario.date_joined ||
                  usuario.creado_en
                )}
              </td>

              <td class="row-actions">
                <button
                  type="button"
                  class="icon-btn"
                  data-accion="editar"
                  title="Editar usuario"
                  aria-label="Editar usuario"
                >
                  <i class="bi bi-pencil"></i>
                </button>

                <button
                  type="button"
                  class="icon-btn ${activo ? "danger" : ""}"
                  data-accion="estado"
                  data-activo="${activo}"
                  title="${activo ? "Desactivar" : "Activar"}"
                  aria-label="${activo ? "Desactivar" : "Activar"} usuario"
                >
                  <i class="bi ${activo ? "bi-slash-circle" : "bi-check-circle"}"></i>
                </button>
              </td>
            </tr>
          `;
        })
        .join("")
    );
  }

  function actualizarPaginacion(items) {
    const totalPaginas =
      Math.max(
        1,
        Math.ceil(total / pageSize)
      );

    $contador.text(
      total
        ? `Página ${pagina} de ${totalPaginas} · ${total} usuarios`
        : "Sin resultados"
    );

    $("#usr-prev").prop(
      "disabled",
      pagina <= 1
    );

    $("#usr-next").prop(
      "disabled",
      pagina >= totalPaginas
    );

    render(items);
  }

  async function cargar() {
    $tbody.html(
      filaSkeleton(5)
    );

    const parametros =
      new URLSearchParams();

    const buscar =
      $("#usr-buscar")
        .val()
        .trim();

    const rol =
      $("#usr-filtro-rol").val();

    const estado =
      $("#usr-filtro-estado").val();

    if (buscar) {
      parametros.set(
        "buscar",
        buscar
      );
    }

    if (rol) {
      parametros.set(
        "rol",
        rol
      );
    }

    if (estado) {
      parametros.set(
        "estado",
        estado
      );
    }

    try {
      const datos =
        await API.get(
          "/api/usuarios/?" +
          parametros.toString()
        );

      const lista =
        PANEL.listaDe(datos);

      total =
        PANEL.extraerTotal(datos);

      if (Array.isArray(datos)) {
        datosActuales = lista;

        const inicio =
          (pagina - 1) * pageSize;

        const itemsPagina =
          lista.slice(
            inicio,
            inicio + pageSize
          );

        total = lista.length;
        actualizarPaginacion(
          itemsPagina
        );
      } else {
        datosActuales = lista;
        actualizarPaginacion(
          lista
        );
      }
    } catch (error) {
      if (error.status === 403) {
        redirigirAccesoDenegado();
        return;
      }

      $tbody.html(`
        <tr>
          <td colspan="7">
            <div class="alert alert-danger m-3">
              ${API.escapeHtml(
                error.mensaje ||
                "No se pudieron cargar los usuarios."
              )}
            </div>
          </td>
        </tr>
      `);
    }
  }

  function prepararCrear() {
    formulario.reset();

    formulario
      .querySelector(
        '[name="id"]'
      )
      .value = "";

    modalElemento
      .querySelector(
        ".modal-title"
      )
      .textContent =
        "Crear usuario";

    modalElemento
      .querySelectorAll(
        "[data-solo-crear]"
      )
      .forEach((elemento) => {
        elemento.hidden = false;
      });

    const password =
      formulario.querySelector(
        '[name="password"]'
      );

    if (password) {
      password.required = true;
    }

    ocultarErrorFormulario();

    formulario
      .querySelectorAll(
        "[data-error]"
      )
      .forEach((elemento) => {
        elemento.hidden = true;
        elemento.textContent = "";
      });
  }

  async function abrirEditar(id) {
    prepararCrear();

    modalElemento
      .querySelector(
        ".modal-title"
      )
      .textContent =
        "Editar usuario";

    modalElemento
      .querySelectorAll(
        "[data-solo-crear]"
      )
      .forEach((elemento) => {
        elemento.hidden = true;
      });

    const password =
      formulario.querySelector(
        '[name="password"]'
      );

    if (password) {
      password.required = false;
    }

    modal.show();

    try {
      const usuario =
        await API.get(
          `/api/usuarios/${id}/`
        );

      formulario
        .querySelector(
          '[name="id"]'
        )
        .value = usuario.id;

      formulario.elements.first_name.value =
        usuario.first_name || "";

      formulario.elements.last_name.value =
        usuario.last_name || "";

      formulario.elements.email.value =
        usuario.email || "";

      formulario.elements.username.value =
        usuario.username || "";

      formulario.elements.rol_id.value =
        idRol(usuario);
    } catch (error) {
      mostrarErrorFormulario(
        error.mensaje ||
        "No se pudo cargar el usuario."
      );
    }
  }

  $("#boton-crear-usuario").on(
    "click",
    prepararCrear
  );

  $tbody.on(
    "click",
    "[data-accion]",
    function () {
      const fila =
        $(this).closest("tr");

      const id =
        fila.data("id");

      const accion =
        $(this).data("accion");

      if (accion === "editar") {
        abrirEditar(id);
      }

      if (accion === "estado") {
        confirmarCambioEstado(
          id,
          $(this).data("activo") === true ||
          $(this).attr("data-activo") === "true"
        );
      }
    }
  );

  formulario.addEventListener(
    "submit",
    async (evento) => {
      evento.preventDefault();

      ocultarErrorFormulario();

      const id =
        formulario
          .querySelector(
            '[name="id"]'
          )
          .value;

      const cuerpo = {
        first_name:
          formulario.elements.first_name
            .value
            .trim(),

        last_name:
          formulario.elements.last_name
            .value
            .trim(),

        email:
          formulario.elements.email
            .value
            .trim(),

        username:
          formulario.elements.username
            .value
            .trim(),

        rol_id:
          Number(
            formulario.elements.rol_id
              .value
          ),
      };

      if (!id) {
        cuerpo.password =
          formulario.elements.password
            .value;
      }

      const $boton =
        $("#form-usuario-guardar");

      $boton.prop(
        "disabled",
        true
      );

      $boton
        .find(".spinner")
        .prop("hidden", false);

      $boton
        .find("[data-label]")
        .text("Guardando…");

      try {
        if (id) {
          await API.patch(
            `/api/usuarios/${id}/`,
            cuerpo
          );
        } else {
          await API.post(
            "/api/usuarios/",
            cuerpo
          );
        }

        modal.hide();
        pagina = 1;
        await cargar();
      } catch (error) {
        mostrarErrorFormulario(
          error.mensaje ||
          "No se pudo guardar el usuario."
        );
      } finally {
        $boton.prop(
          "disabled",
          false
        );

        $boton
          .find(".spinner")
          .prop("hidden", true);

        $boton
          .find("[data-label]")
          .text("Guardar");
      }
    }
  );

  function confirmarCambioEstado(
    id,
    activo
  ) {
    document.getElementById(
      "confirmar-estado-msg"
    ).textContent =
      activo
        ? "¿Desea desactivar esta cuenta? El usuario no podrá iniciar sesión."
        : "¿Desea activar nuevamente esta cuenta?";

    modalConfirmacion.show();

    const $boton =
      $("#confirmar-estado-ok");

    $boton
      .off("click")
      .on(
        "click",
        async () => {
          $boton.prop(
            "disabled",
            true
          );

          $boton
            .find(".spinner")
            .prop("hidden", false);

          $boton
            .find("[data-label]")
            .text("Actualizando…");

          try {
            await API.patch(
              `/api/usuarios/${id}/estado/`,
              {
                activo: !activo,
              }
            );

            modalConfirmacion.hide();
            await cargar();
          } catch (error) {
            API.mostrarError(
              error.mensaje ||
              "No se pudo actualizar el estado."
            );
          } finally {
            $boton.prop(
              "disabled",
              false
            );

            $boton
              .find(".spinner")
              .prop("hidden", true);

            $boton
              .find("[data-label]")
              .text("Confirmar");
          }
        }
      );
  }

  let temporizadorBusqueda;

  $("#usr-buscar").on(
    "input",
    () => {
      window.clearTimeout(
        temporizadorBusqueda
      );

      temporizadorBusqueda =
        window.setTimeout(
          () => {
            pagina = 1;
            cargar();
          },
          300
        );
    }
  );

  $(
    "#usr-filtro-rol, #usr-filtro-estado"
  ).on(
    "change",
    () => {
      pagina = 1;
      cargar();
    }
  );

  $("#usr-refrescar").on(
    "click",
    () => cargar()
  );

  $("#usr-prev").on(
    "click",
    () => {
      pagina =
        Math.max(
          1,
          pagina - 1
        );

      cargar();
    }
  );

  $("#usr-next").on(
    "click",
    () => {
      pagina += 1;
      cargar();
    }
  );

  if (
    new URLSearchParams(
      window.location.search
    ).get("crear") === "1"
  ) {
    prepararCrear();
    modal.show();
  }

  verificarAcceso().then((tieneAcceso) => {
    if (tieneAcceso) {
      cargar();
    }
  });
})();