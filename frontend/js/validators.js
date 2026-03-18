export function isRequired(value) {
    return String(value).trim() !== "";
}

export function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(String(email).trim());
}

export function isStrongPassword(password) {
    const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(password);
}

export function validateLoginForm({ email, password }) {
    const errors = {};

    if (!isRequired(email)) {
        errors.email = "El correo es obligatorio.";
    } else if (!isValidEmail(email)) {
        errors.email = "Ingresa un correo válido.";
    }

    if (!isRequired(password)) {
        errors.password = "La contraseña es obligatoria.";
    }

    return errors;
}

export function validateRegisterForm({
    companyName,
    email,
    password,
    confirmPassword,
    economicSector,
    employeeCount
}) {
    const errors = {};
    const allowedEconomicSectors = ["mining", "energy", "construction", "food"];

    if (!isRequired(companyName)) {
        errors.companyName = "El nombre de la empresa es obligatorio.";
    } else if (companyName.trim().length < 3) {
        errors.companyName = "El nombre debe tener al menos 3 caracteres.";
    }

    if (!isRequired(email)) {
        errors.email = "El correo es obligatorio.";
    } else if (!isValidEmail(email)) {
        errors.email = "Ingresa un correo válido.";
    }

    if (!economicSector || !allowedEconomicSectors.includes(economicSector)) {
        errors.economicSector = "Selecciona un sector económico válido.";
    }

    if (employeeCount !== "" && employeeCount !== null && employeeCount !== undefined) {
        const num = Number(employeeCount);
        if (!Number.isInteger(num) || num < 0) {
            errors.employeeCount = "La cantidad de empleados debe ser un número válido.";
        }
    }

    if (!isRequired(password)) {
        errors.password = "La contraseña es obligatoria.";
    } else if (!isStrongPassword(password)) {
        errors.password = "Debe tener mínimo 8 caracteres, 1 mayúscula y 1 número.";
    }

    if (!isRequired(confirmPassword)) {
        errors.confirmPassword = "Debes confirmar la contraseña.";
    } else if (password !== confirmPassword) {
        errors.confirmPassword = "Las contraseñas no coinciden.";
    }

    return errors;
}