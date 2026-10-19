import { crearContenido } from "./crud.js";
// Obtener el formulario
const formulario = document.getElementById("form-agregar");
formulario.addEventListener("submit", (evento) => {
    // Evitar que la página se recargue
    evento.preventDefault();
    // Obtener los valores del formulario
    const titulo = document.getElementById("titulo").value.trim();
    const tipo = document.getElementById("tipo").value;
    const anio = Number(document.getElementById("anio").value);
    const genero = document.getElementById("genero").value;
    const duracion = document.getElementById("duracion").value.trim();
    const calificacion = Number(document.getElementById("calificacion").value);
    const imagen = document.getElementById("imagen").value.trim();
    const sinopsis = document.getElementById("sinopsis").value.trim();
    // Crear el nuevo contenido
    crearContenido(titulo, tipo, anio, genero, duracion, calificacion, sinopsis, imagen);
    // Avisar al usuario
    alert("¡Contenido agregado correctamente!");
    // Volver al catálogo
    window.location.href = "catalogo.html";
});
