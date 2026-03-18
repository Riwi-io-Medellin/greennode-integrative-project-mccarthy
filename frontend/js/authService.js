const API_BASE = '';
const API_URL = `${API_BASE}/api/auth`;

export async function loginUser(payload) {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        const err = new Error(data.message || "No se pudo iniciar sesión.");
        err.status = response.status;
        err.email = data.errors?.email || null;
        throw err;
    }

    return data;
}

export async function registerUser(payload) {
    const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "No se pudo registrar la empresa.");
    }

    return data;
}

export async function verifyEmailCode(email, code) {
    const response = await fetch(`${API_URL}/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Código inválido.");
    return data;
}

export async function resendVerificationCode(email) {
    const response = await fetch(`${API_URL}/resend-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "No se pudo reenviar el código.");
    return data;
}