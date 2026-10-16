console.log("CATALOGO.TS SE ESTÁ EJECUTANDO");
import { obtenerContenidos, Contenido } from "./storage.js";
import { buscarPeliculas } from "./api.js";
const catalogo = document.getElementById("catalogo");
const buscador = document.getElementById("buscador") as HTMLInputElement;
const filtroGenero = document.getElementById("filtro-genero") as HTMLSelectElement;
const filtroTipo = document.getElementById("filtro-tipo") as HTMLSelectElement;
const filtroAnio = document.getElementById("filtro-anio") as HTMLSelectElement;
const filtroRating = document.getElementById("filtro-rating") as HTMLSelectElement;
function mostrarContenidos(): void {
    if (!catalogo) return;
    const contenidos: Contenido[] = obtenerContenidos();
    const textoBusqueda = buscador.value.toLowerCase().trim();
    const generoSeleccionado = filtroGenero.value;
    const tipoSeleccionado = filtroTipo.value;
    const anioSeleccionado = filtroAnio.value;
    const ratingSeleccionado = filtroRating.value;
    const contenidosFiltrados = contenidos.filter((contenido) => {
        const coincideBusqueda =
            contenido.titulo.toLowerCase().includes(textoBusqueda);
        const coincideGenero =
            generoSeleccionado === "" ||
            contenido.genero === generoSeleccionado;
        const coincideTipo =
            tipoSeleccionado === "" ||
            contenido.tipo === tipoSeleccionado;
        let coincideAnio = true;
        if (anioSeleccionado !== "") {
            const anio = contenido.anio;
            const filtro = Number(anioSeleccionado);
            if (filtro >= 2010 && filtro <= 2020) {
                coincideAnio = anio === filtro;
            } else {
                coincideAnio =
                    anio >= filtro &&
                    anio <= filtro + 9;
            }
        }
        const coincideRating =
            ratingSeleccionado === "" ||
            contenido.calificacion >= Number(ratingSeleccionado);
        return (
            coincideBusqueda &&
            coincideGenero &&
            coincideTipo &&
            coincideAnio &&
            coincideRating
        );
    });
    catalogo.innerHTML = "";
    if (contenidosFiltrados.length === 0) {
        catalogo.innerHTML = `
            <p class="sin-contenido">
                No se encontraron películas o series.
            </p>
        `;
        return;
    }
    contenidosFiltrados.forEach((contenido) => {
        const tarjeta = document.createElement("div");
        tarjeta.classList.add("card");
        tarjeta.innerHTML = `
            <img
                src="${contenido.imagen}"
                alt="Poster de ${contenido.titulo}"
            >
            <div class="card-info">
                <h3>${contenido.titulo}</h3>
                <p>
                    ${contenido.anio} ·
                    ${contenido.genero} ·
                    ⭐ ${contenido.calificacion}
                </p>
                <span>${contenido.tipo}</span>
                <button onclick="verDetalle(${contenido.id})">
                    Ver más
                </button>
            </div>
        `;
        catalogo.appendChild(tarjeta);
    });
}
function verDetalle(id: number): void {
    localStorage.setItem(
        "reelix_contenido_seleccionado",
        id.toString()
    );
    window.location.href = "detalle.html";
}
(window as any).verDetalle = verDetalle;
buscador.addEventListener("input", mostrarContenidos);
filtroGenero.addEventListener("change", mostrarContenidos);
filtroTipo.addEventListener("change", mostrarContenidos);
filtroAnio.addEventListener("change", mostrarContenidos);
filtroRating.addEventListener("change", mostrarContenidos);
mostrarContenidos();
async function probarAPI(): Promise<void> {
    try {
        const resultados = await buscarPeliculas("Interstellar");
        console.log("Resultados de TMDB:");
        console.log(resultados);
    } catch (error) {
        console.error("Error al conectar con TMDB:", error);
    }
}
probarAPI();