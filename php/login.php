
<?php

session_start();

header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/conexion.php";


// ======================================================
// RESPUESTAS JSON
// ======================================================

function responder($estado, $datos) {
    http_response_code($estado);

    echo json_encode(
        $datos,
        JSON_UNESCAPED_UNICODE
    );

    exit;
}


// ======================================================
// COMPROBAR MÉTODO HTTP
// ======================================================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(405, [
        "exito" => false,
        "mensaje" => "Este servicio requiere una solicitud POST."
    ]);
}


// ======================================================
// RECIBIR DATOS
// ======================================================

$entrada = json_decode(
    file_get_contents("php://input"),
    true
);

if (!is_array($entrada)) {
    responder(400, [
        "exito" => false,
        "mensaje" => "Los datos recibidos no son válidos."
    ]);
}

$identificador = trim(
    (string) ($entrada["usuario"] ?? "")
);

$password = (string) ($entrada["password"] ?? "");

if ($identificador === "" || $password === "") {
    responder(400, [
        "exito" => false,
        "mensaje" => "Completá el usuario y la contraseña."
    ]);
}


// ======================================================
// BUSCAR USUARIO EN MYSQL
// ======================================================

try {
    $consulta = $pdo->prepare(
        "SELECT id, usuario, email, password_hash
         FROM usuarios
         WHERE LOWER(usuario) = LOWER(:usuario)
            OR LOWER(email) = LOWER(:email)
         LIMIT 1"
    );

    $consulta->execute([
        ":usuario" => $identificador,
        ":email" => $identificador
    ]);

    $cuenta = $consulta->fetch();


    // Validar la cuenta y la contraseña sin revelar
    // cuál de las dos comprobaciones falló.

    if (
        !$cuenta ||
        !password_verify(
            $password,
            $cuenta["password_hash"]
        )
    ) {
        responder(401, [
            "exito" => false,
            "mensaje" => "Usuario o contraseña incorrectos."
        ]);
    }


    // ==================================================
    // CREAR SESIÓN
    // ==================================================

    session_regenerate_id(true);

    $_SESSION["usuario_id"] = (int) $cuenta["id"];
    $_SESSION["usuario"] = $cuenta["usuario"];
    $_SESSION["email"] = $cuenta["email"];


    responder(200, [
        "exito" => true,
        "mensaje" => "Inicio de sesión correcto.",
        "usuario" => $cuenta["usuario"]
    ]);

} catch (PDOException $error) {

    // Los detalles técnicos se guardan en el servidor.
    error_log($error->getMessage());

    responder(500, [
        "exito" => false,
        "mensaje" => "No se pudo iniciar sesión. Intentá nuevamente."
    ]);
}
