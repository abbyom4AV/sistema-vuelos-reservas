document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const estado = document.querySelector("#estado-reservas-admin");
  const resumen = document.querySelector("#resumen-reservas");
  const tabla = document.querySelector("#tabla-reservas-admin");
  const contador = document.querySelector("#contador-filtrado");
  const busqueda = document.querySelector("#filtro-busqueda");
  const filtroReserva = document.querySelector("#filtro-reserva");
  const filtroPago = document.querySelector("#filtro-pago");

  let reservas = [];

  const listaDe = (respuesta) => {
    if (Array.isArray(respuesta)) return respuesta;
    if (Array.isArray(respuesta?.data)) return respuesta.data;
    if (Array.isArray(respuesta?.results)) return respuesta.results;
    return [];
  };

  const textoEstado = (estado) =>
    String(estado || "SIN_PAGO")
      .toLowerCase()
      .replaceAll("_", " ")
      .replace(/^\w/, (letra) => letra.toUpperCase());

  const claseEstado = (estado) => {
    const clases = {
      CONFIRMADA: "success",
      CANCELADA: "danger",
      PENDIENTE_PAGO: "warning",
      APROBADO: "success",
      RECHAZADO: "danger",
      PENDIENTE: "warning",
      PENDIENTE_VERIFICACION: "info",
      SIN_PAGO: "secondary",
    };

    return clases[estado] || "secondary";
  };

  const rutaDe = (reserva) => {
    const ruta = reserva.vuelo_detalle?.ruta;
    return ruta ? `${ruta.origen} → ${ruta.destino}` : "—";
  };

  const pagoDe = (reserva) => reserva.pago_detalle?.estado || "SIN_PAGO";

  const actualizarResumen = () => {
    const pendientes = reservas.filter(
      (reserva) =>
        reserva.estado !== "CANCELADA" &&
        ["SIN_PAGO", "PENDIENTE", "PENDIENTE_VERIFICACION"].includes(
          pagoDe(reserva),
        ),
    ).length;

    document.querySelector("#total-reservas").textContent = reservas.length;
    document.querySelector("#reservas-pendientes").textContent = pendientes;
    document.querySelector("#pagos-aprobados").textContent = reservas.filter(
      (reserva) => pagoDe(reserva) === "APROBADO",
    ).length;
    document.querySelector("#reservas-canceladas").textContent = reservas.filter(
      (reserva) => reserva.estado === "CANCELADA",
    ).length;
  };

  const renderizar = () => {
    const termino = busqueda.value.trim().toLowerCase();
    const estadoReserva = filtroReserva.value;
    const estadoPago = filtroPago.value;

    const filtradas = reservas.filter((reserva) => {
      const usuario = reserva.usuario_detalle || {};
      const contenido = [
        reserva.id,
        reserva.codigo,
        usuario.nombre,
        usuario.email,
        rutaDe(reserva),
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!termino || contenido.includes(termino)) &&
        (!estadoReserva || reserva.estado === estadoReserva) &&
        (!estadoPago || pagoDe(reserva) === estadoPago)
      );
    });

    contador.textContent = `${filtradas.length} de ${reservas.length} reservas`;

    if (!filtradas.length) {
      tabla.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted py-4">
            No hay reservas que coincidan con los filtros.
          </td>
        </tr>
      `;
      return;
    }

    tabla.innerHTML = filtradas
      .map((reserva) => {
        const usuario = reserva.usuario_detalle || {};
        const vuelo = reserva.vuelo_detalle || {};
        const asiento = reserva.asiento_detalle || {};
        const pago = reserva.pago_detalle;
        const estadoPagoActual = pagoDe(reserva);
        const monto = pago?.monto || vuelo.precio_base || "—";

        return `
          <tr>
            <td>
              <strong>#${API.escapeHtml(reserva.codigo || reserva.id)}</strong>
              <div class="small text-muted">${API.escapeHtml(reserva.creado_en || "")}</div>
            </td>
            <td>
              <strong>${API.escapeHtml(usuario.nombre || "—")}</strong>
              <div class="small text-muted">${API.escapeHtml(usuario.email || "—")}</div>
            </td>
            <td>
              ${API.escapeHtml(rutaDe(reserva))}
              <div class="small text-muted">${API.escapeHtml(vuelo.fecha || "—")} · ${API.escapeHtml(vuelo.hora || "—")}</div>
            </td>
            <td>${API.escapeHtml(asiento.codigo || asiento.numero || "—")}</td>
            <td><span class="badge text-bg-${claseEstado(reserva.estado)}">${API.escapeHtml(textoEstado(reserva.estado))}</span></td>
            <td>
              <span class="badge text-bg-${claseEstado(estadoPagoActual)}">${API.escapeHtml(textoEstado(estadoPagoActual))}</span>
              ${pago?.metodo ? `<div class="small text-muted">${API.escapeHtml(pago.metodo)}</div>` : ""}
            </td>
            <td class="text-end">${API.escapeHtml(monto)}</td>
          </tr>
        `;
      })
      .join("");
  };

  const cargarReservas = async () => {
    try {
      reservas = listaDe(await API.get("/api/reservas/reservas/"));
      estado.hidden = true;
      resumen.hidden = false;
      actualizarResumen();
      renderizar();
    } catch (error) {
      estado.className = "alert alert-danger";
      estado.textContent =
        error.message || "No fue posible cargar las reservas del sistema.";
    }
  };

  [busqueda, filtroReserva, filtroPago].forEach((campo) =>
    campo.addEventListener("input", renderizar),
  );

  cargarReservas();
});
