/* app/static/js/notificaciones.js
 * Listar, filtrar y marcar notificaciones como leídas.
 */

(function () {
    "use strict";
  
    const $lista =
      $("#notif-lista");
  
    const iconos = {
      SEGURIDAD: "bi-shield-lock",
      RESERVA: "bi-journal-check",
      PAGO: "bi-credit-card",
      VUELO: "bi-send",
      SISTEMA: "bi-gear",
    };
  
    function mostrarMensaje(
      selector,
      mensaje
    ) {
      const elemento =
        document.querySelector(
          selector
        );
  
      if (!elemento) {
        return;
      }
  
      const span =
        elemento.querySelector(
          "[data-msg]"
        );
  
      if (span) {
        span.textContent = mensaje;
      } else {
        elemento.textContent = mensaje;
      }
  
      elemento.hidden = false;
  
      window.setTimeout(
        () => {
          elemento.hidden = true;
        },
        3500
      );
    }
  
    function ocultarMensajes() {
      $("#notif-mensaje-error")
        .prop("hidden", true);
  
      $("#notif-mensaje-exito")
        .prop("hidden", true);
    }
  
    function mostrarSkeleton() {
      $lista.html(`
        <div class="p-3">
          <div
            class="skeleton skeleton-line"
            style="width:100%; height:48px;"
          ></div>
  
          <div
            class="skeleton skeleton-line mt-2"
            style="width:100%; height:48px;"
          ></div>
  
          <div
            class="skeleton skeleton-line mt-2"
            style="width:100%; height:48px;"
          ></div>
        </div>
      `);
    }
  
    async function cargar() {
      ocultarMensajes();
      mostrarSkeleton();
  
      const parametros =
        new URLSearchParams();
  
      const tipo =
        $("#notif-tipo").val();
  
      const leida =
        $("#notif-estado").val();
  
      if (tipo) {
        parametros.set(
          "tipo",
          tipo
        );
      }
  
      if (leida !== "") {
        parametros.set(
          "leida",
          leida
        );
      }
  
      try {
        const datos =
          await API.get(
            "/api/notificaciones/?" +
            parametros.toString()
          );
  
        render(
          PANEL.listaDe(datos)
        );
  
        PANEL
          .actualizarContadorNotificaciones
          ?.();
      } catch (error) {
        $lista.html(`
          <div class="alert alert-danger m-3">
            ${API.escapeHtml(
              error.mensaje ||
              "No se pudieron cargar las notificaciones."
            )}
          </div>
        `);
      }
    }
  
    function render(items) {
      if (!items.length) {
        $lista.html(`
          <div class="empty-state">
            <div class="empty-icon">
              <i class="bi bi-bell-slash"></i>
            </div>
  
            <h3>
              Sin notificaciones
            </h3>
  
            <p>
              Cuando el sistema genere eventos para tu cuenta aparecerán aquí.
            </p>
          </div>
        `);
  
        return;
      }
  
      $lista.html(
        items
          .map((notificacion) => {
            const tipo =
              String(
                notificacion.tipo ||
                "SISTEMA"
              ).toUpperCase();
  
            const noLeida =
              notificacion.leida === false;
  
            return `
              <div
                class="notif-item ${noLeida ? "unread" : ""}"
                data-id="${API.escapeHtml(notificacion.id)}"
              >
                <div class="notif-icon notif-tipo-${API.escapeHtml(tipo)}">
                  <i class="bi ${iconos[tipo] || "bi-info-circle"}"></i>
                </div>
  
                <div class="notif-body">
                  <div class="notif-title">
                    ${API.escapeHtml(
                      notificacion.titulo ||
                      "Notificación"
                    )}
                  </div>
  
                  <div class="notif-msg">
                    ${API.escapeHtml(
                      notificacion.mensaje ||
                      ""
                    )}
                  </div>
  
                  <div class="notif-meta">
                    <span class="badge-pill badge-neutral">
                      ${API.escapeHtml(tipo)}
                    </span>
  
                    <span class="mono">
                      ${PANEL.fechaCorta(
                        notificacion.creado_en
                      )}
                    </span>
  
                    ${
                      noLeida
                        ? `
                          <button
                            type="button"
                            class="btn btn-ghost btn-sm ms-auto"
                            data-marcar
                          >
                            Marcar como leída
                          </button>
                        `
                        : ""
                    }
                  </div>
                </div>
  
                ${
                  noLeida
                    ? `
                      <span
                        class="notif-unread-dot"
                        aria-hidden="true"
                      ></span>
                    `
                    : ""
                }
              </div>
            `;
          })
          .join("")
      );
    }
  
    $("#notif-tipo, #notif-estado").on(
      "change",
      cargar
    );
  
    $("#notif-refrescar").on(
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
  
    $lista.on(
      "click",
      "[data-marcar]",
      async function () {
        const $boton =
          $(this);
  
        const $item =
          $boton.closest(
            ".notif-item"
          );
  
        const id =
          $item.data("id");
  
        $boton.prop(
          "disabled",
          true
        );
  
        try {
          await API.patch(
            `/api/notificaciones/${id}/leida/`,
            {}
          );
  
          $item.removeClass(
            "unread"
          );
  
          $item
            .find(
              ".notif-unread-dot"
            )
            .remove();
  
          $boton.remove();
  
          PANEL
            .actualizarContadorNotificaciones
            ?.();
        } catch (error) {
          $boton.prop(
            "disabled",
            false
          );
  
          mostrarMensaje(
            "#notif-mensaje-error",
            error.mensaje ||
            "No se pudo marcar la notificación como leída."
          );
        }
      }
    );
  
    $("#notif-marcar-todas").on(
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
  
        $boton
          .find("[data-label]")
          .text("Actualizando…");
  
        try {
          await API.patch(
            "/api/notificaciones/marcar-todas-leidas/",
            {}
          );
  
          mostrarMensaje(
            "#notif-mensaje-exito",
            "Todas las notificaciones fueron marcadas como leídas."
          );
  
          await cargar();
        } catch (error) {
          mostrarMensaje(
            "#notif-mensaje-error",
            error.mensaje ||
            "No se pudieron actualizar las notificaciones."
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
            .text(
              "Marcar todas como leídas"
            );
        }
      }
    );
  
    cargar();
  })();