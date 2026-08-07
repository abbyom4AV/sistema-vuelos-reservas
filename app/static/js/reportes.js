document.addEventListener("DOMContentLoaded", function () {
"use strict";

const estadoDashboard = document.querySelector("#estado-dashboard");
const contenedorDashboard = document.querySelector("#contenedor-dashboard");

async function cargarDashboard() {

  try {

    const data = await API.get(
      "/api/reportes/dashboard/"
    );

    if (estadoDashboard) {
      estadoDashboard.style.display = "none";
    }

    if (contenedorDashboard) {
      contenedorDashboard.style.display = "flex";
    }

    dibujarReservasPorEstado(
      data.reservas_por_estado || []
    );

    dibujarReservasPorRuta(
      data.reservas_por_ruta || []
    );

    dibujarOcupacionPorVuelo(
      data.ocupacion_por_vuelo || []
    );

  } catch (error) {

    console.error(
      "Error cargando dashboard:",
      error
    );

    if (estadoDashboard) {
      estadoDashboard.className = "alert alert-danger";
      estadoDashboard.textContent =
        error.message ||
        "No fue posible cargar las métricas del dashboard.";
    }
  }
}

function dibujarReservasPorEstado(items) {

  const canvas = document.querySelector("#grafico-estado");

  if (!canvas) return;

  const etiquetas = items.map(
    function (item) {
      return item.estado;
    }
  );

  const valores = items.map(
    function (item) {
      return item.total;
    }
  );

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: etiquetas,
      datasets: [
        {
          data: valores,
          backgroundColor: [
            "#dc3545",
            "#198754",
            "#ffc107",
            "#0d6efd",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

function dibujarReservasPorRuta(items) {

  const canvas = document.querySelector("#grafico-ruta");

  if (!canvas) return;

  const etiquetas = items.map(
    function (item) {
      return (
        (item.vuelo__ruta__origen || "—") +
        " → " +
        (item.vuelo__ruta__destino || "—")
      );
    }
  );

  const valores = items.map(
    function (item) {
      return item.total;
    }
  );

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: etiquetas,
      datasets: [
        {
          label: "Reservas",
          data: valores,
          backgroundColor: "#163b36",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
    },
  });
}

function dibujarOcupacionPorVuelo(items) {

  const canvas = document.querySelector("#grafico-ocupacion");

  if (!canvas) return;

  const etiquetas = items.map(
    function (item) {
      return (
        "Vuelo " + item.vuelo_id + " · " + item.ruta
      );
    }
  );

  const ocupados = items.map(
    function (item) {
      return item.ocupados;
    }
  );

  const disponibles = items.map(
    function (item) {
      return item.disponibles;
    }
  );

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: etiquetas,
      datasets: [
        {
          label: "Ocupados",
          data: ocupados,
          backgroundColor: "#c49a3a",
        },
        {
          label: "Disponibles",
          data: disponibles,
          backgroundColor: "#d1e7dd",
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          stacked: true,
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
    },
  });
}

cargarDashboard();

});