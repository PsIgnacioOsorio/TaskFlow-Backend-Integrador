(() => {
  const searchInput = document.querySelector("#task-search");
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const taskCards = [...document.querySelectorAll("[data-task-card]")];
  const filterSummary = document.querySelector("#filter-summary");
  const emptyState = document.querySelector("#empty-state");
  const clearFiltersButton = document.querySelector("#clear-filters");

  if (!searchInput) return;

  if (taskCards.length === 0) {
    filterSummary.textContent = "0 tareas registradas";
    emptyState.hidden = false;
    clearFiltersButton?.setAttribute("hidden", "");
    return;
  }

  let selectedStatus = "all";

  const normalizeText = (value = "") => {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  };

  const applyFilters = () => {
    const searchTerm = normalizeText(searchInput.value);
    let visibleTasks = 0;

    taskCards.forEach((card) => {
      const matchesStatus = selectedStatus === "all" || card.dataset.status === selectedStatus;
      const matchesSearch = normalizeText(card.dataset.search).includes(searchTerm);
      const isVisible = matchesStatus && matchesSearch;

      card.hidden = !isVisible;
      if (isVisible) visibleTasks += 1;
    });

    filterSummary.textContent = `${visibleTasks} de ${taskCards.length} tareas visibles`;
    emptyState.hidden = visibleTasks !== 0;
  };

  const selectFilter = (status) => {
    selectedStatus = status;

    filterButtons.forEach((button) => {
      const isActive = button.dataset.filter === status;
      button.classList.toggle("btn-primary", isActive);
      button.classList.toggle("btn-outline-secondary", !isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    applyFilters();
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => selectFilter(button.dataset.filter));
  });

  searchInput.addEventListener("input", applyFilters);

  clearFiltersButton?.addEventListener("click", () => {
    searchInput.value = "";
    selectFilter("all");
    searchInput.focus();
  });
})();
