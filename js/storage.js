// Nombre que vamos a utilizar para guardar los contenidos
const CLAVE_STORAGE = "reelix_contenidos";
// Obtener todos los contenidos guardados
export function obtenerContenidos() {
    const datos = localStorage.getItem(CLAVE_STORAGE);
    if (!datos) {
        return [];
    }
    return JSON.parse(datos);
}
// Guardar todos los contenidos
export function guardarContenidos(contenidos) {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(contenidos));
}
// Agregar un nuevo contenido
export function agregarContenido(contenido) {
    const contenidos = obtenerContenidos();
    contenidos.push(contenido);
    guardarContenidos(contenidos);
}
// Buscar un contenido por su ID
export function obtenerContenidoPorId(id) {
    const contenidos = obtenerContenidos();
    return contenidos.find(contenido => contenido.id === id);
}
// Editar un contenido existente
export function editarContenido(contenidoEditado) {
    const contenidos = obtenerContenidos();
    const indice = contenidos.findIndex(contenido => contenido.id === contenidoEditado.id);
    if (indice !== -1) {
        contenidos[indice] = contenidoEditado;
        guardarContenidos(contenidos);
    }
}
// Eliminar un contenido
export function eliminarContenido(id) {
    const contenidos = obtenerContenidos();
    const contenidosActualizados = contenidos.filter(contenido => contenido.id !== id);
    guardarContenidos(contenidosActualizados);
}
