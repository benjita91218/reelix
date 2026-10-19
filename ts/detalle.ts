import { obtenerContenidoPorId } from "./storage.js";
import { borrarContenido } from "./crud.js";

const idGuardado = localStorage.getItem("reelix_contenido_seleccionado");

if (!idGuardado) {
    window.location.href = "catalogo.html";
} else {

    const id = Number(idGuardado);
    const contenido = obtenerContenidoPorId(id);

    if (!contenido) {
        window.location.href = "catalogo.html";
    } else {

        const titulo = document.getElementById("detalle-titulo");
        const imagen = document.getElementById("detalle-imagen") as HTMLImageElement;
        const tipo = document.getElementById("detalle-tipo");
        const anio = document.getElementById("detalle-anio");
        const genero = document.getElementById("detalle-genero");
        const duracion = document.getElementById("detalle-duracion");
        const calificacion = document.getElementById("detalle-calificacion");
        const sinopsis = document.getElementById("detalle-sinopsis");
        const botonEliminar = document.getElementById("btn-eliminar");

        if (titulo) titulo.textContent = contenido.titulo;

        if (imagen) {
            imagen.src = contenido.imagen;
            imagen.alt = `Poster de ${contenido.titulo}`;
        }

        if (tipo) tipo.textContent = contenido.tipo;
        if (anio) anio.textContent = contenido.anio.toString();
        if (genero) genero.textContent = contenido.genero;
        if (duracion) duracion.textContent = contenido.duracion;
        if (calificacion) calificacion.textContent = contenido.calificacion.toString();
        if (sinopsis) sinopsis.textContent = contenido.sinopsis;

        // Eliminar contenido
        botonEliminar?.addEventListener("click", () => {

            const confirmar = confirm(
                `¿Seguro que querés eliminar "${contenido.titulo}"?`
            );

            if (!confirmar) return;

            borrarContenido(id);

            alert("¡Contenido eliminado correctamente!");

            localStorage.removeItem("reelix_contenido_seleccionado");

            window.location.href = "catalogo.html";
        });
    }
}