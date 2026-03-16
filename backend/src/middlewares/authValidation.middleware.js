const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
const allowedEconomicSectors = ["mining", "energy", "construction", "food"];

export function validateRegister(req, res, next) {
    const { companyName, email, password, economicSector, employeeCount } = req.body;
    const errors = {};

    if (!companyName || !companyName.trim()) {
        errors.companyName = "El nombre de la empresa es obligatorio.";
    } else if (companyName.trim().length < 3) {
        errors.companyName = "El nombre de la empresa debe tener al menos 3 caracteres.";
    }

    if (!email || !email.trim()) {
        errors.email = "El correo es obligatorio.";
    } else if (!emailRegex.test(email.trim())) {
        errors.email = "El correo no es válido.";
    }

    if (!password) {
        errors.password = "La contraseña es obligatoria.";
    } else if (!strongPasswordRegex.test(password)) {
        errors.password = "La contraseña debe tener mínimo 8 caracteres, 1 mayúscula y 1 número.";
    }

    if (!economicSector || !allowedEconomicSectors.includes(economicSector)) {
        errors.economicSector = "El sector económico no es válido.";
    }

    if (employeeCount !== undefined && employeeCount !== null && employeeCount !== "") {
        const num = Number(employeeCount);
        if (!Number.isInteger(num) || num < 0) {
            errors.employeeCount = "La cantidad de empleados debe ser un número válido.";
        }
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            success: false,
            message: "Errores de validación.",
            errors
        });
    }

    req.body.companyName = companyName.trim();
    req.body.email = email.trim().toLowerCase();
    req.body.employeeCount =
        employeeCount === undefined || employeeCount === null || employeeCount === ""
            ? null
            : Number(employeeCount);

    next();
}

export function validateLogin(req, res, next) {
    const { email, password } = req.body;
    const errors = {};

    if (!email || !email.trim()) {
        errors.email = "El correo es obligatorio.";
    } else if (!emailRegex.test(email.trim())) {
        errors.email = "El correo no es válido.";
    }

    if (!password) {
        errors.password = "La contraseña es obligatoria.";
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            success: false,
            message: "Errores de validación.",
            errors
        });
    }

    req.body.email = email.trim().toLowerCase();

    next();
}