export interface Contenido {
    id: number;
    titulo: string;
    tipo: string;
    anio: number;
    genero: string;
    duracion: string;
    calificacion: number;
    sinopsis: string;
    imagen: string;
}
const CLAVE_STORAGE = "reelix_contenidos";
export function obtenerContenidos(): Contenido[] {
    const datos = localStorage.getItem(CLAVE_STORAGE);
    if (!datos) {
        return [];
    }
    return JSON.parse(datos);
}
export function guardarContenidos(contenidos: Contenido[]): void {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(contenidos));
}
export function agregarContenido(contenido: Contenido): void {
    const contenidos = obtenerContenidos();
    contenidos.push(contenido);
    guardarContenidos(contenidos);
}
export function obtenerContenidoPorId(id: number): Contenido | undefined {
    const contenidos = obtenerContenidos();
    return contenidos.find(contenido => contenido.id === id);
}
export function editarContenido(contenidoEditado: Contenido): void {
    const contenidos = obtenerContenidos();
    const indice = contenidos.findIndex(
        contenido => contenido.id === contenidoEditado.id
    );
    if (indice !== -1) {
        contenidos[indice] = contenidoEditado;
        guardarContenidos(contenidos);
    }
}
export function eliminarContenido(id: number): void {
    const contenidos = obtenerContenidos();
    const contenidosActualizados = contenidos.filter(
        contenido => contenido.id !== id
    );
    guardarContenidos(contenidosActualizados);
}