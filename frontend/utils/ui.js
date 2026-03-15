export function showFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    const errorElement = document.getElementById(`${inputId}Error`);

    if (input) {
        input.classList.add("is-invalid");
        input.classList.remove("is-valid");
    }

    if (errorElement) {
        errorElement.textContent = message;
    }
}

export function showFieldSuccess(inputId) {
    const input = document.getElementById(inputId);
    const errorElement = document.getElementById(`${inputId}Error`);

    if (input) {
        input.classList.remove("is-invalid");
        input.classList.add("is-valid");
    }

    if (errorElement) {
        errorElement.textContent = "";
    }
}

export function clearFieldState(inputId) {
    const input = document.getElementById(inputId);
    const errorElement = document.getElementById(`${inputId}Error`);

    if (input) {
        input.classList.remove("is-invalid", "is-valid");
    }

    if (errorElement) {
        errorElement.textContent = "";
    }
}

export function clearFormStates(fieldIds = []) {
    fieldIds.forEach((id) => clearFieldState(id));
}

export function showGlobalAlert(message, type = "danger") {
    const alertBox = document.getElementById("globalAlert");
    if (!alertBox) return;

    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
}

export function hideGlobalAlert() {
    const alertBox = document.getElementById("globalAlert");
    if (!alertBox) return;

    alertBox.classList.add("d-none");
    alertBox.textContent = "";
}

export function setButtonLoading(buttonId, isLoading, loadingText = "Procesando...") {
    const button = document.getElementById(buttonId);
    if (!button) return;

    const btnText = button.querySelector(".btn-text");
    const btnLoading = button.querySelector(".btn-loading");

    if (isLoading) {
        button.disabled = true;
        if (btnText) btnText.classList.add("d-none");
        if (btnLoading) {
            btnLoading.classList.remove("d-none");
            btnLoading.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${loadingText}`;
        }
    } else {
        button.disabled = false;
        if (btnText) btnText.classList.remove("d-none");
        if (btnLoading) btnLoading.classList.add("d-none");
    }
}

export function setupPasswordToggles() {
    const toggleButtons = document.querySelectorAll(".toggle-password");

    toggleButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const targetId = button.getAttribute("data-target");
            const input = document.getElementById(targetId);
            const icon = button.querySelector("i");

            if (!input) return;

            const isPassword = input.type === "password";
            input.type = isPassword ? "text" : "password";

            if (icon) {
                icon.classList.toggle("bi-eye");
                icon.classList.toggle("bi-eye-slash");
            }
        });
    });
}