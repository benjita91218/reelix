interface Usuario {
    usuario: string;
    email: string;
    password: string;
}
const formulario = document.getElementById(
    "loginForm"
) as HTMLFormElement | null;
if (formulario) {
    formulario.addEventListener("submit", (evento: SubmitEvent) => {
        evento.preventDefault();
        const campoUsuario = document.getElementById(
            "usuario"
        ) as HTMLInputElement;
        const campoPassword = document.getElementById(
            "password"
        ) as HTMLInputElement;
        const identificador = campoUsuario.value.trim().toLowerCase();
        const password = campoPassword.value;
        if (!identificador || !password) {
            alert("Completá el usuario y la contraseña.");
            return;
        }
        let usuarios: Usuario[];
        try {
            const datos = localStorage.getItem("reelix_usuarios");
            usuarios = datos ? JSON.parse(datos) as Usuario[] : [];
            if (!Array.isArray(usuarios)) {
                throw new Error("Datos de usuarios inválidos.");
            }
        } catch {
            alert("No se pudieron leer las cuentas registradas.");
            return;
        }
        const cuenta = usuarios.find((usuario) =>
            usuario.usuario.toLowerCase() === identificador ||
            usuario.email.toLowerCase() === identificador
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
export {};