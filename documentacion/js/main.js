document.addEventListener("DOMContentLoaded", function () {
  // Configuración inicial
  const config = {
    smoothScroll: true,
    mobileBreakpoint: 992,
    codeTabs: true,
  };

  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".main-nav a");

  function onScroll() {
    let scrollPos = window.scrollY + 100; // Ajusta el "100" según la altura del header fijo

    let currentSectionId = null;
    sections.forEach((section) => {
      if (scrollPos >= section.offsetTop) {
        currentSectionId = section.id;
      }
    });

    navLinks.forEach((link) => {
      link.parentElement.classList.remove("active");
      if (link.getAttribute("href") === "#" + currentSectionId) {
        link.parentElement.classList.add("active");
      }
    });
  }

  window.addEventListener("scroll", onScroll);
  onScroll(); // Ejecutar una vez al cargar la página

  // Inicializar componentes
  initNavigation();
  if (config.codeTabs) initCodeTabs();
  if (config.smoothScroll) initSmoothScroll();
  initAnchorLinks();
  initSearch();

  // Navegación responsive
  function initNavigation() {
    const menuToggle = document.createElement("button");
    menuToggle.className = "menu-toggle";
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    document.body.appendChild(menuToggle);

    menuToggle.addEventListener("click", function () {
      document.querySelector(".sidebar").classList.toggle("active");
    });

    // Cerrar menú al hacer clic en un enlace en móviles
    document.querySelectorAll(".main-nav a").forEach((link) => {
      link.addEventListener("click", function () {
        const sidebar = document.querySelector(".sidebar");
        if (sidebar && window.innerWidth <= 992) {
          sidebar.classList.remove("active");

          // Asegurarse de que también se actualice el botón hamburguesa
          const hamburger = document.querySelector(".hamburger");
          if (hamburger) {
            hamburger.classList.remove("active");
          }
        }
      });
    });
  }

  // Pestañas de código
  function initCodeTabs() {
    const tabs = document.querySelectorAll(".code-tabs");

    tabs.forEach((tabGroup) => {
      const tabButtons = tabGroup.querySelectorAll(".tab-btn");
      const tabContents =
        tabGroup.parentElement.querySelectorAll(".tab-content");

      tabButtons.forEach((button, index) => {
        button.addEventListener("click", function (e) {
          // Remover activo de todos los botones y contenidos
          tabButtons.forEach((btn) => btn.classList.remove("active"));
          tabContents.forEach((content) => (content.style.display = "none"));

          // Activar el botón y contenido clickeado
          this.classList.add("active");
          const tabId = this.getAttribute("onclick").match(/'([^']+)'/)[1];
          document.getElementById(tabId).style.display = "block";
        });
      });

      // Activar la primera pestaña por defecto
      if (tabButtons.length > 0) {
        tabButtons[0].classList.add("active");
        const firstTabId = tabButtons[0]
          .getAttribute("onclick")
          .match(/'([^']+)'/)[1];
        document.getElementById(firstTabId).style.display = "block";
      }
    });
  }

  // Scroll suave
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();

        const targetId = this.getAttribute("href");
        if (targetId === "#") return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 20,
            behavior: "smooth",
          });
        }
      });
    });
  }

  // Búsqueda simulada (en un sistema real, usar un servicio de búsqueda)
  function initSearch() {
    const searchInput = document.querySelector(".search-box input");
    const searchButton = document.querySelector(".search-box button");

    searchButton.addEventListener("click", function () {
      performSearch(searchInput.value.trim());
    });

    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        performSearch(this.value.trim());
      }
    });
  }

  function performSearch(query) {
    if (query.length < 2) {
      alert("Por favor, ingresa al menos 2 caracteres para buscar.");
      return;
    }

    // Simular búsqueda (en producción, esto sería una búsqueda real)
    const results = [];
    const content = document
      .querySelector(".content")
      .textContent.toLowerCase();

    if (content.includes(query.toLowerCase())) {
      results.push("Se encontraron coincidencias en la documentación.");
    }

    if (results.length > 0) {
      alert(results.join("\n\n"));
    } else {
      alert("No se encontraron resultados para tu búsqueda.");
    }
  }

  // Ejecutar cuando el DOM esté listo
  document.addEventListener("DOMContentLoaded", initCodeHighlighting);

  // Función para abrir pestañas (usada en HTML onclick)
  function openTab(evt, tabName) {
    const tabContents = document.querySelectorAll(".tab-content");
    const tabButtons = document.querySelectorAll(".tab-btn");

    tabContents.forEach((content) => {
      content.style.display = "none";
    });

    tabButtons.forEach((button) => {
      button.classList.remove("active");
    });

    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");
  }
});
