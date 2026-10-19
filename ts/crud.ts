import {
    Contenido,
    obtenerContenidos,
    agregarContenido,
    editarContenido,
    eliminarContenido
} from "./storage.js";

// Generar un ID único para cada contenido
export function generarId(): number {
    const contenidos = obtenerContenidos();

    if (contenidos.length === 0) {
        return 1;
    }

    return Math.max(...contenidos.map(contenido => contenido.id)) + 1;
}

// Crear un nuevo contenido
export function crearContenido(
    titulo: string,
    tipo: string,
    anio: number,
    genero: string,
    duracion: string,
    calificacion: number,
    sinopsis: string,
    imagen: string
): void {

    const nuevoContenido: Contenido = {
        id: generarId(),
        titulo,
        tipo,
        anio,
        genero,
        duracion,
        calificacion,
        sinopsis,
        imagen
    };

    agregarContenido(nuevoContenido);
}

// Actualizar un contenido existente
export function actualizarContenido(contenido: Contenido): void {
    editarContenido(contenido);
}

// Borrar un contenido
export function borrarContenido(id: number): void {
    eliminarContenido(id);
}