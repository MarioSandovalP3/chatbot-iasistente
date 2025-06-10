/**
 * IMPLEMENTACIÓN DE CHATBOT INTERACTIVO
 *
 * Este script gestiona la interfaz del chatbot, incluyendo la interacción del usuario con las siguientes características:
 * - Interfaz de chat que se puede mostrar/ocultar
 * - Efectos de escritura animada
 * - Formateo de mensajes con Markdown
 * - Historial de conversación persistente
 * - Funciones para eliminar mensajes individuales
 *
 * @version     1.0.0
 * @author      [Mario Sandoval]
 * @requires    marked.js - Para procesamiento de Markdown
 * @optional    Prism.js - Para resaltado de sintaxis en bloques de código
 */

// Esperar a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function () {
  // ==============================================
  // CONFIGURACIÓN INICIAL
  // ==============================================

  /**
   * Objeto principal del chatbot
   * @namespace
   */
  const chatbot = {
    /**
     * Referencias a elementos DOM
     * @property {HTMLElement} toggle - Botón para mostrar/ocultar el chat
     * @property {HTMLElement} container - Contenedor principal del chat
     * @property {HTMLElement} closeBtn - Botón para cerrar el chat
     * @property {HTMLElement} messages - Contenedor de los mensajes
     * @property {HTMLElement} input - Campo de entrada de texto
     * @property {HTMLElement} sendBtn - Botón para enviar mensajes
     * @property {HTMLElement} clearBtn - Botón para limpiar el historial
     */
    elements: {
      toggle: document.getElementById("chatbot-toggle"),
      container: document.getElementById("chatbot-container"),
      closeBtn: document.getElementById("chatbot-close"),
      messages: document.getElementById("chatbot-messages"),
      input: document.getElementById("chatbot-input-field"),
      sendBtn: document.getElementById("chatbot-send"),
      clearBtn: document.querySelector(".clear-history-btn"),
    },

    /**
     * Estado interno del chatbot
     * @property {boolean} isOpen - Indica si el chat está visible
     * @property {boolean} isTyping - Indica si el bot está escribiendo
     * @property {number|null} currentTypingAnimation - ID de la animación de escritura actual
     */
    state: {
      isOpen: false,
      isTyping: false,
      currentTypingAnimation: null,
    },
  };

  // Elementos adicionales de la UI
  const chatbotToggle = document.getElementById("chatbot-toggle");
  const chatbotInvite = document.getElementById("chatbot-invite");

  // Mostrar mensaje de invitación al pasar el mouse
  chatbotToggle.addEventListener("mouseenter", () => {
    chatbotInvite.classList.add("visible");
  });

  // Ocultar mensaje de invitación al quitar el mouse
  chatbotToggle.addEventListener("mouseleave", () => {
    chatbotInvite.classList.remove("visible");
  });

  // Mostrar mensaje de invitación temporal al cargar la página
  setTimeout(() => {
    chatbotInvite.classList.add("visible");
    setTimeout(() => {
      chatbotInvite.classList.remove("visible");
    }, 3000); // Ocultar después de 3 segundos
  }, 1000); // Mostrar 1 segundo después de cargar

  // Configuración de marked.js para procesar Markdown
  marked.setOptions({
    breaks: true, // Convertir saltos de línea en <br>
    gfm: true, // Soporte para GitHub Flavored Markdown
    smartypants: true, // Conversión inteligente de comillas y guiones

    /**
     * Función para resaltado de sintaxis (opcional)
     * @param {string} code - Código a resaltar
     * @param {string} lang - Lenguaje de programación
     * @returns {string} Código HTML resaltado
     */
    highlight: function (code, lang) {
      // Requiere Prism.js para funcionar
      if (Prism && lang && Prism.languages[lang]) {
        return Prism.highlight(code, Prism.languages[lang], lang);
      }
      return code;
    },
  });

  // ==============================================
  // FUNCIONES PRINCIPALES
  // ==============================================

  /**
   * Muestra un mensaje con efecto de escritura animada
   * @param {string} content - Contenido del mensaje (puede incluir Markdown)
   * @param {string} sender - Remitente ('user', 'assistant' o 'system')
   * @param {number|null} [index=null] - Índice opcional para identificar el mensaje
   * @returns {Promise} Se resuelve cuando termina la animación
   */
  async function showMessageWithTyping(content, sender, index = null) {
    return new Promise((resolve) => {
      // Cancelar animación anterior si existe
      if (chatbot.state.currentTypingAnimation) {
        clearTimeout(chatbot.state.currentTypingAnimation);
      }

      // Crear elemento del mensaje
      const messageDiv = document.createElement("div");
      messageDiv.className = `${sender}-message`;
      if (index !== null) messageDiv.dataset.index = index;

      const contentDiv = document.createElement("div");
      contentDiv.className = "message-content";
      messageDiv.appendChild(contentDiv);

      // Añadir al contenedor de mensajes
      chatbot.elements.messages.appendChild(messageDiv);

      let i = 0;
      const speed = 20; // Velocidad de escritura en ms por caracter
      const fullText = content;
      let htmlBuffer = "";

      // Función recursiva para el efecto de escritura
      function typeWriter() {
        if (i < fullText.length) {
          htmlBuffer += fullText.charAt(i);
          i++;
          // Procesar Markdown a medida que se escribe
          contentDiv.innerHTML = marked.parse(htmlBuffer);
          scrollToBottom();
          chatbot.state.currentTypingAnimation = setTimeout(typeWriter, speed);
        } else {
          chatbot.state.currentTypingAnimation = null;
          resolve();
        }
      }

      typeWriter();
    });
  }

  /**
   * Muestra un mensaje inmediatamente sin animación
   * @param {string} content - Contenido del mensaje
   * @param {string} sender - Remitente ('user', 'assistant' o 'system')
   * @param {number|null} [index=null] - Índice opcional para el mensaje
   */
  function showMessageInstant(content, sender, index = null) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `${sender}-message`;
    if (index !== null) messageDiv.dataset.index = index;

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    // Procesar Markdown
    contentDiv.innerHTML = marked.parse(content);
    messageDiv.appendChild(contentDiv);

    chatbot.elements.messages.appendChild(messageDiv);

    scrollToBottom();
  }

  /**
   * Sanitiza la entrada del usuario para prevenir XSS
   * @param {string} input - Texto ingresado por el usuario
   * @returns {string} Texto sanitizado
   */
  function sanitizeUserInput(input) {
    // Eliminar scripts y atributos de eventos peligrosos
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/g, "");
  }

  /**
   * Envía un mensaje al servidor y procesa la respuesta
   * @async
   */
  async function sendMessage() {
    let message = chatbot.elements.input.value.trim();
    // No hacer nada si el campo está vacío o el bot está escribiendo
    if (!message || chatbot.state.isTyping) return;

    try {
      // Sanitizar el mensaje del usuario
      message = sanitizeUserInput(message);

      // Mostrar mensaje del usuario inmediatamente
      showMessageInstant(message, "user");
      chatbot.elements.input.value = "";
      chatbot.state.isTyping = true;

      // Mostrar indicador de que el bot está escribiendo
      const typingIndicator = createTypingIndicator();
      chatbot.elements.messages.appendChild(typingIndicator);
      scrollToBottom();

      // Enviar mensaje al servidor
      const response = await fetch("chatbot/chatbot.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `action=send_message&message=${encodeURIComponent(message)}`,
      });

      // Verificar si la respuesta es válida
      if (!response.ok) {
        throw new Error(`Error HTTP! estado: ${response.status}`);
      }

      const data = await response.json();
      // Eliminar indicador de escritura
      chatbot.elements.messages.removeChild(typingIndicator);

      if (!data.success) {
        throw new Error(data.error || "Error en la respuesta del servidor");
      }

      // Mostrar respuesta con efecto de escritura
      await showMessageWithTyping(data.response, "assistant");
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      showMessageInstant(
        "Error al procesar tu mensaje. Intenta nuevamente.",
        "system"
      );
    } finally {
      chatbot.state.isTyping = false;
    }
  }

  /**
   * Carga el historial de chat desde el servidor
   * @async
   */
  async function loadChatHistory() {
    try {
      const response = await fetch("chatbot/chatbot.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "action=load_history",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Error cargando historial");
      }

      // Limpiar contenedor de mensajes
      chatbot.elements.messages.innerHTML = "";

      if (data.history && data.history.length > 0) {
        // Mostrar cada mensaje del historial
        for (let i = 0; i < data.history.length; i++) {
          const msg = data.history[i];
          showMessageInstant(
            msg.content,
            msg.role === "user" ? "user" : "assistant",
            i
          );
        }
      } else {
        // Mostrar mensaje de bienvenida si no hay historial
        showMessageInstant("¡Hola! ¿En qué puedo ayudarte? 😊", "assistant");
      }
    } catch (error) {
      console.error("Error cargando historial:", error);
      showMessageInstant("No se pudo cargar el historial de chat", "system");
    }
  }

  // ==============================================
  // FUNCIONES AUXILIARES
  // ==============================================

  /**
   * Crea un indicador visual de que el bot está escribiendo
   * @returns {HTMLElement} Elemento del indicador
   */
  function createTypingIndicator() {
    const indicator = document.createElement("div");
    indicator.className = "typing-indicator";

    // Añadir puntos de animación
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("span");
      dot.className = "typing-dot";
      indicator.appendChild(dot);
    }

    return indicator;
  }

  /**
   * Desplaza el contenedor de mensajes al final
   */
  function scrollToBottom() {
    chatbot.elements.messages.scrollTop =
      chatbot.elements.messages.scrollHeight;
  }

  // ==============================================
  // MANEJADORES DE EVENTOS
  // ==============================================

  // Alternar visibilidad del chat
  chatbot.elements.toggle.addEventListener("click", () => {
    chatbot.state.isOpen = !chatbot.state.isOpen;
    chatbot.elements.container.classList.toggle(
      "hidden",
      !chatbot.state.isOpen
    );
    if (chatbot.state.isOpen) scrollToBottom();
  });

  // Cerrar el chat
  chatbot.elements.closeBtn.addEventListener("click", () => {
    chatbot.state.isOpen = false;
    chatbot.elements.container.classList.add("hidden");
  });

  // Enviar mensaje al presionar Enter
  chatbot.elements.input.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Enviar mensaje al hacer clic en el botón
  chatbot.elements.sendBtn.addEventListener("click", sendMessage);

  // Limpiar todo el historial de chat
  chatbot.elements.clearBtn.addEventListener("click", async () => {
    try {
      const response = await fetch("chatbot/chatbot.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "action=clear_history",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Error al limpiar historial");
      }

      // Vaciar el contenedor de mensajes
      chatbot.elements.messages.innerHTML = "";
    } catch (error) {
      console.error("Error limpiando historial:", error);
      showMessageInstant("No se pudo limpiar el historial", "system");
    }
  });

  // ==============================================
  // INICIALIZACIÓN
  // ==============================================

  // Ocultar el chat al inicio y cargar el historial
  chatbot.elements.container.classList.add("hidden");
  loadChatHistory();
});
