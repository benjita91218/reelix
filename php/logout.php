<?php

session_start();

// Vaciar los datos de la sesión.
$_SESSION = [];

// Eliminar la cookie de sesión del navegador.
if (ini_get("session.use_cookies")) {
    $parametros = session_get_cookie_params();

    setcookie(
        session_name(),
        "",
        time() - 42000,
        $parametros["path"],
        $parametros["domain"],
        $parametros["secure"],
        $parametros["httponly"]
    );
}

// Destruir la sesión en el servidor.
session_destroy();

// Volver al inicio de sesión.
header("Location: ../index.html");
exit;