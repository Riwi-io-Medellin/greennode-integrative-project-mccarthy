import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export async function getSpecies(req, res) {
    try {
        const result = await pool.query("SELECT * FROM species ORDER BY name");
        return successResponse(res, "Especies obtenidas.", result.rows);
    } catch (e) {
        return errorResponse(res, "Error.", 500, { detail: e.message });
    }
}

export async function getSpeciesByTerritory(req, res) {
    try {
        const { territoryId } = req.params;
        const result = await pool.query(
            `SELECT s.* FROM species s
             INNER JOIN territory_species ts ON ts.species_id = s.id
             WHERE ts.territory_id = $1
             ORDER BY s.survival_rate DESC`, [territoryId]
        );
        return successResponse(res, "Especies por territorio.", result.rows);
    } catch (e) {
        return errorResponse(res, "Error.", 500, { detail: e.message });
    }
}
