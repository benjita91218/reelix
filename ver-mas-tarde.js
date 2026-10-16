const contenedor = document.getElementById(
    "lista-ver-mas-tarde"
);
function obtenerUsuarioActual() {
    const usuario = localStorage.getItem(
        "reelix_usuario_actual"
    );
    return usuario
        ? encodeURIComponent(usuario.trim().toLowerCase())
        : "invitado";
}
function obtenerClaveLista() {
    return `reelix_ver_mas_tarde_${obtenerUsuarioActual()}`;
}
function obtenerLista() {
    try {
        const datos = localStorage.getItem(obtenerClaveLista());
        if (!datos) {
            return [];
        }
        const lista = JSON.parse(datos);
        return Array.isArray(lista) ? lista : [];
    } catch (error) {
        console.error("Error al leer Ver más tarde:", error);
        return [];
    }
}
function abrirDetalle(contenido) {
    if (contenido.origen === "local") {
        localStorage.removeItem("reelix_tmdb_id");
        localStorage.removeItem("reelix_tmdb_tipo");
        localStorage.setItem(
            "reelix_contenido_seleccionado",
            String(contenido.id)
        );
    } else {
        localStorage.removeItem(
            "reelix_contenido_seleccionado"
        );
        localStorage.setItem(
            "reelix_tmdb_id",
            String(contenido.id)
        );
        localStorage.setItem(
            "reelix_tmdb_tipo",
            contenido.tipoMedia
        );
    }
    window.location.href = "detalle.html";
}
function quitarDeLaLista(clave) {
    const lista = obtenerLista();
    const listaActualizada = lista.filter(
        contenido => contenido.clave !== clave
    );
    try {
        localStorage.setItem(
            obtenerClaveLista(),
            JSON.stringify(listaActualizada)
        );
        mostrarLista();
    } catch (error) {
        console.error("Error al actualizar la lista:", error);
        alert("No se pudo quitar el contenido de la lista.");
    }
}
function mostrarLista() {
    if (!contenedor) {
        return;
    }
    const lista = obtenerLista();
    contenedor.innerHTML = "";
    if (lista.length === 0) {
        const mensaje = document.createElement("p");
        mensaje.classList.add("sin-contenido");
        mensaje.textContent =
            "Todavía no guardaste películas o series para ver más tarde.";
        contenedor.appendChild(mensaje);
        return;
    }
    lista.forEach(contenido => {
        const tarjeta = document.createElement("div");
        tarjeta.classList.add("card");
        const poster = document.createElement("img");
        poster.src = contenido.imagen || "img/sin-poster.jpg";
        poster.alt = `Poster de ${contenido.titulo}`;
        poster.loading = "lazy";
        const informacion = document.createElement("div");
        informacion.classList.add("card-info");
        const titulo = document.createElement("h3");
        titulo.textContent = contenido.titulo || "Sin título";
        const detalles = document.createElement("p");
        detalles.textContent =
            `${contenido.anio || "Sin año"} · ` +
            `${contenido.genero || "Género no disponible"} · ` +
            `⭐ ${contenido.calificacion ?? "Sin calificación"}`;
        const tipo = document.createElement("span");
        tipo.textContent = contenido.etiquetaTipo ||
            (contenido.tipoMedia === "tv" ? "Serie" : "Película");
        const botonDetalle = document.createElement("button");
        botonDetalle.type = "button";
        botonDetalle.textContent = "Ver más";
        botonDetalle.addEventListener("click", () => {
            abrirDetalle(contenido);
        });
        const botonQuitar = document.createElement("button");
        botonQuitar.type = "button";
        botonQuitar.classList.add("btn-indicador");
        botonQuitar.textContent = "Quitar de Ver más tarde";
        botonQuitar.addEventListener("click", () => {
            quitarDeLaLista(contenido.clave);
        });
        informacion.appendChild(titulo);
        informacion.appendChild(detalles);
        informacion.appendChild(tipo);
        informacion.appendChild(botonDetalle);
        informacion.appendChild(botonQuitar);
        tarjeta.appendChild(poster);
        tarjeta.appendChild(informacion);
        contenedor.appendChild(tarjeta);
    });
}
mostrarLista();