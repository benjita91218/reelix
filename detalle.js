import { obtenerContenidoPorId } from "./storage.js";
import { borrarContenido } from "./crud.js";
import { obtenerDetalleTMDB } from "./api.js";
const idLocal = localStorage.getItem(
    "reelix_contenido_seleccionado"
);
const idTMDB = localStorage.getItem(
    "reelix_tmdb_id"
);
const tipoTMDB = localStorage.getItem(
    "reelix_tmdb_tipo"
);
const titulo = document.getElementById("detalle-titulo");
const imagen = document.getElementById("detalle-imagen");
const tipo = document.getElementById("detalle-tipo");
const anio = document.getElementById("detalle-anio");
const genero = document.getElementById("detalle-genero");
const duracion = document.getElementById("detalle-duracion");
const calificacion = document.getElementById("detalle-calificacion");
const sinopsis = document.getElementById("detalle-sinopsis");
const botonEliminar = document.getElementById("btn-eliminar");
function mostrarContenidoLocal(id) {
    const contenido = obtenerContenidoPorId(id);
    if (!contenido) {
        window.location.href = "catalogo.html";
        return;
    }
    if (titulo) {
        titulo.textContent = contenido.titulo;
    }
    if (imagen) {
        imagen.src = contenido.imagen || "img/sin-poster.jpg";
        imagen.alt = `Poster de ${contenido.titulo}`;
    }
    if (tipo) {
        tipo.textContent = contenido.tipo;
    }
    if (anio) {
        anio.textContent = String(contenido.anio);
    }
    if (genero) {
        genero.textContent = contenido.genero;
    }
    if (duracion) {
        duracion.textContent = contenido.duracion;
    }
    if (calificacion) {
        calificacion.textContent = String(contenido.calificacion);
    }
    if (sinopsis) {
        sinopsis.textContent = contenido.sinopsis;
    }
    botonEliminar?.addEventListener("click", () => {
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
async function mostrarDetalleTMDB(id, tipoContenido) {
    try {
        const contenido = await obtenerDetalleTMDB(
            id,
            tipoContenido
        );
        const nombre =
            contenido.title ||
            contenido.name ||
            "Sin título";
        const fecha =
            contenido.release_date ||
            contenido.first_air_date ||
            "";
        const anioContenido = fecha
            ? fecha.substring(0, 4)
            : "Sin año";
        const generos = Array.isArray(contenido.genres)
            ? contenido.genres
                .map(item => item.name)
                .join(", ")
            : "No disponibles";
        const nota =
            typeof contenido.vote_average === "number"
                ? contenido.vote_average.toFixed(1)
                : "Sin calificación";
        const poster = contenido.poster_path
            ? `https://image.tmdb.org/t/p/w500${contenido.poster_path}`
            : "img/sin-poster.jpg";
        let duracionContenido = "No disponible";
        if (tipoContenido === "movie") {
            if (contenido.runtime) {
                duracionContenido = `${contenido.runtime} minutos`;
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
        const descripcion =
            contenido.overview ||
            "No hay una sinopsis disponible.";
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
        if (botonEliminar) {
            botonEliminar.style.display = "none";
        }
    } catch (error) {
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
if (idTMDB && tipoTMDB) {
    mostrarDetalleTMDB(
        Number(idTMDB),
        tipoTMDB
    );
} else if (idLocal) {
    mostrarContenidoLocal(
        Number(idLocal)
    );
} else {
    window.location.href = "catalogo.html";
}