import "./env.js";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

export async function testDBConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query("SELECT 1 AS ok");
        console.log("Conexion a PostgreSQL exitosa:", result.rows);
        client.release();
    } catch (error) {
        console.error("Error conectando a PostgreSQL:", error.message);
    }
}

export default pool;