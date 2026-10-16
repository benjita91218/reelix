interface Usuario {
    usuario: string;
    email: string;
    password: string;
}
const CLAVE_USUARIOS = "reelix_usuarios";
const formulario = document.getElementById(
    "registroForm"
) as HTMLFormElement | null;
if (formulario) {
    formulario.addEventListener("submit", (evento: SubmitEvent) => {
        evento.preventDefault();
        const campoUsuario = document.getElementById(
            "usuario"
        ) as HTMLInputElement;
        const campoEmail = document.getElementById(
            "email"
        ) as HTMLInputElement;
        const campoPassword = document.getElementById(
            "password"
        ) as HTMLInputElement;
        const campoConfirmacion = document.getElementById(
            "confirmPassword"
        ) as HTMLInputElement;
        const usuario = campoUsuario.value.trim();
        const email = campoEmail.value.trim().toLowerCase();
        const password = campoPassword.value;
        const confirmacion = campoConfirmacion.value;
        if (!usuario || !email || !password || !confirmacion) {
            alert("Completá todos los campos.");
            return;
        }
        if (!campoEmail.validity.valid) {
            alert("Ingresá un correo electrónico válido.");
            campoEmail.focus();
            return;
        }
        if (password.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres.");
            campoPassword.focus();
            return;
        }
        if (password !== confirmacion) {
            alert("Las contraseñas no coinciden.");
            campoConfirmacion.focus();
            return;
        }
        let usuarios: Usuario[] = [];
        try {
            const datos = localStorage.getItem(CLAVE_USUARIOS);
            usuarios = datos ? JSON.parse(datos) as Usuario[] : [];
            if (!Array.isArray(usuarios)) {
                throw new Error("Formato de usuarios inválido.");
            }
        } catch {
            alert("No se pudieron leer las cuentas guardadas.");
            return;
        }
        const yaExiste = usuarios.some((cuenta) =>
            cuenta.usuario.toLowerCase() === usuario.toLowerCase() ||
            cuenta.email.toLowerCase() === email
        );
        if (yaExiste) {
            alert("Ese usuario o correo ya está registrado.");
            return;
        }
        const nuevaCuenta: Usuario = {
            usuario,
            email,
            password
        };
        try {
            usuarios.push(nuevaCuenta);
            localStorage.setItem(
                CLAVE_USUARIOS,
                JSON.stringify(usuarios)
            );
            alert("¡Cuenta creada correctamente! Ahora podés iniciar sesión.");
            window.location.href = "index.html";
        } catch {
            alert("No se pudo guardar la cuenta en este navegador.");
        }
    });
}
export {};