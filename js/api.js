const API_KEY = "TU_API_KEY_DE_TMDB";

const URL_BASE = "https://api.themoviedb.org/3";

export async function buscarPeliculas(
    consulta,
    genero = "",
    anio = "",
    rating = "",
    tipo = ""
) {

    // Por defecto buscamos películas
    let endpoint = "/discover/movie";

    // Si se seleccionan series
    if (tipo === "tv") {
        endpoint = "/discover/tv";
    }

    let url =
        `${URL_BASE}${endpoint}?api_key=${API_KEY}` +
        `&language=es-ES` +
        `&sort_by=popularity.desc`;

    // ------------------------------------------------
    // BÚSQUEDA POR TÍTULO
    // ------------------------------------------------

    if (consulta.trim() !== "") {

        const endpointBusqueda =
            tipo === "tv"
                ? "/search/tv"
                : "/search/movie";

        url =
            `${URL_BASE}${endpointBusqueda}?api_key=${API_KEY}` +
            `&query=${encodeURIComponent(consulta)}` +
            `&language=es-ES`;

        // Año
        if (anio !== "") {

            if (anio.includes("-")) {

                const partes = anio.split("-");
                const desde = partes[0];
                const hasta = partes[1];

                if (tipo === "tv") {

                    url +=
                        `&first_air_date.gte=${desde}-01-01` +
                        `&first_air_date.lte=${hasta}-12-31`;

                } else {

                    url +=
                        `&primary_release_date.gte=${desde}-01-01` +
                        `&primary_release_date.lte=${hasta}-12-31`;
                }

            } else {

                if (tipo === "tv") {
                    url += `&first_air_date_year=${anio}`;
                } else {
                    url += `&primary_release_year=${anio}`;
                }
            }
        }

    } else {

        // ------------------------------------------------
        // FILTROS SIN BÚSQUEDA
        // ------------------------------------------------

        // Género
        if (genero !== "") {
            url += `&with_genres=${genero}`;
        }

        // Año
        if (anio !== "") {

            if (anio.includes("-")) {

                const partes = anio.split("-");
                const desde = partes[0];
                const hasta = partes[1];

                if (tipo === "tv") {

                    url +=
                        `&first_air_date.gte=${desde}-01-01` +
                        `&first_air_date.lte=${hasta}-12-31`;

                } else {

                    url +=
                        `&primary_release_date.gte=${desde}-01-01` +
                        `&primary_release_date.lte=${hasta}-12-31`;
                }

            } else {

                if (tipo === "tv") {
                    url += `&first_air_date_year=${anio}`;
                } else {
                    url += `&primary_release_year=${anio}`;
                }
            }
        }

        // Calificación
        if (rating !== "") {
            url += `&vote_average.gte=${rating}`;
        }
    }

    const respuesta = await fetch(url);

    if (!respuesta.ok) {
        throw new Error("Error al consultar la API de TMDB");
    }

    const datos = await respuesta.json();

    return datos.results;
}

// ======================================================
// OBTENER DETALLE DE UNA PELÍCULA O SERIE
// ======================================================

export async function obtenerDetalleTMDB(id, tipo) {

    const endpoint = tipo === "tv"
        ? `/tv/${id}`
        : `/movie/${id}`;

    const url =
        `${URL_BASE}${endpoint}?api_key=${API_KEY}` +
        `&language=es-ES`;

    const respuesta = await fetch(url);

    if (!respuesta.ok) {
        throw new Error(
            `Error al obtener el detalle de TMDB: ${respuesta.status}`
        );
    }

    return await respuesta.json();
}