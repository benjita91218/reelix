<?php

// Comprobar que el usuario haya iniciado sesión.
require_once __DIR__ . "/php/proteger.php";

// Mostrar el catálogo existente.
readfile(__DIR__ . "/catalogo.html");

?>