import { validateRegisterForm } from "../../js/utils/validators.js";
import {
    showFieldError,
    showFieldSuccess,
    clearFormStates,
    showGlobalAlert,
    hideGlobalAlert,
    setButtonLoading,
    setupPasswordToggles
} from "../../js/utils/ui.js";
import { registerUser } from "../../js/services/authService.js";

document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");

    setupPasswordToggles();

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideGlobalAlert();
        clearFormStates([
            "companyName",
            "email",
            "economicSector",
            "employeeCount",
            "password",
            "confirmPassword"
        ]);

        const companyName = document.getElementById("companyName").value.trim();
        const email = document.getElementById("email").value.trim();
        const economicSector = document.getElementById("economicSector").value;
        const employeeCount = document.getElementById("employeeCount").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        const formData = {
            companyName,
            email,
            economicSector,
            employeeCount,
            password,
            confirmPassword
        };

        const errors = validateRegisterForm(formData);

        ["companyName", "email", "economicSector", "employeeCount", "password", "confirmPassword"]
            .forEach((field) => {
                if (errors[field]) showFieldError(field, errors[field]);
                else showFieldSuccess(field);
            });

        if (Object.keys(errors).length > 0) {
            showGlobalAlert("Por favor corrige los campos marcados.", "danger");
            return;
        }

        try {
            setButtonLoading("btnRegister", true, "Registrando...");

            const payload = {
                companyName,
                email,
                economicSector,
                employeeCount: employeeCount === "" ? null : Number(employeeCount),
                password
            };

            const result = await registerUser(payload);

            window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
        } catch (error) {
            showGlobalAlert(error.message || "No se pudo completar el registro.", "danger");
        } finally {
            setButtonLoading("btnRegister", false);
        }
    });
});