const CLAVE_STORAGE = "reelix_contenidos";
export function obtenerContenidos() {
    const datos = localStorage.getItem(CLAVE_STORAGE);
    if (!datos) {
        return [];
    }
    return JSON.parse(datos);
}
export function guardarContenidos(contenidos) {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(contenidos));
}
export function agregarContenido(contenido) {
    const contenidos = obtenerContenidos();
    contenidos.push(contenido);
    guardarContenidos(contenidos);
}
export function obtenerContenidoPorId(id) {
    const contenidos = obtenerContenidos();
    return contenidos.find(contenido => contenido.id === id);
}
export function editarContenido(contenidoEditado) {
    const contenidos = obtenerContenidos();
    const indice = contenidos.findIndex(contenido => contenido.id === contenidoEditado.id);
    if (indice !== -1) {
        contenidos[indice] = contenidoEditado;
        guardarContenidos(contenidos);
    }
}
export function eliminarContenido(id) {
    const contenidos = obtenerContenidos();
    const contenidosActualizados = contenidos.filter(contenido => contenido.id !== id);
    guardarContenidos(contenidosActualizados);
}