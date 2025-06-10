<?php
/**
 * BACKEND DEL CHATBOT
 * 
 * Este script PHP maneja todas las operaciones del backend para el chatbot interactivo:
 * - Comunicación con la API de IA (OpenAI/Deepseek/OpenRouter)
 * - Gestión del historial de conversación
 * - Caché de datos de la empresa
 * - Manejo de errores y validaciones
 * 
 * @version     1.0.0
 * @author      [Mario Sandoval]
 * @requires    PHP 8.0+
 * @requires    Extensión cURL
 * @optional    Extensión APCu para caché en memoria
 */

// ==============================================
// CONFIGURACIÓN PRINCIPAL
// ==============================================

/**
 * Carga variables de entorno desde un archivo .env
 *
 * Esta función permite cargar configuraciones desde un archivo .env en las variables de entorno del sistema,
 * para ser utilizadas posteriormente mediante funciones como getenv(). Es útil para mantener claves,
 * rutas o parámetros sensibles fuera del código fuente.
 *
 * ⚠️ NOTA SOBRE COMPATIBILIDAD:
 * - Esta función usa `str_starts_with()`, disponible solo en PHP 8.0+.
 * - Si necesitas compatibilidad con PHP 7.4, reemplaza esta línea:
 *   if (str_starts_with(trim($line), '#')) continue;
 *   Por esta otra:
 *   if (strpos(trim($line), '#') === 0) continue;
 *
 * @param string $path Ruta absoluta o relativa al archivo .env
 * @return void
 */
function loadEnv($path) {
    // Verifica si el archivo .env existe. Si no existe, se detiene la ejecución de la función.
    if (!file_exists($path)) return;

    // Lee el archivo línea por línea, ignorando líneas vacías y saltos de línea.
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines as $line) {
        // Omite las líneas que comienzan con '#' ya que se consideran comentarios en el archivo .env.
        // Versión compatible con PHP 7.4: if (strpos(trim($line), '#') === 0) continue;
        if (str_starts_with(trim($line), '#')) continue;

        // Divide cada línea en una clave y un valor utilizando el signo '=' como separador.
        list($name, $value) = explode('=', $line, 2);

        // Elimina espacios en blanco y comillas innecesarias de ambos lados.
        $name = trim($name);
        $value = trim($value, '"\'');

        // Establece la variable de entorno usando putenv(), que la hace accesible mediante getenv().
        putenv("$name=$value");
    }
}

// Llama a la función para cargar las variables desde el archivo .env ubicado en el mismo directorio que este archivo.
loadEnv(__DIR__ . '/.env');

// Define constantes globales usando las variables cargadas desde el archivo .env.
// Estas constantes son utilizadas en el resto de la aplicación para configurar parámetros clave como la API, modelo, etc.

define('API_URL', getenv('API_URL'));                     // URL base de la API de chat.
define('API_KEY', getenv('API_KEY'));                     // Clave de autenticación para acceder a la API.
define('MODEL', getenv('MODEL'));                         // Modelo de lenguaje a utilizar.
define('COMPANY_DATA_PATH', getenv('COMPANY_DATA_PATH')); // Ruta al archivo de datos de la empresa.
define('MAX_TOKENS', getenv('MAX_TOKENS'));               // Límite máximo de tokens para la respuesta del modelo.
define('TEMPERATURE', (float) getenv('TEMPERATURE'));     // Grado de aleatoriedad de las respuestas del modelo (0.0 a 1.0).
define('CACHE_PATH', getenv('CACHE_PATH'));               // Ruta donde se almacenan archivos de caché.
define('COMPANY_CACHE_FILE', getenv('COMPANY_CACHE_FILE'));// Ruta al archivo específico de caché de datos de empresa.
define('CACHE_LIFETIME', getenv('CACHE_LIFETIME'));       // Tiempo de vida de la caché en segundos.



// Habilita la visualización de todos los errores de PHP, útil durante el desarrollo y pruebas.
error_reporting(E_ALL);               // Reporta todos los tipos de errores (noticias, advertencias, errores fatales, etc.).
ini_set('display_errors', 1);         // Indica a PHP que muestre los errores en pantalla.

// Inicia la sesión PHP solo si no se ha iniciado previamente.
// Esto permite almacenar y acceder a datos persistentes entre solicitudes del usuario (por ejemplo, tokens, historial, etc.).
if (session_status() === PHP_SESSION_NONE) {
    session_start();                  // Inicia una nueva sesión o reanuda una existente.
}


// ==============================================
// FUNCIONES PRINCIPALES
// ==============================================

/**
 * Carga datos de la empresa con sistema de caché
 * @return array Datos de la empresa
 * @throws Exception Si hay error al cargar datos
 */
function load_company_data() {
    // Verifica si el archivo de datos existe. Si no, lanza una excepción con un mensaje claro.
    if (!file_exists(COMPANY_DATA_PATH)) {
        throw new Exception("Archivo de datos de empresa no encontrado");
    }

    // Obtiene la última fecha de modificación del archivo y genera una clave única de caché.
    $lastModified = filemtime(COMPANY_DATA_PATH);
    $cacheKey = 'company_data_' . md5(COMPANY_DATA_PATH) . '_' . $lastModified;

    // Si la extensión APCu está habilitada y la caché está disponible, devuelve los datos directamente desde la caché.
    if (extension_loaded('apcu') && apcu_exists($cacheKey)) {
        return apcu_fetch($cacheKey);
    }

    // Verifica si hay un archivo de caché local disponible y coincide con la clave generada.
    if (file_exists(COMPANY_CACHE_FILE)) {
        $cacheData = json_decode(file_get_contents(COMPANY_CACHE_FILE), true);

        // Si la caché es válida y coincide con la clave, la devuelve (y la vuelve a almacenar en APCu si está habilitada).
        if ($cacheData && isset($cacheData['cache_key']) && $cacheData['cache_key'] === $cacheKey) {
            if (extension_loaded('apcu')) {
                apcu_store($cacheKey, $cacheData['content'], CACHE_LIFETIME);
            }
            return $cacheData['content'];
        }
    }

    // Si no se encuentra la caché, carga los datos desde el archivo JSON directamente.
    $jsonData = file_get_contents(COMPANY_DATA_PATH);
    $data = json_decode($jsonData, true);

    // Verifica si hubo un error al decodificar el JSON.
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Error decodificando JSON: " . json_last_error_msg());
    }

    // Prepara la estructura de caché con los datos cargados.
    $cacheData = [
        'cache_key' => $cacheKey,
        'content' => $data,
        'timestamp' => time(),
        'source' => COMPANY_DATA_PATH
    ];

    // Almacena los datos en APCu si está disponible.
    if (extension_loaded('apcu')) {
        apcu_store($cacheKey, $data, CACHE_LIFETIME);
    }

    // Asegura que la carpeta de caché exista antes de guardar el archivo.
    if (!file_exists(CACHE_PATH)) {
        mkdir(CACHE_PATH, 0755, true);
    }

    // Guarda los datos de caché en un archivo local para accesos futuros.
    file_put_contents(COMPANY_CACHE_FILE, json_encode($cacheData));

    // Devuelve los datos cargados.
    return $data;
}


/**
 * Esta función limpia manualmente la caché de los datos de empresa.
 * Elimina tanto la caché en memoria (APCu) como el archivo de caché local.
 * @return bool True si se limpió correctamente
 */
function clear_company_data_cache() {
    // Si la extensión APCu está disponible, borra toda la caché de usuario almacenada en memoria.
    if (extension_loaded('apcu')) {
        apcu_clear_cache();  // Limpia la caché APCu para garantizar que se vuelva a cargar desde el archivo fuente.
    }

    // Si existe un archivo de caché local, lo elimina del sistema de archivos.
    if (file_exists(COMPANY_CACHE_FILE)) {
        unlink(COMPANY_CACHE_FILE);  // Borra el archivo de caché para forzar su regeneración.
    }

    // Devuelve true para indicar que la operación se completó correctamente.
    return true;
}


/**
 * Prueba la conexión con la API para verificar si está operativa.
 * Envía un mensaje de prueba y espera una respuesta simple (ej. "OK").
 * @return array Resultado de la prueba
 */
function testAPIConnection() {
    // Estructura del mensaje de prueba para el modelo especificado
    $testPayload = [
        'model' => MODEL, // Modelo definido en la configuración
        'messages' => [
            ['role' => 'system', 'content' => 'Eres un asistente útil'],
            ['role' => 'user', 'content' => 'Responde con OK si estás funcionando']
        ],
        'temperature' => TEMPERATURE,  // Nivel de creatividad en la respuesta
        'max_tokens' => 50             // Límite de tokens en la respuesta
    ];

    // Inicializa cURL para realizar la solicitud HTTP
    $ch = curl_init(API_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,              // Retorna la respuesta como string
        CURLOPT_POST => true,                        // Método POST
        CURLOPT_POSTFIELDS => json_encode($testPayload), // Convierte los datos a JSON
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . API_KEY        // Autenticación con token
        ],
        CURLOPT_TIMEOUT => 15,                       // Tiempo máximo de espera en segundos
        CURLOPT_SSL_VERIFYPEER => true               // Verifica el certificado SSL
    ]);

    // Ejecuta la solicitud y captura la respuesta
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    // Devuelve un arreglo con información de estado y datos de respuesta
    return [
        'success' => $httpCode === 200, // Éxito si el código HTTP es 200
        'http_code' => $httpCode,       // Código de respuesta HTTP
        'response' => $response,        // Cuerpo de la respuesta (JSON)
        'error' => $error               // Mensaje de error en caso de fallo
    ];
}


/**
 * Llama a la API de OpenAI, incluyendo Deepseek y OpenRouter (o compatible) para obtener una respuesta basada en un "prompt" dado.
 * 
 * Esta función construye el contexto del chat, incluyendo la información de la empresa cargada desde el archivo de datos,
 * el historial de mensajes de la sesión y el mensaje del usuario. Luego, envía una solicitud POST a la API de OpenAI, incluyendo Deepseek y OpenRouter (o compatible) 
 * y procesa la respuesta. Si todo va bien, devuelve la respuesta del modelo; si ocurre un error, se maneja de manera adecuada.
 *
 * @param string $prompt El mensaje del usuario que el asistente debe responder.
 * 
 * @return string|false La respuesta generada por el modelo de la API, o false en caso de error.
 */
function callAIModelAPI($prompt) {
    try {
        // Cargar los datos de la empresa desde el archivo de datos.
        $companyData = load_company_data();

        // Construir los mensajes iniciales para la API, que incluyen el contexto sobre la empresa.
        $messages = [
            [
                'role' => 'system',
                'content' => sprintf(
                    'Eres un asistente virtual que responde preguntas sobre una empresa. '.
                    'Solo debes responder preguntas relacionadas con la empresa. '.
                    'Mantén tus respuestas claras y concisas. '.
                    'Si no sabes la respuesta, di que no tienes esa información. '.
                    'Datos de la empresa: %s',
                    json_encode($companyData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                )
            ]
        ];

        // Incluir el historial de mensajes de la sesión, si está disponible.
        if (!empty($_SESSION['chat_history'])) {
            foreach ($_SESSION['chat_history'] as $msg) {
                $messages[] = [
                    'role' => $msg['role'],
                    'content' => $msg['content']
                ];
            }
        }

        // Añadir el mensaje del usuario al historial.
        $messages[] = ['role' => 'user', 'content' => $prompt];

        // Preparar los datos para la solicitud POST a la API.
        $postData = [
            'model' => MODEL,
            'messages' => $messages,
            'temperature' => TEMPERATURE,
            'max_tokens' => MAX_TOKENS
        ];

        // Inicializar cURL para enviar la solicitud a la API.
        $ch = curl_init(API_URL);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,  // Devolver la respuesta como una cadena.
            CURLOPT_POST => true,            // Usar el método POST.
            CURLOPT_POSTFIELDS => json_encode($postData),  // Enviar los datos como JSON.
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',  // Tipo de contenido JSON.
                'Authorization: Bearer ' . API_KEY  // Autorización con la clave API.
            ],
            CURLOPT_TIMEOUT => 30  // Tiempo máximo de espera para la respuesta.
        ]);

        // Ejecutar la solicitud cURL.
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);  // Obtener el código de estado HTTP.

        // Comprobar si ocurrió algún error durante la solicitud cURL.
        if (curl_errno($ch)) {
            throw new Exception("Error CURL: " . curl_error($ch));
        }
        curl_close($ch);  // Cerrar la sesión cURL.

        // Verificar si la API respondió correctamente.
        if ($httpCode !== 200) {
            throw new Exception("API respondió con código HTTP $httpCode");
        }

        // Decodificar la respuesta JSON de la API.
        $responseData = json_decode($response, true);

        // Verificar que la respuesta contiene el contenido esperado.
        if (!isset($responseData['choices'][0]['message']['content'])) {
            throw new Exception("Respuesta inesperada de la API");
        }

        // Devolver el contenido generado por el modelo.
        return $responseData['choices'][0]['message']['content'];

    } catch (Exception $e) {
        // Registrar el error en el log de errores para su depuración.
        error_log("Error en callAIModelAPI: " . $e->getMessage());
        return false;  // Devolver false en caso de error.
    }
}

// ==============================================
// MANEJO DE PETICIONES
// ==============================================

/**
 * Configurar cabecera para respuestas JSON.
 * Establece el encabezado para devolver respuestas en formato JSON.
**/
header('Content-Type: application/json');

try {
    // Acción: Comprobación de conexión con la API (GET ?test_connection)
    if (isset($_GET['test_connection'])) {
        echo json_encode(testAPIConnection()); // Ejecuta función de prueba de conexión
        exit;
    }

    // Acción: Limpiar caché de datos (GET ?clear_cache=true)
    if (isset($_GET['clear_cache']) && $_GET['clear_cache'] === 'true') {
        echo json_encode([
            'success' => clear_company_data_cache(), // Limpia datos en caché
            'message' => 'Caché limpiado correctamente'
        ]);
        exit;
    }

    // Solo se permiten peticiones POST para acciones principales
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Método no permitido", 405);
    }

    // Verifica que se haya enviado una acción
    if (empty($_POST['action'])) {
        throw new Exception("Acción no especificada", 400);
    }

    // Acción recibida
    $action = $_POST['action'];
    $response = ['success' => false]; // Respuesta por defecto

    // Evaluamos la acción enviada
    switch ($action) {

        // Acción: Enviar mensaje al chatbot
        case 'send_message':
            // Verifica que el mensaje no esté vacío
            if (empty($_POST['message'])) {
                throw new Exception("Mensaje vacío", 400);
            }

            $userMessage = trim($_POST['message']); // Limpia el mensaje del usuario
            $apiResponse = callAIModelAPI($userMessage); // Llama a la API del modelo de IA

            // Verifica que haya respuesta válida de la API
            if ($apiResponse === false) {
                throw new Exception("Error al obtener respuesta de la API", 500);
            }

            // Guarda en historial de la sesión
            $_SESSION['chat_history'][] = ['role' => 'user', 'content' => $userMessage];
            $_SESSION['chat_history'][] = ['role' => 'assistant', 'content' => $apiResponse];

            // Devuelve la respuesta y el historial actualizado
            $response = [
                'success' => true,
                'response' => $apiResponse,
                'history' => $_SESSION['chat_history'] ?? []
            ];
            break;

        // Acción: Cargar historial de conversación
        case 'load_history':
            $response = [
                'success' => true,
                'history' => $_SESSION['chat_history'] ?? []
            ];
            break;

        

        // Acción: Borrar todo el historial de la conversación
        case 'clear_history':
            $_SESSION['chat_history'] = []; // Vacía el historial
            $response = ['success' => true, 'message' => 'Historial borrado'];
            break;

        // Acción no reconocida
        default:
            throw new Exception("Acción no válida", 400);
    }

    // Devuelve la respuesta como JSON
    echo json_encode($response);

} catch (Exception $e) {
    // Captura de errores y envío de respuesta con código HTTP adecuado
    http_response_code($e->getCode() ?: 500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}