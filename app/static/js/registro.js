(function () {
  "use strict";

  const form = document.getElementById("form-registro");
  const error = document.getElementById("mensaje-error");
  const success = document.getElementById("mensaje-exito");
  const button = document.getElementById("boton-registro");

  if (!form) return;

  function message(element, text) {
    element.querySelector("[data-msg]").textContent = text;
    element.hidden = false;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.hidden = true;
    success.hidden = true;

    const password = document.getElementById("registro-password").value;
    const confirmation = document.getElementById("registro-confirmar").value;

    if (password !== confirmation) {
      message(error, "Las contraseñas no coinciden.");
      return;
    }

    button.disabled = true;
    button.querySelector("[data-label]").textContent = "Creando cuenta…";

    try {
      const data = await API.post("/api/auth/registro/", {
        first_name: document.getElementById("registro-nombre").value.trim(),
        last_name: document.getElementById("registro-apellido").value.trim(),
        email: document.getElementById("registro-email").value.trim(),
        username: document.getElementById("registro-username").value.trim(),
        password,
        confirmar_password: confirmation,
      }, { anonimo: true });

      message(success, data?.message || "Cuenta creada correctamente.");
      form.reset();
      window.setTimeout(() => { window.location.href = "/"; }, 1600);
    } catch (requestError) {
      message(error, requestError.mensaje || "No fue posible crear la cuenta.");
    } finally {
      button.disabled = false;
      button.querySelector("[data-label]").textContent = "Crear cuenta";
    }
  });
})();
