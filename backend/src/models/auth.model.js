import pool from "../config/db.js";

export async function findUserByEmail(email) {
    const sql = `
        SELECT
            u.id,
            u.email,
            u.password_hash,
            u.role_id,
            u.company_id,
            u.is_admin,
            r.name AS role,
            c.name AS company_name
        FROM app_user u
        INNER JOIN role r ON r.id = u.role_id
        LEFT JOIN company c ON c.id = u.company_id
        WHERE u.email = $1
        LIMIT 1
    `;

    const result = await pool.query(sql, [email]);
    return result.rows[0] || null;
}

export async function findRoleByName(roleName) {
    const sql = `
        SELECT id, name
        FROM role
        WHERE name = $1
        LIMIT 1
    `;

    const result = await pool.query(sql, [roleName]);
    return result.rows[0] || null;
}

export async function createCompany(name, economicSector, employeeCount = null) {
    const sql = `
        INSERT INTO company (name, employee_count, economic_sector)
        VALUES ($1, $2, $3)
        RETURNING id
    `;

    const result = await pool.query(sql, [name, employeeCount, economicSector]);
    return result.rows[0].id;
}

export async function createUser({ email, passwordHash, roleId, companyId, isAdmin = false }) {
    const sql = `
        INSERT INTO app_user (email, password_hash, role_id, company_id, is_admin)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    `;

    const result = await pool.query(sql, [
        email,
        passwordHash,
        roleId,
        companyId,
        isAdmin
    ]);

    return result.rows[0].id;
}