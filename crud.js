import { obtenerContenidos, agregarContenido, editarContenido, eliminarContenido } from "./storage.js";
export function generarId() {
    const contenidos = obtenerContenidos();
    if (contenidos.length === 0) {
        return 1;
    }
    return Math.max(...contenidos.map(contenido => contenido.id)) + 1;
}
export function crearContenido(titulo, tipo, anio, genero, duracion, calificacion, sinopsis, imagen) {
    const nuevoContenido = {
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
export function actualizarContenido(contenido) {
    editarContenido(contenido);
}
export function borrarContenido(id) {
    eliminarContenido(id);
}