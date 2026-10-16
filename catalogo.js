import { obtenerContenidos } from "./storage.js";
import { buscarPeliculas } from "./api.js";
const catalogo = document.getElementById("catalogo");
const buscador = document.getElementById("buscador");
const filtroGenero = document.getElementById("filtro-genero");
const filtroTipo = document.getElementById("filtro-tipo");
const filtroAnio = document.getElementById("filtro-anio");
const filtroRating = document.getElementById("filtro-rating");
const GENEROS = {
    12: "Aventura",
    14: "Fantasía",
    16: "Animación",
    18: "Drama",
    27: "Terror",
    28: "Acción",
    35: "Comedia",
    36: "Historia",
    37: "Western",
    53: "Suspenso",
    80: "Crimen",
    99: "Documental",
    878: "Ciencia ficción",
    9648: "Misterio",
    10402: "Música",
    10749: "Romance",
    10751: "Familia",
    10752: "Bélica",
    10759: "Acción y aventura",
    10762: "Infantil",
    10765: "Ciencia ficción y fantasía"
};
function obtenerUsuarioActual() {
    const usuario = localStorage.getItem(
        "reelix_usuario_actual"
    );
    return usuario
        ? encodeURIComponent(usuario.trim().toLowerCase())
        : "invitado";
}
function obtenerClaveLista(nombreLista) {
    return `reelix_${nombreLista}_${obtenerUsuarioActual()}`;
}
function obtenerLista(nombreLista) {
    try {
        const datos = localStorage.getItem(
            obtenerClaveLista(nombreLista)
        );
        if (!datos) {
            return [];
        }
        const lista = JSON.parse(datos);
        return Array.isArray(lista) ? lista : [];
    } catch (error) {
        console.error("Error al leer la lista:", error);
        return [];
    }
}
function guardarLista(nombreLista, lista) {
    try {
        localStorage.setItem(
            obtenerClaveLista(nombreLista),
            JSON.stringify(lista)
        );
        return true;
    } catch (error) {
        console.error("Error al guardar la lista:", error);
        alert("No se pudo guardar el cambio.");
        return false;
    }
}
function estaEnLista(nombreLista, clave) {
    return obtenerLista(nombreLista).some(
        contenido => contenido.clave === clave
    );
}
function alternarLista(nombreLista, contenido) {
    const lista = obtenerLista(nombreLista);
    const yaExiste = lista.some(
        elemento => elemento.clave === contenido.clave
    );
    let listaActualizada;
    if (yaExiste) {
        listaActualizada = lista.filter(
            elemento => elemento.clave !== contenido.clave
        );
    } else {
        listaActualizada = [
            ...lista,
            contenido
        ];
    }
    const guardado = guardarLista(
        nombreLista,
        listaActualizada
    );
    if (guardado) {
        buscarEnTMDB();
    }
}
function normalizar(texto) {
    return String(texto ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}
function obtenerContenidosFiltrados() {
    const contenidos = obtenerContenidos();
    const texto = normalizar(buscador?.value);
    const genero = filtroGenero?.value || "";
    const tipo = filtroTipo?.value || "";
    const anio = filtroAnio?.value || "";
    const rating = filtroRating?.value || "";
    const generoSeleccionado = GENEROS[genero];
    return contenidos.filter(contenido => {
        if (
            texto &&
            !normalizar(contenido.titulo).includes(texto)
        ) {
            return false;
        }
        const tipoContenido = normalizar(contenido.tipo);
        const esSerie =
            tipoContenido.includes("serie") ||
            tipoContenido === "tv";
        const esPelicula =
            tipoContenido.includes("pelicula") ||
            tipoContenido === "movie";
        if (tipo === "movie" && !esPelicula) {
            return false;
        }
        if (tipo === "tv" && !esSerie) {
            return false;
        }
        if (generoSeleccionado) {
            if (
                !normalizar(contenido.genero).includes(
                    normalizar(generoSeleccionado)
                )
            ) {
                return false;
            }
        }
        if (anio) {
            const anioContenido = Number(contenido.anio);
            if (anio.includes("-")) {
                const partes = anio.split("-");
                const desde = Number(partes[0]);
                const hasta = Number(partes[1]);
                if (
                    anioContenido < desde ||
                    anioContenido > hasta
                ) {
                    return false;
                }
            } else if (anioContenido !== Number(anio)) {
                return false;
            }
        }
        if (
            rating !== "" &&
            Number(contenido.calificacion) < Number(rating)
        ) {
            return false;
        }
        return true;
    });
}
function prepararContenidoLocal(contenido) {
    const tipoNormalizado = normalizar(contenido.tipo);
    const tipoMedia =
        tipoNormalizado.includes("serie") ||
        tipoNormalizado === "tv"
            ? "tv"
            : "movie";
    return {
        clave: `local:${contenido.id}`,
        origen: "local",
        id: contenido.id,
        tipoMedia,
        titulo: contenido.titulo,
        anio: contenido.anio,
        genero: contenido.genero,
        calificacion: contenido.calificacion,
        imagen: contenido.imagen,
        etiquetaTipo: contenido.tipo
    };
}
function prepararContenidoTMDB(contenido, tipoSeleccionado) {
    const tipoMedia =
        contenido.media_type === "tv" ||
        tipoSeleccionado === "tv"
            ? "tv"
            : "movie";
    const titulo =
        contenido.title ||
        contenido.name ||
        "Sin título";
    const fecha =
        contenido.release_date ||
        contenido.first_air_date ||
        "";
    const anio = fecha
        ? fecha.substring(0, 4)
        : "Sin año";
    const imagen = contenido.poster_path
        ? `https://image.tmdb.org/t/p/w500${contenido.poster_path}`
        : "img/sin-poster.jpg";
    const genero = (contenido.genre_ids || [])
        .map(id => GENEROS[id])
        .filter(Boolean)
        .slice(0, 2)
        .join(", ") || "Género no disponible";
    const calificacion =
        typeof contenido.vote_average === "number"
            ? contenido.vote_average.toFixed(1)
            : "Sin rating";
    return {
        clave: `tmdb:${tipoMedia}:${contenido.id}`,
        origen: "tmdb",
        id: contenido.id,
        tipoMedia,
        titulo,
        anio,
        genero,
        calificacion,
        imagen,
        etiquetaTipo: tipoMedia === "tv"
            ? "Serie"
            : "Película"
    };
}
function crearTarjeta(contenido) {
    const tarjeta = document.createElement("div");
    tarjeta.classList.add("card");
    const imagen = document.createElement("img");
    imagen.src = contenido.imagen || "img/sin-poster.jpg";
    imagen.alt = `Poster de ${contenido.titulo}`;
    imagen.loading = "lazy";
    const informacion = document.createElement("div");
    informacion.classList.add("card-info");
    const titulo = document.createElement("h3");
    titulo.textContent = contenido.titulo;
    const detalles = document.createElement("p");
    detalles.textContent =
        `${contenido.anio} · ${contenido.genero} · ⭐ ${contenido.calificacion}`;
    const tipo = document.createElement("span");
    tipo.textContent = contenido.etiquetaTipo;
    const botonDetalle = document.createElement("button");
    botonDetalle.type = "button";
    botonDetalle.textContent = "Ver más";
    botonDetalle.addEventListener("click", () => {
        abrirDetalle(contenido);
    });
    const botonVista = document.createElement("button");
    botonVista.type = "button";
    botonVista.classList.add("btn-indicador");
    const yaVista = estaEnLista(
        "vistos",
        contenido.clave
    );
    botonVista.textContent = yaVista
        ? "✓ Ya vista"
        : "Marcar como ya vista";
    if (yaVista) {
        botonVista.classList.add("activo");
    }
    botonVista.setAttribute(
        "aria-pressed",
        String(yaVista)
    );
    botonVista.addEventListener("click", () => {
        alternarLista("vistos", contenido);
    });
    const botonMasTarde = document.createElement("button");
    botonMasTarde.type = "button";
    botonMasTarde.classList.add("btn-indicador");
    const enLista = estaEnLista(
        "ver_mas_tarde",
        contenido.clave
    );
    botonMasTarde.textContent = enLista
        ? "✓ En Ver más tarde"
        : "+ Ver más tarde";
    if (enLista) {
        botonMasTarde.classList.add("activo");
    }
    botonMasTarde.setAttribute(
        "aria-pressed",
        String(enLista)
    );
    botonMasTarde.addEventListener("click", () => {
        alternarLista("ver_mas_tarde", contenido);
    });
    informacion.appendChild(titulo);
    informacion.appendChild(detalles);
    informacion.appendChild(tipo);
    informacion.appendChild(botonDetalle);
    informacion.appendChild(botonVista);
    informacion.appendChild(botonMasTarde);
    tarjeta.appendChild(imagen);
    tarjeta.appendChild(informacion);
    catalogo.appendChild(tarjeta);
}
async function buscarEnTMDB() {
    if (!catalogo) {
        return;
    }
    const texto = buscador?.value.trim() || "";
    const genero = filtroGenero?.value || "";
    const anio = filtroAnio?.value || "";
    const rating = filtroRating?.value || "";
    const tipo = filtroTipo?.value || "";
    catalogo.innerHTML = "";
    const contenidosLocales = obtenerContenidosFiltrados();
    contenidosLocales.forEach(contenido => {
        crearTarjeta(prepararContenidoLocal(contenido));
    });
    try {
        const resultados = await buscarPeliculas(
            texto,
            genero,
            anio,
            rating,
            tipo
        );
        resultados.forEach(contenido => {
            const contenidoPreparado = prepararContenidoTMDB(
                contenido,
                tipo
            );
            crearTarjeta(contenidoPreparado);
        });
        if (
            contenidosLocales.length === 0 &&
            resultados.length === 0
        ) {
            catalogo.innerHTML = `
                <p class="sin-contenido">
                    No se encontraron películas o series.
                </p>
            `;
        }
    } catch (error) {
        console.error("Error al buscar en TMDB:", error);
        if (contenidosLocales.length === 0) {
            catalogo.innerHTML = `
                <p class="sin-contenido">
                    No se pudo conectar con TMDB.
                </p>
            `;
        }
    }
}
function abrirDetalle(contenido) {
    if (contenido.origen === "local") {
        localStorage.removeItem("reelix_tmdb_id");
        localStorage.removeItem("reelix_tmdb_tipo");
        localStorage.setItem(
            "reelix_contenido_seleccionado",
            contenido.id.toString()
        );
    } else {
        localStorage.removeItem("reelix_contenido_seleccionado");
        localStorage.setItem(
            "reelix_tmdb_id",
            contenido.id.toString()
        );
        localStorage.setItem(
            "reelix_tmdb_tipo",
            contenido.tipoMedia
        );
    }
    window.location.href = "detalle.html";
}
window.verDetalle = function(id) {
    localStorage.removeItem("reelix_tmdb_id");
    localStorage.removeItem("reelix_tmdb_tipo");
    localStorage.setItem(
        "reelix_contenido_seleccionado",
        id.toString()
    );
    window.location.href = "detalle.html";
};
window.verDetalleTMDB = function(id, tipo) {
    localStorage.removeItem("reelix_contenido_seleccionado");
    localStorage.setItem(
        "reelix_tmdb_id",
        id.toString()
    );
    localStorage.setItem(
        "reelix_tmdb_tipo",
        tipo
    );
    window.location.href = "detalle.html";
};
buscador?.addEventListener("input", buscarEnTMDB);
filtroGenero?.addEventListener("change", buscarEnTMDB);
filtroTipo?.addEventListener("change", buscarEnTMDB);
filtroAnio?.addEventListener("change", buscarEnTMDB);
filtroRating?.addEventListener("change", buscarEnTMDB);
buscarEnTMDB();