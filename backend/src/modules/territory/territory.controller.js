import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export async function getTerritories(req, res) {
    try {
        const result = await pool.query(
            `SELECT t.id, t.name, t.seedling_capacity, t.access_difficulty, t.water_availability, t.city,
             COALESCE(json_agg(json_build_object('id', s.id, 'name', s.name, 'growth_rate', s.growth_rate, 'unit_price', s.unit_price, 'survival_rate', s.survival_rate, 'type', s.type, 'ecosystem_service', s.ecosystem_service)) FILTER (WHERE s.id IS NOT NULL), '[]') AS species
             FROM territory t
             LEFT JOIN territory_species ts ON ts.territory_id = t.id
             LEFT JOIN species s ON s.id = ts.species_id
             GROUP BY t.id ORDER BY t.name`
        );
        return successResponse(res, "Territorios obtenidos.", result.rows);
    } catch (e) {
        return errorResponse(res, "Error obteniendo territorios.", 500, { detail: e.message });
    }
}

export async function getTerritoryById(req, res) {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT t.id, t.name, t.seedling_capacity, t.access_difficulty, t.water_availability, t.city,
             COALESCE(json_agg(json_build_object('id', s.id, 'name', s.name, 'growth_rate', s.growth_rate, 'unit_price', s.unit_price, 'survival_rate', s.survival_rate, 'type', s.type, 'ecosystem_service', s.ecosystem_service)) FILTER (WHERE s.id IS NOT NULL), '[]') AS species
             FROM territory t
             LEFT JOIN territory_species ts ON ts.territory_id = t.id
             LEFT JOIN species s ON s.id = ts.species_id
             WHERE t.id = $1
             GROUP BY t.id`, [id]
        );
        if (!result.rows[0]) return errorResponse(res, "Territorio no encontrado.", 404);
        return successResponse(res, "Territorio obtenido.", result.rows[0]);
    } catch (e) {
        return errorResponse(res, "Error.", 500, { detail: e.message });
    }
}
