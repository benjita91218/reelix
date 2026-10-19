
<?php

// Iniciar la sesión si todavía no está iniciada.
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Si no hay una sesión válida, volver al inicio de sesión.
if (!isset($_SESSION["usuario_id"])) {
    header("Location: /reelix/index.html");
    exit;
}
