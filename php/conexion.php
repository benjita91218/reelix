<?php

$host = "localhost";
$baseDatos = "reelix";
$usuario = "root";
$contrasena = "";

$dsn = "mysql:host=$host;dbname=$baseDatos;charset=utf8mb4";

$opciones = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false
];

try {
    $pdo = new PDO(
        $dsn,
        $usuario,
        $contrasena,
        $opciones
    );
} catch (PDOException $error) {
    error_log($error->getMessage());
    http_response_code(500);
    exit("No se pudo conectar con la base de datos de REELIX.");
}