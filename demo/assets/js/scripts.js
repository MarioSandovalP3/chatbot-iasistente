// Efecto de partículas
particlesJS("particles-js", {
  particles: {
    number: {
      value: 80,
      density: {
        enable: true,
        value_area: 800,
      },
    },
    color: {
      value: "#ffffff",
    },
    shape: {
      type: "circle",
      stroke: {
        width: 0,
        color: "#000000",
      },
      polygon: {
        nb_sides: 5,
      },
    },
    opacity: {
      value: 0.3,
      random: false,
      anim: {
        enable: false,
        speed: 1,
        opacity_min: 0.1,
        sync: false,
      },
    },
    size: {
      value: 3,
      random: true,
      anim: {
        enable: false,
        speed: 40,
        size_min: 0.1,
        sync: false,
      },
    },
    line_linked: {
      enable: true,
      distance: 150,
      color: "#ffffff",
      opacity: 0.2,
      width: 1,
    },
    move: {
      enable: true,
      speed: 2,
      direction: "none",
      random: false,
      straight: false,
      out_mode: "out",
      bounce: false,
      attract: {
        enable: false,
        rotateX: 600,
        rotateY: 1200,
      },
    },
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: {
        enable: true,
        mode: "grab",
      },
      onclick: {
        enable: true,
        mode: "push",
      },
      resize: true,
    },
    modes: {
      grab: {
        distance: 140,
        line_linked: {
          opacity: 1,
        },
      },
      bubble: {
        distance: 400,
        size: 40,
        duration: 2,
        opacity: 8,
        speed: 3,
      },
      repulse: {
        distance: 200,
        duration: 0.4,
      },
      push: {
        particles_nb: 4,
      },
      remove: {
        particles_nb: 2,
      },
    },
  },
  retina_detect: true,
});

// Animación GSAP para elementos
gsap.from(".logo", {
  duration: 1,
  y: -50,
  opacity: 0,
  ease: "power2.out",
});
gsap.from(".nav-links li", {
  duration: 1,
  y: -50,
  opacity: 0,
  stagger: 0.1,
  delay: 0.5,
  ease: "power2.out",
});

// Menú hamburguesa
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");
const navItems = document.querySelectorAll(".nav-links li");

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("nav-active");
  hamburger.classList.toggle("toggle");
});

// Cerrar menú al hacer clic en un enlace
navItems.forEach((item) => {
  item.addEventListener("click", () => {
    if (window.innerWidth <= 768) {
      navLinks.classList.remove("nav-active");
      hamburger.classList.remove("toggle");
    }
  });
});

// Efecto de escritura para el título
const titleSpan = document.querySelector(".hero-content h1 span");
const words = [
  "estrategias digitales",
  "soluciones creativas",
  "resultados tangibles",
  "crecimiento exponencial",
];
let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;
let isEnd = false;

function typeEffect() {
  const currentWord = words[wordIndex];
  const currentChar = currentWord.substring(0, charIndex);

  titleSpan.textContent = currentChar;

  if (!isDeleting && charIndex < currentWord.length) {
    charIndex++;
    setTimeout(typeEffect, 100);
  } else if (isDeleting && charIndex > 0) {
    charIndex--;
    setTimeout(typeEffect, 50);
  } else {
    isDeleting = !isDeleting;
    if (!isDeleting) {
      wordIndex = (wordIndex + 1) % words.length;
    }
    setTimeout(typeEffect, 1000);
  }
}

// Iniciar el efecto después de 2 segundos
setTimeout(typeEffect, 2000);
