const API_KEY = "TU_API_KEY_DE_TMDB";

const URL_BASE = "https://api.themoviedb.org/3";

export async function buscarPeliculas(
    consulta: string
): Promise<any[]> {

    const url =
        `${URL_BASE}/search/movie?api_key=${API_KEY}` +
        `&query=${encodeURIComponent(consulta)}` +
        `&language=es-ES`;

    const respuesta = await fetch(url);

    if (!respuesta.ok) {
        throw new Error("Error al consultar la API de TMDB");
    }

    const datos = await respuesta.json();

    return datos.results;
}