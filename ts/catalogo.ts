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

        // Buscar por título
        const coincideBusqueda =
            contenido.titulo.toLowerCase().includes(textoBusqueda);


        // Filtrar por género
        const coincideGenero =
            generoSeleccionado === "" ||
            contenido.genero === generoSeleccionado;


        // Filtrar por tipo
        const coincideTipo =
            tipoSeleccionado === "" ||
            contenido.tipo === tipoSeleccionado;


        // Filtrar por año
        let coincideAnio = true;

        if (anioSeleccionado !== "") {

            const anio = contenido.anio;
            const filtro = Number(anioSeleccionado);

            // Años específicos: 2010 a 2020
            if (filtro >= 2010 && filtro <= 2020) {

                coincideAnio = anio === filtro;

            } else {

                // Décadas: 1970-1979, 1980-1989,
                // 1990-1999 y 2000-2009
                coincideAnio =
                    anio >= filtro &&
                    anio <= filtro + 9;
            }
        }


        // Filtrar por calificación
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


    // Si no hay resultados
    if (contenidosFiltrados.length === 0) {

        catalogo.innerHTML = `
            <p class="sin-contenido">
                No se encontraron películas o series.
            </p>
        `;

        return;
    }


    // Mostrar resultados
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


// Escuchar cambios en los filtros
buscador.addEventListener("input", mostrarContenidos);

filtroGenero.addEventListener("change", mostrarContenidos);

filtroTipo.addEventListener("change", mostrarContenidos);

filtroAnio.addEventListener("change", mostrarContenidos);

filtroRating.addEventListener("change", mostrarContenidos);


// Mostrar contenido al cargar la página
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