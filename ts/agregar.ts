import { crearContenido } from "./crud.js";

// Obtener el formulario
const formulario = document.getElementById("form-agregar") as HTMLFormElement;

formulario.addEventListener("submit", (evento) => {

    // Evitar que la página se recargue
    evento.preventDefault();

    // Obtener los valores del formulario
    const titulo = (
        document.getElementById("titulo") as HTMLInputElement
    ).value.trim();

    const tipo = (
        document.getElementById("tipo") as HTMLSelectElement
    ).value;

    const anio = Number(
        (document.getElementById("anio") as HTMLInputElement).value
    );

    const genero = (
        document.getElementById("genero") as HTMLSelectElement
    ).value;

    const duracion = (
        document.getElementById("duracion") as HTMLInputElement
    ).value.trim();

    const calificacion = Number(
        (document.getElementById("calificacion") as HTMLInputElement).value
    );

    const imagen = (
        document.getElementById("imagen") as HTMLInputElement
    ).value.trim();

    const sinopsis = (
        document.getElementById("sinopsis") as HTMLTextAreaElement
    ).value.trim();


    // Crear el nuevo contenido
    crearContenido(
        titulo,
        tipo,
        anio,
        genero,
        duracion,
        calificacion,
        sinopsis,
        imagen
    );


    // Avisar al usuario
    alert("¡Contenido agregado correctamente!");


    // Volver al catálogo
    window.location.href = "catalogo.html";
});