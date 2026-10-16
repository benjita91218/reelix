import { crearContenido } from "./crud.js";
const formulario = document.getElementById("form-agregar");
formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const titulo = document.getElementById("titulo").value.trim();
    const tipo = document.getElementById("tipo").value;
    const anio = Number(document.getElementById("anio").value);
    const genero = document.getElementById("genero").value;
    const duracion = document.getElementById("duracion").value.trim();
    const calificacion = Number(document.getElementById("calificacion").value);
    const imagen = document.getElementById("imagen").value.trim();
    const sinopsis = document.getElementById("sinopsis").value.trim();
    crearContenido(titulo, tipo, anio, genero, duracion, calificacion, sinopsis, imagen);
    alert("¡Contenido agregado correctamente!");
    window.location.href = "catalogo.html";
});