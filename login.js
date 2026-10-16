const formulario = document.getElementById("loginForm");
if (formulario) {
    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();
        const campoUsuario = document.getElementById("usuario");
        const campoPassword = document.getElementById("password");
        const identificador = campoUsuario.value.trim().toLowerCase();
        const password = campoPassword.value;
        if (!identificador || !password) {
            alert("Completá el usuario y la contraseña.");
            return;
        }
        let usuarios;
        try {
            const datos = localStorage.getItem("reelix_usuarios");
            usuarios = datos ? JSON.parse(datos) : [];
            if (!Array.isArray(usuarios)) {
                throw new Error("Datos de usuarios inválidos.");
            }
        } catch {
            alert("No se pudieron leer las cuentas registradas.");
            return;
        }
        const cuenta = usuarios.find((usuario) =>
            typeof usuario.usuario === "string" &&
            typeof usuario.email === "string" &&
            typeof usuario.password === "string" &&
            (
                usuario.usuario.toLowerCase() === identificador ||
                usuario.email.toLowerCase() === identificador
            )
        );
        if (!cuenta || cuenta.password !== password) {
            alert("Usuario o contraseña incorrectos.");
            return;
        }
        localStorage.setItem(
            "reelix_usuario_actual",
            cuenta.usuario
        );
        window.location.href = "catalogo.html";
    });
}