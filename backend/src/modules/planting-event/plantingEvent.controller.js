import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export async function getEvents(req, res) {
    try {
        const { projectId } = req.params;
        const result = await pool.query(
            `SELECT pe.*, t.name AS territory_name, s.name AS species_name, u.email AS recorded_by_email
             FROM planting_event pe
             LEFT JOIN territory t ON t.id = pe.territory_id
             LEFT JOIN species s ON s.id = pe.species_id
             LEFT JOIN app_user u ON u.id = pe.recorded_by
             WHERE pe.project_id = $1 ORDER BY pe.event_date DESC`,
            [projectId]
        );
        return successResponse(res, "Eventos de siembra.", result.rows);
    } catch (e) {
        return errorResponse(res, "Error.", 500, { detail: e.message });
    }
}

export async function createEvent(req, res) {
    try {
        const { project_id, territory_id, species_id, event_date, quantity } = req.body;
        const recorded_by = req.user.id;
        if (!project_id || !territory_id || !species_id || !event_date || !quantity) {
            return errorResponse(res, "Todos los campos son requeridos.", 400);
        }
        const result = await pool.query(
            "INSERT INTO planting_event (project_id, territory_id, species_id, recorded_by, event_date, quantity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [project_id, territory_id, species_id, recorded_by, event_date, quantity]
        );
        return successResponse(res, "Evento creado.", result.rows[0], 201);
    } catch (e) {
        return errorResponse(res, "Error.", 500, { detail: e.message });
    }
}
