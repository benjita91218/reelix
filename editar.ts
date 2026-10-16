import { obtenerContenidoPorId } from "./storage.js";
import { actualizarContenido } from "./crud.js";
const idGuardado = localStorage.getItem("reelix_contenido_seleccionado");
if (!idGuardado) {
    window.location.href = "catalogo.html";
} else {
    const id = Number(idGuardado);
    const contenido = obtenerContenidoPorId(id);
    if (!contenido) {
        window.location.href = "catalogo.html";
    } else {
        const titulo = document.getElementById("titulo") as HTMLInputElement;
        const tipo = document.getElementById("tipo") as HTMLSelectElement;
        const anio = document.getElementById("anio") as HTMLInputElement;
        const genero = document.getElementById("genero") as HTMLSelectElement;
        const duracion = document.getElementById("duracion") as HTMLInputElement;
        const calificacion = document.getElementById("calificacion") as HTMLInputElement;
        const imagen = document.getElementById("imagen") as HTMLInputElement;
        const sinopsis = document.getElementById("sinopsis") as HTMLTextAreaElement;
        const formulario = document.getElementById("form-editar") as HTMLFormElement;
        titulo.value = contenido.titulo;
        tipo.value = contenido.tipo;
        anio.value = contenido.anio.toString();
        genero.value = contenido.genero;
        duracion.value = contenido.duracion;
        calificacion.value = contenido.calificacion.toString();
        imagen.value = contenido.imagen;
        sinopsis.value = contenido.sinopsis;
        formulario.addEventListener("submit", (evento) => {
            evento.preventDefault();
            contenido.titulo = titulo.value.trim();
            contenido.tipo = tipo.value;
            contenido.anio = Number(anio.value);
            contenido.genero = genero.value;
            contenido.duracion = duracion.value.trim();
            contenido.calificacion = Number(calificacion.value);
            contenido.imagen = imagen.value.trim();
            contenido.sinopsis = sinopsis.value.trim();
            actualizarContenido(contenido);
            alert("¡Contenido actualizado correctamente!");
            window.location.href = "detalle.html";
        });
    }
}