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
            u.email_verified,
            r.name AS role,
            c.name AS company_name,
            c.employee_count,
            c.economic_sector
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
    const result = await pool.query(
        `SELECT id, name FROM role WHERE name = $1 LIMIT 1`,
        [roleName]
    );
    return result.rows[0] || null;
}

export async function createCompany(name, economicSector, employeeCount = null) {
    const result = await pool.query(
        `INSERT INTO company (name, employee_count, economic_sector)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [name, employeeCount, economicSector]
    );
    return result.rows[0].id;
}

export async function createUser({ email, passwordHash, roleId, companyId, isAdmin = false }) {
    const result = await pool.query(
        `INSERT INTO app_user (email, password_hash, role_id, company_id, is_admin, email_verified)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         RETURNING id`,
        [email, passwordHash, roleId, companyId, isAdmin]
    );
    return result.rows[0].id;
}

// --- Pending registrations ---

export async function upsertPendingRegistration({ email, companyName, economicSector, employeeCount, passwordHash, verificationCode, expiresAt }) {
    const result = await pool.query(
        `INSERT INTO pending_registrations
            (email, company_name, economic_sector, employee_count, password_hash, verification_code, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO UPDATE SET
            company_name      = EXCLUDED.company_name,
            economic_sector   = EXCLUDED.economic_sector,
            employee_count    = EXCLUDED.employee_count,
            password_hash     = EXCLUDED.password_hash,
            verification_code = EXCLUDED.verification_code,
            expires_at        = EXCLUDED.expires_at,
            created_at        = NOW()
         RETURNING *`,
        [email, companyName, economicSector, employeeCount ?? null, passwordHash, verificationCode, expiresAt]
    );
    return result.rows[0];
}

export async function findPendingByEmail(email) {
    const result = await pool.query(
        `SELECT * FROM pending_registrations WHERE email = $1 LIMIT 1`,
        [email]
    );
    return result.rows[0] || null;
}

export async function deletePendingByEmail(email) {
    await pool.query(
        `DELETE FROM pending_registrations WHERE email = $1`,
        [email]
    );
}
