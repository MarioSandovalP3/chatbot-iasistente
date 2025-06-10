# 🧠 Chatbot AI con PHP y OpenAI (Compatible con Deepseek y OpenRouter)

Un **chatbot flotante** que responde preguntas sobre tu negocio usando **inteligencia artificial** y datos estructurados desde un archivo .json.

Es un **asistente virtual inteligente** que se integra fácilmente en tu sitio web, permitiendo que los visitantes obtengan información sobre tu negocio **al instante, con precisión y automáticamente**.

Está especialmente diseñado para **sitios web de pequeñas o medianas empresas** que quieren ofrecer soporte instantáneo sin depender de una base de datos compleja.

---

## 🔍 ¿Cómo funciona?

- El chatbot **lee la información de tu negocio desde un archivo .json**, donde defines detalles como: servicios, horarios, ubicación, contacto, políticas, etc.
- Con un **prompt personalizado**, la IA solo responde sobre tu negocio, evitando temas no relacionados.
- Usa **caché de respuestas** para mejorar el rendimiento y reducir el uso de la API.
- Almacena un **historial de conversación** por sesión para interacciones más naturales.

> Para proyectos más grandes que necesiten escalar (multi-usuario, multi-empresa, muchas consultas simultáneas), se recomienda implementar una base de datos como **MySQL** en lugar de usar un archivo .json.

---

## 📋 Requisitos del sistema

- Editor de código: Visual Studio Code, Sublime Text, etc.
- Navegador moderno: Chrome, Firefox, Edge
- Conocimientos básicos de: HTML, CSS, JavaScript y PHP
- Servidor web con **PHP 8.0 o superior**
- **Extensión cURL** habilitada
- 🔁 Recomendado: **Extensión APCu** para caché en memoria
- Una API key válida de OpenAI, Deepseek, OpenRouter u otro proveedor compatible

---

## ⚠️ Importante

Este chatbot **debe ejecutarse en un servidor web** (local o en hosting).  
**No funcionará si se abre directamente desde una carpeta local en el navegador** (ej: haciendo doble clic en un archivo .html).

Para pruebas locales puedes usar:

- [XAMPP](https://www.apachefriends.org/)
- [Laragon](https://laragon.org/)
- [WAMP](https://www.wampserver.com/)
- [MAMP](https://www.mamp.info/)

---

## 🔑 ¿Dónde obtener la API Key?

Este chatbot requiere una **API key válida** de un proveedor de IA. Puedes usar cualquiera de estos:

### 1. OpenAI (ChatGPT)

- Sitio web: [https://platform.openai.com/](https://platform.openai.com/)
- Requiere registro y método de pago
- Copia tu key desde: https://platform.openai.com/account/api-keys

### 2. Deepseek

- Sitio web: [https://platform.deepseek.com/](https://platform.deepseek.com/)
- Ofrece modelos potentes y más económicos
- Crea una cuenta y genera tu API key desde el panel

### 3. OpenRouter (Compatibilidad avanzada y modelos gratis)

- Sitio web: [https://openrouter.ai/](https://openrouter.ai/)
- Elige entre múltiples modelos (Claude, GPT-4, Mistral, etc.)
- ✅ **Incluye modelos gratuitos**, como google/gemma-3-27b-it:free, potentes y listos para usar sin costo
- Obtén tu API key aquí: https://openrouter.ai/keys

> 💡 **Recomendado para empezar gratis**: Usa OpenRouter con un modelo gratuito como google/gemma-3-27b-it:free.

⚠️ Asegúrate de mantener tu key segura. No la compartas ni la subas a repositorios públicos.

---

## Instalación y Configuración

Sigue estos pasos para integrar y configurar el ChatBot + AI en tu sitio web. La instalación está diseñada para ser simple, permitiendo una configuración rápida.

---

### 📁 Paso 1: Colocar la carpeta del Chatbot

El chatbot se distribuye en una carpeta llamada /chatbot. Para usarlo, simplemente copia esta carpeta completa y colócala en el **directorio raíz** de tu sitio web.
Esta es la misma ubicación donde normalmente se encuentra tu archivo index.html o página principal.

#### La estructura de tu proyecto debería verse así:

```plaintext
/raiz-de-tu-sitio/
  ├── index.html (o tu página principal)
  ├── css/
  ├── js/
  ├── img/
  ├── chatbot/  <-- AQUÍ VA LA CARPETA DEL CHATBOT
  │     ├── cache/
  │           ├── company_data.cache
  │     ├── css/
  │           ├── chatbot.css
  │     ├── data/
  │           ├── company.json
  │     ├── img/
  │           ├── chatbot.png
  │     ├── js/
  │           ├── chatbot.js
  │     ├── .env
  │     ├── chatbot.php
  └── ... (otros archivos y carpetas de tu sitio)
```

Asegúrate que las carpetas `/chatbot/data/` y `/chatbot/cache/` existan y tengan permisos de escritura si tu servidor lo requiere para que el script PHP pueda crear y modificar archivos dentro de ellas.

---

### 🧩 Paso 2: Integrar el HTML del Chatbot

Para que el chatbot esté disponible en todas las secciones de tu sitio web, se recomienda incluir su código HTML en el &lt;footer&gt; de tu plantilla principal o justo antes de la etiqueta de cierre &lt;/body&gt; en cada página donde quieras que aparezca.

#### Copia y pega el siguiente bloque HTML:

```html
<!-- Componente del Chatbot -->
<!-- Botón de invitación inicial -->
<div id="chatbot-invite" class="chatbot-invite">
  <span>¡Chatea con nosotros!</span>
</div>

<!-- Botón de toggle del chatbot -->
<div id="chatbot-toggle" class="chatbot-toggle">
  <img
    src="./chatbot/img/chatbot.png"
    width="50"
    height="50"
    alt="Icono de asistente virtual"
    class="img-zoom"
  />
</div>

<!-- Contenedor principal del chatbot -->
<div id="chatbot-container" class="chatbot-container hidden">
  <!-- Cabecera del chatbot -->
  <div class="chatbot-header">
    <span style="display: inline-flex; align-items: center; gap: 8px">
      <img
        src="./chatbot/img/chatbot.png"
        width="50"
        height="50"
        alt="Asistente Virtual"
        class="img-zoom"
      />
      <span>Tu Asistente Virtual</span>
    </span>
    <button
      id="chatbot-close"
      class="chatbot-close"
      aria-label="Cerrar chatbot"
    >
      <i class="fa-solid fa-circle-xmark"></i>
    </button>
  </div>

  <!-- Área de mensajes -->
  <div id="chatbot-messages" class="chatbot-messages">
    <!-- Los mensajes se insertan dinámicamente desde JavaScript -->
  </div>

  <!-- Footer del chatbot con controles de entrada -->
  <div class="chatbot-footer">
    <button class="clear-history-btn" title="Borrar Historial">
      <i class="fa-regular fa-trash-can"></i>
    </button>
    <input
      type="text"
      id="chatbot-input-field"
      class="chatbot-input-field"
      placeholder="Escribe tu mensaje..."
      autofocus
      aria-label="Campo de entrada del chatbot"
    />
    <button id="chatbot-send" class="chatbot-send" aria-label="Enviar mensaje">
      <i class="fas fa-paper-plane"></i>
    </button>
  </div>
</div>
<!-- Fin del Componente del Chatbot -->
```

> 📌 Nota: Asegúrate que las rutas de las imágenes (ej: src="./chatbot/img/chatbot.png") sean correctas desde la ubicación de tus archivos HTML principales. Si tu index.html está en la raíz y la carpeta chatbot también, estas rutas deberían funcionar.

No olvides enlazar los archivos CSS (chatbot.css) y JavaScript (chatbot.js) del chatbot en tu HTML, típicamente en la sección &lt;head&gt; para CSS y antes de cerrar &lt;/body&gt; para JS:

```html
<!-- En el <head> o antes de cerrar </body> para CSS -->
<link rel="stylesheet" href="./chatbot/chatbot.css" />

<!-- Antes de cerrar </body> para JavaScript -->
<script src="./chatbot/chatbot.js"></script>
```

### ⚙️ Paso 3: Configurar el archivo de entorno (.env)

El chatbot usa un archivo .env para manejar configuraciones sensibles y específicas del entorno, como API keys y rutas. Ubicado en: /chatbot/.env

```plaintext
API_URL=https://api.openai.com/v1/chat/completions
API_KEY=your_api_key_here
MODEL=gpt-3.5-turbo
COMPANY_DATA_PATH=./data/company.json
MAX_TOKENS=1000
TEMPERATURE=0.7
CACHE_PATH=./cache/
COMPANY_CACHE_FILE=./cache/company_data.cache
CACHE_LIFETIME=3600

```

#### Descripción de variables:

- API_URL: El endpoint para la API del modelo de lenguaje (ej: OpenAI).

- API_KEY: Importante: Reemplaza tu_api_key_aqui con tu API key real proporcionada por el servicio de IA.

- MODEL: El identificador del modelo de IA que quieres usar.

- COMPANY_DATA_PATH: Ruta relativa al archivo JSON con la info de tu empresa (por defecto: ./data/company.json).

- MAX_TOKENS: Número máximo de tokens que la IA generará por respuesta.

- TEMPERATURE: Controla la creatividad de las respuestas (0.2 = enfocado, 0.8 = creativo).

- CACHE_PATH: Ruta al directorio para archivos de caché.

- COMPANY_CACHE_FILE: Ruta al archivo de caché para datos de la empresa.

- CACHE_LIFETIME: Tiempo de vida del caché en segundos (3600 = 1 hora).

#### ⚠️ Advertencia de seguridad:

- ¡No compartas tu archivo .env públicamente ni lo subas a repositorios públicos de código!
- Asegúrate que tu servidor web bloquee el acceso directo a archivos .env. Si usas Git, añade .env a tu .gitignore.

### 📝 Paso 4: Configurar el archivo de información de la empresa (company.json)

El chatbot está diseñado para responder preguntas basadas en información específica de tu empresa. Esta información se carga desde un archivo JSON.

Crea un archivo llamado company.json dentro de la carpeta /chatbot/data/.
(La ruta por defecto es ./data/company.json como se define en la configuración del .env.)

El contenido de este archivo debe ser un objeto JSON estructurado con la información que quieres que la IA conozca.

#### 🧾 Example `company.json`:

```json
{
  "nombre_empresa": "Mi Gran Empresa S.A.",
  "descripcion_general": "Somos líderes en soluciones innovadoras para el sector X, con más de 20 años de experiencia.",
  "horario_atencion": "Lunes a viernes de 9:00 AM a 6:00 PM",
  "contacto": {
    "telefono": "+123 456 7890",
    "email": "info@migranempresa.com",
    "direccion": "Calle Falsa 123, Ciudad Ejemplo"
  },
  "productos_servicios": [
    {
      "nombre": "Producto Estrella Alfa",
      "descripcion": "Nuestra solución más popular para optimizar Y.",
      "precio": "Desde $99"
    },
    {
      "nombre": "Servicio Premium Beta",
      "descripcion": "Consultoría experta y soporte 24/7 para Z.",
      "caracteristicas": [
        "Soporte prioritario",
        "Consultores dedicados",
        "Reportes mensuales"
      ]
    }
  ],
  "preguntas_frecuentes": [
    {
      "pregunta": "¿Cómo puedo contratar sus servicios?",
      "respuesta": "Puedes contactarnos vía email a info@migranempresa.com o llamando al +123 456 7890. También puedes visitar nuestra sección de contacto en el sitio web."
    },
    {
      "pregunta": "¿Ofrecen demostraciones?",
      "respuesta": "Sí, ofrecemos demostraciones gratuitas de nuestro Producto Estrella Alfa. Por favor agenda una cita con nuestro equipo de ventas."
    }
  ],
  "politica_devoluciones": "Puedes consultar nuestra política de devoluciones en www.ejemplo.com/devoluciones. Generalmente aceptamos devoluciones dentro de los 30 días posteriores a la compra, siempre que el producto esté en su condición original."
}
```

Puedes estructurar este JSON como consideres adecuado. La IA intentará extraer información relevante de este archivo para responder consultas de los usuarios sobre tu empresa. Cuanto más detallada y bien estructurada esté la información, mejores serán las respuestas.

Una vez completados estos pasos, tu chatbot debería estar listo para funcionar en tu sitio web. Consulta las guías específicas de PHP, HTML, CSS y JavaScript para entender mejor cómo modificar y extender la funcionalidad del chatbot.

---

## 🛠️ Soporte y Contacto

Si necesitas ayuda técnica, personalizaciones o tienes alguna pregunta, no dudes en contactarme:

- 📧 Email: [mariosandovalp3@gmail.com](mailto:mariosandovalp3@gmail.com)
- 💼 LinkedIn: [https://www.linkedin.com/in/mariosandovaldev/](https://www.linkedin.com/in/mariosandovaldev/)
