const API_KEY = "43273891784fd3009a645cd646db77d5";
const URL_BASE = "https://api.themoviedb.org/3";
export async function buscarPeliculas(
    consulta,
    genero = "",
    anio = "",
    rating = "",
    tipo = ""
) {
    let endpoint = "/discover/movie";
    if (tipo === "tv") {
        endpoint = "/discover/tv";
    }
    let url =
        `${URL_BASE}${endpoint}?api_key=${API_KEY}` +
        `&language=es-ES` +
        `&sort_by=popularity.desc`;
    if (consulta.trim() !== "") {
        const endpointBusqueda =
            tipo === "tv"
                ? "/search/tv"
                : "/search/movie";
        url =
            `${URL_BASE}${endpointBusqueda}?api_key=${API_KEY}` +
            `&query=${encodeURIComponent(consulta)}` +
            `&language=es-ES`;
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
        if (genero !== "") {
            url += `&with_genres=${genero}`;
        }
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