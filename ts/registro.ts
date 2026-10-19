
const formulario = document.getElementById(
    "registroForm"
) as HTMLFormElement | null;

if (formulario) {
    formulario.addEventListener("submit", async (evento: SubmitEvent) => {
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

        try {
            const respuesta = await fetch("php/usuarios.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    usuario,
                    email,
                    password
                })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok || !datos.exito) {
                alert(datos.mensaje || "No se pudo crear la cuenta.");
                return;
            }

            alert("¡Cuenta creada correctamente!");

            window.location.href = "index.html";

        } catch (error) {
            console.error("Error durante el registro:", error);

            alert(
                "No se pudo conectar con el servidor. " +
                "Verificá que Apache y MySQL estén encendidos."
            );
        }
    });
}

export {};
