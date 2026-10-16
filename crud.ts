import {
    Contenido,
    obtenerContenidos,
    agregarContenido,
    editarContenido,
    eliminarContenido
} from "./storage.js";
export function generarId(): number {
    const contenidos = obtenerContenidos();
    if (contenidos.length === 0) {
        return 1;
    }
    return Math.max(...contenidos.map(contenido => contenido.id)) + 1;
}
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
export function actualizarContenido(contenido: Contenido): void {
    editarContenido(contenido);
}
export function borrarContenido(id: number): void {
    eliminarContenido(id);
}