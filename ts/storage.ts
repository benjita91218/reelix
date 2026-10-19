// Representa una película o serie dentro de REELIX
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

// Nombre que vamos a utilizar para guardar los contenidos
const CLAVE_STORAGE = "reelix_contenidos";

// Obtener todos los contenidos guardados
export function obtenerContenidos(): Contenido[] {
    const datos = localStorage.getItem(CLAVE_STORAGE);

    if (!datos) {
        return [];
    }

    return JSON.parse(datos);
}

// Guardar todos los contenidos
export function guardarContenidos(contenidos: Contenido[]): void {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(contenidos));
}

// Agregar un nuevo contenido
export function agregarContenido(contenido: Contenido): void {
    const contenidos = obtenerContenidos();

    contenidos.push(contenido);

    guardarContenidos(contenidos);
}

// Buscar un contenido por su ID
export function obtenerContenidoPorId(id: number): Contenido | undefined {
    const contenidos = obtenerContenidos();

    return contenidos.find(contenido => contenido.id === id);
}

// Editar un contenido existente
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

// Eliminar un contenido
export function eliminarContenido(id: number): void {
    const contenidos = obtenerContenidos();

    const contenidosActualizados = contenidos.filter(
        contenido => contenido.id !== id
    );

    guardarContenidos(contenidosActualizados);
}