import "../config/env.js";
import jwt from "jsonwebtoken";
import {
    findUserByEmail,
    findRoleByName,
    createCompany,
    createUser
} from "../models/auth.model.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { successResponse, errorResponse } from "../utils/response.js";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

export async function register(req, res) {
    try {
        const { companyName, email, password, economicSector, employeeCount } = req.body;

        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return errorResponse(res, "El correo ya está registrado.", 409);
        }

        const companyRole = await findRoleByName("client");
        if (!companyRole) {
            return errorResponse(res, "No existe el rol client en la base de datos.", 500);
        }

        const passwordHash = await hashPassword(password);

        const companyId = await createCompany(
            companyName,
            economicSector,
            employeeCount || null
        );

        const userId = await createUser({
            email,
            passwordHash,
            roleId: companyRole.id,
            companyId,
            isAdmin: false
        });

        return successResponse(
            res,
            "Registro exitoso. Ahora puedes iniciar sesión.",
            {
                userId,
                email,
                role: companyRole.name,
                companyId,
                companyName,
                economicSector
            },
            201
        );
    } catch (error) {
        return errorResponse(res, "Error al registrar la empresa.", 500, {
            detail: error.message
        });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        const user = await findUserByEmail(email);
        if (!user) {
            return errorResponse(res, "Credenciales inválidas.", 401);
        }

        const passwordOk = await comparePassword(password, user.password_hash);
        if (!passwordOk) {
            return errorResponse(res, "Credenciales inválidas.", 401);
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                companyId: user.company_id,
                isAdmin: user.is_admin
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        return successResponse(
            res,
            "Inicio de sesión exitoso.",
            {
                id: user.id,
                email: user.email,
                role: user.role,
                companyId: user.company_id,
                companyName: user.company_name,
                isAdmin: Boolean(user.is_admin)
            },
            200,
            { token }
        );
    } catch (error) {
        return errorResponse(res, "Error al iniciar sesión.", 500, {
            detail: error.message
        });
    }
}