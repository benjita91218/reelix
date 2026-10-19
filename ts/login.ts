
interface RespuestaLogin {
    exito: boolean;
    mensaje: string;
    usuario?: string;
}

const formulario = document.getElementById(
    "loginForm"
) as HTMLFormElement | null;

if (formulario) {
    formulario.addEventListener("submit", async (evento: SubmitEvent) => {
        evento.preventDefault();

        const campoUsuario = document.getElementById(
            "usuario"
        ) as HTMLInputElement;

        const campoPassword = document.getElementById(
            "password"
        ) as HTMLInputElement;

        const identificador = campoUsuario.value.trim();
        const password = campoPassword.value;

        if (!identificador || !password) {
            alert("Completá el usuario y la contraseña.");
            return;
        }

        try {
            const respuesta = await fetch("php/login.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    usuario: identificador,
                    password
                })
            });

            const datos = await respuesta.json() as RespuestaLogin;

            if (!respuesta.ok || !datos.exito) {
                alert(datos.mensaje || "No se pudo iniciar sesión.");
                return;
            }

            if (!datos.usuario) {
                alert("El servidor no devolvió los datos de la cuenta.");
                return;
            }

            localStorage.setItem(
                "reelix_usuario_actual",
                datos.usuario
            );

            window.location.href = "catalogo.php";

        } catch (error) {
            console.error("Error al iniciar sesión:", error);

            alert(
                "No se pudo conectar con el servidor. " +
                "Verificá que Apache y MySQL estén encendidos."
            );
        }
    });
}

export {};
