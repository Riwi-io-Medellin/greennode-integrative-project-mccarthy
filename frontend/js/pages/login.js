import { validateLoginForm } from "../utils/validators.js";
import {
    showFieldError, showFieldSuccess, clearFormStates,
    showGlobalAlert, hideGlobalAlert, setButtonLoading, setupPasswordToggles
} from "../utils/ui.js";
import { loginUser } from "../services/authService.js";

document.addEventListener("DOMContentLoaded", () => {
    // Si ya hay sesión activa, redirigir directo al panel correspondiente
    // (no permite volver al login con el botón atrás si ya estás logueado)
    const existingUser = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
    const existingToken = localStorage.getItem('token');
    if (existingUser && existingToken) {
        if (existingUser.role === 'admin') {
            window.location.replace('/admin/dashboard');
        } else {
            window.location.replace('/client/proyectos');
        }
        return;
    }

    // Prevenir que el botón atrás regrese a páginas protegidas
    history.replaceState(null, '', location.href);

    const loginForm = document.getElementById("loginForm");
    setupPasswordToggles();

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideGlobalAlert();
        clearFormStates(["email", "password"]);

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const errors = validateLoginForm({ email, password });

        if (errors.email) showFieldError("email", errors.email);
        else showFieldSuccess("email");
        if (errors.password) showFieldError("password", errors.password);
        else showFieldSuccess("password");

        if (Object.keys(errors).length > 0) {
            showGlobalAlert("Por favor corrige los campos marcados.", "danger");
            return;
        }

        try {
            setButtonLoading("btnLogin", true, "Ingresando...");
            const result = await loginUser({ email, password });

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
                    window.location.replace('/admin/dashboard');
                } else if (role === "client") {
                    window.location.replace('/client/proyectos');
                }
            });
        } catch (error) {
            if (error.status === 403 && error.email) {
                window.location.href = `/verify-email?email=${encodeURIComponent(error.email)}`;
                return;
            }
            showGlobalAlert(error.message || "Credenciales inválidas.", "danger");
        } finally {
            setButtonLoading("btnLogin", false);
        }
    });
});
