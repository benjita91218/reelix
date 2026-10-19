
<?php

header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/conexion.php";



function responder($estado, $datos) {
    http_response_code($estado);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}


if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(405, [
        "exito" => false,
        "mensaje" => "Este servicio requiere una solicitud POST."
    ]);
}



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

$usuario = trim((string) ($entrada["usuario"] ?? ""));
$email = strtolower(trim((string) ($entrada["email"] ?? "")));
$password = (string) ($entrada["password"] ?? "");


if ($usuario === "" || $email === "" || $password === "") {
    responder(400, [
        "exito" => false,
        "mensaje" => "Completá todos los campos."
    ]);
}

if (strlen($usuario) < 3 || strlen($usuario) > 50) {
    responder(400, [
        "exito" => false,
        "mensaje" => "El usuario debe tener entre 3 y 50 caracteres."
    ]);
}

if (
    strlen($email) > 150 ||
    !filter_var($email, FILTER_VALIDATE_EMAIL)
) {
    responder(400, [
        "exito" => false,
        "mensaje" => "Ingresá un correo electrónico válido."
    ]);
}

if (strlen($password) < 6 || strlen($password) > 72) {
    responder(400, [
        "exito" => false,
        "mensaje" => "La contraseña debe tener entre 6 y 72 bytes."
    ]);
}


try {



    $passwordHash = password_hash(
        $password,
        PASSWORD_DEFAULT
    );

    $consulta = $pdo->prepare(
        "INSERT INTO usuarios (usuario, email, password_hash)
         VALUES (:usuario, :email, :password_hash)"
    );

    $consulta->execute([
        ":usuario" => $usuario,
        ":email" => $email,
        ":password_hash" => $passwordHash
    ]);

    responder(201, [
        "exito" => true,
        "mensaje" => "¡Cuenta creada correctamente!"
    ]);

} catch (PDOException $error) {


    if ($error->getCode() === "23000") {
        responder(409, [
            "exito" => false,
            "mensaje" => "Ese usuario o correo ya está registrado."
        ]);
    }

    error_log($error->getMessage());

    responder(500, [
        "exito" => false,
        "mensaje" => "No se pudo registrar la cuenta."
    ]);
}
