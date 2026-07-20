/* app/static/js/bitacora.js
 * Consulta, filtros y detalle de bitácora.
 */

(function () {
    "use strict";
  
    const $tbody =
      $("#bit-tbody");
  
    const modalElemento =
      document.getElementById(
        "modalBitacora"
      );
  
    if (!modalElemento) {
      return;
    }
  
    const modal =
      new bootstrap.Modal(
        modalElemento
      );
  
    const $detalle =
      $("#bit-detalle-body");
  
    let pagina = 1;
    const pageSize = 15;
    let total = 0;
  
    function filaSkeleton(cantidad) {
      return Array.from(
        { length: cantidad },
        () => `
          <tr>
            <td colspan="9">
              <span
                class="skeleton skeleton-line"
                style="width:100%; height:14px;"
              ></span>
            </td>
          </tr>
        `
      ).join("");
    }
  
    function badgeResultado(resultado) {
      const valor =
        String(resultado || "")
          .toUpperCase();
  
      const clases = {
        EXITO: "badge-success",
        "ÉXITO": "badge-success",
        ERROR: "badge-danger",
        DENEGADO: "badge-warning",
      };
  
      return `
        <span class="badge-pill ${clases[valor] || "badge-neutral"}">
          ${API.escapeHtml(valor || "—")}
        </span>
      `;
    }
  
    function render(items) {
      if (!items.length) {
        $tbody.html(`
          <tr>
            <td colspan="9">
              <div class="empty-state">
                <div class="empty-icon">
                  <i class="bi bi-clock-history"></i>
                </div>
  
                <h3>
                  Sin eventos registrados
                </h3>
  
                <p>
                  Ajusta los filtros o vuelve más tarde.
                </p>
              </div>
            </td>
          </tr>
        `);
  
        return;
      }
  
      $tbody.html(
        items
          .map((evento) => {
            const metodo =
              evento.metodo_http ||
              "—";
  
            const usuario =
              evento.usuario_email ||
              evento.usuario?.email ||
              "Sistema";
  
            return `
              <tr data-id="${API.escapeHtml(evento.id)}">
                <td class="mono">
                  ${PANEL.fechaCorta(
                    evento.creado_en
                  )}
                </td>
  
                <td>
                  ${API.escapeHtml(usuario)}
                </td>
  
                <td>
                  ${API.escapeHtml(
                    evento.accion || "—"
                  )}
                </td>
  
                <td>
                  ${API.escapeHtml(
                    evento.entidad || "—"
                  )}
                </td>
  
                <td>
                  ${badgeResultado(
                    evento.resultado
                  )}
                </td>
  
                <td>
                  <span class="method-badge m-${API.escapeHtml(metodo)}">
                    ${API.escapeHtml(metodo)}
                  </span>
                </td>
  
                <td
                  class="mono text-truncate"
                  style="max-width:240px;"
                  title="${API.escapeHtml(evento.endpoint || "")}"
                >
                  ${API.escapeHtml(
                    evento.endpoint || "—"
                  )}
                </td>
  
                <td class="mono">
                  ${API.escapeHtml(
                    evento.direccion_ip || "—"
                  )}
                </td>
  
                <td class="text-end">
                  <button
                    type="button"
                    class="icon-btn"
                    data-detalle
                    title="Ver detalle"
                    aria-label="Ver detalle"
                  >
                    <i class="bi bi-arrow-up-right-square"></i>
                  </button>
                </td>
              </tr>
            `;
          })
          .join("")
      );
    }
  
    function actualizarPaginacion(
      items,
      datos
    ) {
      total =
        PANEL.extraerTotal(datos);
  
      if (Array.isArray(datos)) {
        total = datos.length;
      }
  
      const totalPaginas =
        Math.max(
          1,
          Math.ceil(total / pageSize)
        );
  
      $("#bit-contador").text(
        total
          ? `Página ${pagina} de ${totalPaginas} · ${total} eventos`
          : "Sin resultados"
      );
  
      $("#bit-prev").prop(
        "disabled",
        pagina <= 1
      );
  
      $("#bit-next").prop(
        "disabled",
        pagina >= totalPaginas
      );
  
      render(items);
    }
  
    async function cargar() {
      $tbody.html(
        filaSkeleton(8)
      );
  
      const parametros =
        new URLSearchParams();
  
      const buscar =
        $("#bit-buscar")
          .val()
          .trim();
  
      const usuario =
        $("#bit-usuario")
          .val()
          .trim();
  
      const accion =
        $("#bit-accion")
          .val()
          .trim();
  
      const entidad =
        $("#bit-entidad")
          .val()
          .trim();
  
      const resultado =
        $("#bit-resultado").val();
  
      const metodo =
        $("#bit-metodo").val();
  
      const fechaDesde =
        $("#bit-desde").val();
  
      const fechaHasta =
        $("#bit-hasta").val();
  
      if (buscar) {
        parametros.set(
          "buscar",
          buscar
        );
      }
  
      if (usuario) {
        parametros.set(
          "usuario",
          usuario
        );
      }
  
      if (accion) {
        parametros.set(
          "accion",
          accion
        );
      }
  
      if (entidad) {
        parametros.set(
          "entidad",
          entidad
        );
      }
  
      if (resultado) {
        parametros.set(
          "resultado",
          resultado
        );
      }
  
      if (metodo) {
        parametros.set(
          "metodo",
          metodo
        );
      }
  
      if (fechaDesde) {
        parametros.set(
          "fecha_desde",
          fechaDesde
        );
      }
  
      if (fechaHasta) {
        parametros.set(
          "fecha_hasta",
          fechaHasta
        );
      }
  
      try {
        const datos =
          await API.get(
            "/api/bitacora/?" +
            parametros.toString()
          );
  
        const lista =
          PANEL.listaDe(datos);
  
        if (Array.isArray(datos)) {
          const inicio =
            (pagina - 1) * pageSize;
  
          actualizarPaginacion(
            lista.slice(
              inicio,
              inicio + pageSize
            ),
            datos
          );
        } else {
          actualizarPaginacion(
            lista,
            datos
          );
        }
      } catch (error) {
        $tbody.html(`
          <tr>
            <td colspan="9">
              <div class="alert alert-danger m-3">
                ${API.escapeHtml(
                  error.mensaje ||
                  "No se pudo cargar la bitácora."
                )}
              </div>
            </td>
          </tr>
        `);
      }
    }
  
    function renderDetalle(evento) {
      const usuario =
        evento.usuario_email ||
        evento.usuario?.email ||
        "Sistema";
  
      const filas = [
        [
          "Fecha",
          PANEL.fechaCorta(
            evento.creado_en
          ),
        ],
        [
          "Usuario",
          usuario,
        ],
        [
          "Acción",
          evento.accion || "—",
        ],
        [
          "Entidad",
          evento.entidad || "—",
        ],
        [
          "Identificador",
          evento.entidad_id || "—",
        ],
        [
          "Resultado",
          evento.resultado || "—",
        ],
        [
          "Método",
          evento.metodo_http || "—",
        ],
        [
          "Endpoint",
          evento.endpoint || "—",
        ],
        [
          "Dirección IP",
          evento.direccion_ip || "—",
        ],
      ];
  
      return `
        <dl class="row small mb-3">
          ${filas
            .map(
              ([titulo, valor]) => `
                <dt class="col-sm-3 text-subtle fw-normal">
                  ${API.escapeHtml(titulo)}
                </dt>
  
                <dd class="col-sm-9 mono">
                  ${API.escapeHtml(String(valor))}
                </dd>
              `
            )
            .join("")}
        </dl>
  
        <div>
          <div class="text-subtle small mb-1">
            Detalle
          </div>
  
          <div
            class="mono p-3 rounded"
            style="
              background:var(--color-surface-alt);
              font-size:0.8rem;
              white-space:pre-wrap;
              overflow-wrap:anywhere;
            "
          >
            ${API.escapeHtml(
              evento.detalle ||
              "Sin información adicional."
            )}
          </div>
        </div>
      `;
    }
  
    let temporizador;
  
    $(
      "#bit-buscar, #bit-usuario, #bit-accion, #bit-entidad"
    ).on(
      "input",
      () => {
        window.clearTimeout(
          temporizador
        );
  
        temporizador =
          window.setTimeout(
            () => {
              pagina = 1;
              cargar();
            },
            350
          );
      }
    );
  
    $(
      "#bit-resultado, #bit-metodo, #bit-desde, #bit-hasta"
    ).on(
      "change",
      () => {
        pagina = 1;
        cargar();
      }
    );
  
    $("#bit-refrescar").on(
      "click",
      async function () {
        const $boton =
          $(this);
  
        $boton.prop(
          "disabled",
          true
        );
  
        $boton
          .find(".spinner")
          .prop("hidden", false);
  
        try {
          await cargar();
        } finally {
          $boton.prop(
            "disabled",
            false
          );
  
          $boton
            .find(".spinner")
            .prop("hidden", true);
        }
      }
    );
  
    $("#bit-prev").on(
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
  
    $("#bit-next").on(
      "click",
      () => {
        pagina += 1;
        cargar();
      }
    );
  
    $tbody.on(
      "click",
      "[data-detalle]",
      async function () {
        const id =
          $(this)
            .closest("tr")
            .data("id");
  
        $detalle.html(`
          <div class="text-center text-subtle py-4">
            <span
              class="spinner-border spinner-border-sm"
              role="status"
            ></span>
  
            <span class="ms-2">
              Cargando…
            </span>
          </div>
        `);
  
        modal.show();
  
        try {
          const evento =
            await API.get(
              `/api/bitacora/${id}/`
            );
  
          $detalle.html(
            renderDetalle(evento)
          );
        } catch (error) {
          $detalle.html(`
            <div class="alert alert-danger">
              ${API.escapeHtml(
                error.mensaje ||
                "No se pudo cargar el detalle."
              )}
            </div>
          `);
        }
      }
    );
  
    cargar();
  })();