
const formulario = document.getElementById("loginForm");

if (formulario) {
    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const campoUsuario = document.getElementById("usuario");
        const campoPassword = document.getElementById("password");

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
                    password: password
                })
            });

            const datos = await respuesta.json();

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

            // Entrar a la versión protegida del catálogo.
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
