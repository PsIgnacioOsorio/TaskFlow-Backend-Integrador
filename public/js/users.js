(() => {
  const deleteForms = document.querySelectorAll("[data-delete-user]");

  deleteForms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      const confirmed = window.confirm(
        "¿Eliminar este usuario? Sus tareas asociadas también serán eliminadas."
      );
      if (!confirmed) event.preventDefault();
    });
  });
})();
