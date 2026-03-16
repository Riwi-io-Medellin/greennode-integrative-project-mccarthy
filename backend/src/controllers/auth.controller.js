import "../config/env.js";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import {
    findUserByEmail,
    findRoleByName,
    createCompany,
    createUser,
    upsertPendingRegistration,
    findPendingByEmail,
    deletePendingByEmail,
} from "../models/auth.model.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { sendVerificationEmail } from "../utils/email.js";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

function generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function issueToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, companyId: user.company_id, isAdmin: user.is_admin },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

// POST /api/auth/register
// Stores data in pending_registrations (NOT in companies/app_user).
// Real account is only created after email verification.
export async function register(req, res) {
    try {
        const { companyName, email, password, economicSector, employeeCount } = req.body;

        // Reject if a verified account already exists
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return errorResponse(res, "El correo ya está registrado.", 409);
        }

        const passwordHash = await hashPassword(password);
        const code = generateCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        // Upsert: if they re-register before verifying, refresh the code and data
        await upsertPendingRegistration({
            email,
            companyName,
            economicSector,
            employeeCount,
            passwordHash,
            verificationCode: code,
            expiresAt,
        });

        try {
            await sendVerificationEmail(email, code);
        } catch (emailErr) {
            console.error("[register] Email send failed:", emailErr.message);
        }

        return successResponse(
            res,
            "Registro iniciado. Revisa tu correo para verificar la cuenta.",
            { email },
            201
        );
    } catch (error) {
        console.error("[register] Error:", error.message);
        return errorResponse(res, "Error al registrar la empresa.", 500, { detail: error.message });
    }
}

// POST /api/auth/login
export async function login(req, res) {
    try {
        const { email, password } = req.body;

        const user = await findUserByEmail(email);
        if (!user) {
            // Give a hint if they have a pending registration
            const pending = await findPendingByEmail(email);
            if (pending) {
                return errorResponse(res, "Debes verificar tu email antes de iniciar sesión.", 403, { email });
            }
            return errorResponse(res, "Credenciales inválidas.", 401);
        }

        const passwordOk = await comparePassword(password, user.password_hash);
        if (!passwordOk) {
            return errorResponse(res, "Credenciales inválidas.", 401);
        }

        const token = issueToken(user);

        return successResponse(
            res,
            "Inicio de sesión exitoso.",
            {
                id: user.id,
                email: user.email,
                role: user.role,
                companyId: user.company_id,
                companyName: user.company_name,
                employeeCount: user.employee_count ?? null,
                economicSector: user.economic_sector ?? null,
                isAdmin: Boolean(user.is_admin),
            },
            200,
            { token }
        );
    } catch (error) {
        return errorResponse(res, "Error al iniciar sesión.", 500, { detail: error.message });
    }
}

// POST /api/auth/verify-email
// Validates the code, then creates the company + user in the real tables.
export async function verifyEmail(req, res) {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return errorResponse(res, "Email y código son obligatorios.", 400);
        }

        const pending = await findPendingByEmail(email);

        if (!pending) {
            return errorResponse(res, "No hay un registro pendiente para este email.", 404);
        }

        // Remove expired pending and reject
        if (new Date() > new Date(pending.expires_at)) {
            await deletePendingByEmail(email);
            return errorResponse(res, "El código ha expirado. Regístrate nuevamente.", 400);
        }

        if (String(pending.verification_code) !== String(code)) {
            return errorResponse(res, "Código inválido.", 400);
        }

        // Code is valid → create real account
        const companyRole = await findRoleByName("client");
        if (!companyRole) {
            return errorResponse(res, "Rol 'client' no encontrado en la base de datos.", 500);
        }

        const companyId = await createCompany(
            pending.company_name,
            pending.economic_sector,
            pending.employee_count
        );

        await createUser({
            email: pending.email,
            passwordHash: pending.password_hash,
            roleId: companyRole.id,
            companyId,
            isAdmin: false,
        });

        // Clean up pending record
        await deletePendingByEmail(email);

        // Fetch full user for token payload
        const user = await findUserByEmail(email);
        const token = issueToken(user);

        return successResponse(
            res,
            "Email verificado correctamente. Bienvenido a GreenNode.",
            {
                id: user.id,
                email: user.email,
                role: user.role,
                companyId: user.company_id,
                companyName: user.company_name,
                employeeCount: user.employee_count ?? null,
                economicSector: user.economic_sector ?? null,
                isAdmin: Boolean(user.is_admin),
            },
            200,
            { token }
        );
    } catch (e) {
        console.error("[verifyEmail] ERROR:", e.message, e.stack);
        return errorResponse(res, "Error al verificar email.", 500, { detail: e.message });
    }
}

// POST /api/auth/resend-code
export async function resendCode(req, res) {
    try {
        const { email } = req.body;
        if (!email) return errorResponse(res, "Email es obligatorio.", 400);

        // If already verified, no point resending
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return errorResponse(res, "El email ya fue verificado.", 409);
        }

        const pending = await findPendingByEmail(email);
        if (!pending) {
            return errorResponse(res, "No hay un registro pendiente para este email.", 404);
        }

        const code = generateCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await upsertPendingRegistration({
            email: pending.email,
            companyName: pending.company_name,
            economicSector: pending.economic_sector,
            employeeCount: pending.employee_count,
            passwordHash: pending.password_hash,
            verificationCode: code,
            expiresAt,
        });

        await sendVerificationEmail(email, code);

        return successResponse(res, "Código reenviado. Revisa tu correo.");
    } catch (e) {
        return errorResponse(res, "Error al reenviar el código.", 500, { detail: e.message });
    }
}

// GET /api/auth/profile
export async function getProfile(req, res) {
    try {
        const result = await pool.query(
            `SELECT u.email, c.name AS company_name, c.economic_sector, c.employee_count,
                    COALESCE(SUM(q.tree_quantity), 0)::int AS total_trees_committed
             FROM app_user u
             LEFT JOIN company c ON c.id = u.company_id
             LEFT JOIN quote q ON q.company_id = c.id
             WHERE u.id = $1
             GROUP BY u.email, c.name, c.economic_sector, c.employee_count`,
            [req.user.id]
        );
        if (!result.rows[0]) return errorResponse(res, "Usuario no encontrado.", 404);
        return successResponse(res, "Perfil.", result.rows[0]);
    } catch (e) {
        return errorResponse(res, "Error obteniendo perfil.", 500, { detail: e.message });
    }
}
