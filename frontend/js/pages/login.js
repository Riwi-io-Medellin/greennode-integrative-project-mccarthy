import { validateLoginForm } from "../../utils/validators.js";
import {
    showFieldError,
    showFieldSuccess,
    clearFormStates,
    showGlobalAlert,
    hideGlobalAlert,
    setButtonLoading,
    setupPasswordToggles
} from "../../utils/ui.js";
import { loginUser } from "../../services/authService.js";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");

    setupPasswordToggles();

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideGlobalAlert();
        clearFormStates(["email", "password"]);

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const formData = { email, password };
        const errors = validateLoginForm(formData);

        if (errors.email) {
            showFieldError("email", errors.email);
        } else {
            showFieldSuccess("email");
        }

        if (errors.password) {
            showFieldError("password", errors.password);
        } else {
            showFieldSuccess("password");
        }

        if (Object.keys(errors).length > 0) {
            showGlobalAlert("Por favor corrige los campos marcados.", "danger");
            return;
        }

        try {
            setButtonLoading("btnLogin", true, "Ingresando...");

            const result = await loginUser(formData);

            localStorage.setItem("user", JSON.stringify(result.data));
            localStorage.setItem("token", result.token || "");

            Swal.fire({
                icon: "success",
                title: "Bienvenido",
                text: result.message || "Inicio de sesión exitoso.",
                confirmButtonColor: "#198754"
            }).then(() => {
                const role = result?.data?.role;

                if (role === "admin") {
                    window.location.href = "/frontend/src/pages/admin/dashboard.html";
                } else if (role === "empresa") {
                    window.location.href = "/frontend/src/pages/company/dashboard.html";
                } else {
                    window.location.href = "/frontend/src/pages/auth/login.html";
                }
            });
        } catch (error) {
            showGlobalAlert(error.message || "Credenciales inválidas.", "danger");
        } finally {
            setButtonLoading("btnLogin", false);
        }
    });
});