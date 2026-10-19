import { obtenerContenidoPorId } from "./storage.js";
import { borrarContenido } from "./crud.js";
import { obtenerDetalleTMDB } from "./api.js";


// ======================================================
// IDENTIFICAR EL CONTENIDO SELECCIONADO
// ======================================================

const idLocal = localStorage.getItem(
    "reelix_contenido_seleccionado"
);

const idTMDB = localStorage.getItem(
    "reelix_tmdb_id"
);

const tipoTMDB = localStorage.getItem(
    "reelix_tmdb_tipo"
);


// ======================================================
// ELEMENTOS DEL HTML
// ======================================================

const titulo = document.getElementById("detalle-titulo");
const imagen = document.getElementById("detalle-imagen");
const tipo = document.getElementById("detalle-tipo");
const anio = document.getElementById("detalle-anio");
const genero = document.getElementById("detalle-genero");
const duracion = document.getElementById("detalle-duracion");
const calificacion = document.getElementById("detalle-calificacion");
const sinopsis = document.getElementById("detalle-sinopsis");

const botonEliminar = document.getElementById("btn-eliminar");
const botonEditar = document.getElementById("btn-editar");


// ======================================================
// CONTROLAR LA VISIBILIDAD DE LOS BOTONES
// ======================================================

function ocultarAcciones() {

    if (botonEditar) {
        botonEditar.style.setProperty(
            "display",
            "none",
            "important"
        );
    }

    if (botonEliminar) {
        botonEliminar.style.setProperty(
            "display",
            "none",
            "important"
        );
    }
}


function mostrarAccionesPropias() {

    if (botonEditar) {
        botonEditar.style.removeProperty("display");
    }

    if (botonEliminar) {
        botonEliminar.style.removeProperty("display");
    }
}


// Ocultar los botones desde el inicio.
// Solo se mostrarán cuando confirmemos que es contenido propio.

ocultarAcciones();


// ======================================================
// MOSTRAR CONTENIDO GUARDADO EN LOCALSTORAGE
// ======================================================

function mostrarContenidoLocal(id) {

    const contenido = obtenerContenidoPorId(id);

    if (!contenido) {
        ocultarAcciones();
        window.location.href = "catalogo.html";
        return;
    }

    // El contenido existe en el catálogo propio.
    mostrarAccionesPropias();


    // Título

    if (titulo) {
        titulo.textContent = contenido.titulo;
    }


    // Poster

    if (imagen) {
        imagen.src = contenido.imagen || "img/sin-poster.jpg";
        imagen.alt = `Poster de ${contenido.titulo}`;
    }


    // Tipo

    if (tipo) {
        tipo.textContent = contenido.tipo;
    }


    // Año

    if (anio) {
        anio.textContent = String(contenido.anio);
    }


    // Género

    if (genero) {
        genero.textContent = contenido.genero;
    }


    // Duración

    if (duracion) {
        duracion.textContent = contenido.duracion;
    }


    // Calificación

    if (calificacion) {
        calificacion.textContent = String(contenido.calificacion);
    }


    // Sinopsis

    if (sinopsis) {
        sinopsis.textContent = contenido.sinopsis;
    }


    // ==================================================
    // ELIMINAR CONTENIDO PROPIO
    // ==================================================

    if (botonEliminar) {

        botonEliminar.addEventListener("click", () => {

            const confirmar = confirm(
                `¿Seguro que querés eliminar "${contenido.titulo}"?`
            );

            if (!confirmar) {
                return;
            }

            borrarContenido(id);

            localStorage.removeItem(
                "reelix_contenido_seleccionado"
            );

            alert("¡Contenido eliminado correctamente!");

            window.location.href = "catalogo.html";
        });
    }
}


// ======================================================
// MOSTRAR DETALLE DE TMDB
// ======================================================

async function mostrarDetalleTMDB(id, tipoContenido) {

    // Estos contenidos no pertenecen al catálogo propio.
    // Mantener ambos botones ocultos durante toda la carga.

    ocultarAcciones();

    try {

        const contenido = await obtenerDetalleTMDB(
            id,
            tipoContenido
        );


        // Título

        const nombre =
            contenido.title ||
            contenido.name ||
            "Sin título";


        // Año

        const fecha =
            contenido.release_date ||
            contenido.first_air_date ||
            "";

        const anioContenido = fecha
            ? fecha.substring(0, 4)
            : "Sin año";


        // Géneros

        const generos = Array.isArray(contenido.genres)
            ? contenido.genres
                .map(item => item.name)
                .join(", ")
            : "No disponibles";


        // Calificación

        const nota =
            typeof contenido.vote_average === "number"
                ? contenido.vote_average.toFixed(1)
                : "Sin calificación";


        // Poster

        const poster = contenido.poster_path
            ? `https://image.tmdb.org/t/p/w500${contenido.poster_path}`
            : "img/sin-poster.jpg";


        // Duración

        let duracionContenido = "No disponible";

        if (tipoContenido === "movie") {

            if (contenido.runtime) {
                duracionContenido =
                    `${contenido.runtime} minutos`;
            }

        } else {

            if (
                Array.isArray(contenido.episode_run_time) &&
                contenido.episode_run_time.length > 0
            ) {
                duracionContenido =
                    `${contenido.episode_run_time[0]} minutos por episodio`;
            }
        }


        // Sinopsis

        const descripcion =
            contenido.overview ||
            "No hay una sinopsis disponible.";


        // ==================================================
        // MOSTRAR LOS DATOS EN LA PÁGINA
        // ==================================================

        if (titulo) {
            titulo.textContent = nombre;
        }

        if (imagen) {
            imagen.src = poster;
            imagen.alt = `Poster de ${nombre}`;
        }

        if (tipo) {
            tipo.textContent =
                tipoContenido === "tv"
                    ? "Serie"
                    : "Película";
        }

        if (anio) {
            anio.textContent = anioContenido;
        }

        if (genero) {
            genero.textContent = generos;
        }

        if (duracion) {
            duracion.textContent = duracionContenido;
        }

        if (calificacion) {
            calificacion.textContent = nota;
        }

        if (sinopsis) {
            sinopsis.textContent = descripcion;
        }

        // Reforzar que TMDB no puede editarse ni eliminarse.
        ocultarAcciones();

    } catch (error) {

        // Ante un error, los botones permanecen ocultos.
        ocultarAcciones();

        console.error(
            "Error al cargar el detalle de TMDB:",
            error
        );

        alert(
            "No se pudo cargar la información. Revisá la conexión e intentá nuevamente."
        );

        window.location.href = "catalogo.html";
    }
}


// ======================================================
// DECIDIR QUÉ CONTENIDO MOSTRAR
// ======================================================

if (idTMDB && tipoTMDB) {

    // Contenido proveniente de TMDB.

    mostrarDetalleTMDB(
        Number(idTMDB),
        tipoTMDB
    );

} else if (idLocal) {

    // Contenido creado por el usuario.

    mostrarContenidoLocal(
        Number(idLocal)
    );

} else {

    // No hay un contenido válido seleccionado.

    ocultarAcciones();
    window.location.href = "catalogo.html";
}