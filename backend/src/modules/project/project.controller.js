import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";

const projectQuery = `
    SELECT p.*, c.name AS company_name, c.economic_sector,
           q.title AS quote_title, q.tree_quantity, q.quoted_amount, q.species_id,
           q.territory_id, q.ai_draft_text, q.status AS quote_status,
           t.name AS territory_name, t.city AS territory_city,
           s.name AS species_name, s.survival_rate,
           (SELECT COUNT(*) FROM planting_event pe WHERE pe.project_id = p.id) AS event_count,
           (SELECT COALESCE(SUM(pe.quantity), 0) FROM planting_event pe WHERE pe.project_id = p.id) AS trees_planted,
           (SELECT COUNT(*) FROM evidence e WHERE e.project_id = p.id) AS evidence_count
    FROM project p
    INNER JOIN company c ON c.id = p.company_id
    LEFT JOIN quote q ON q.id = p.quote_id
    LEFT JOIN territory t ON t.id = q.territory_id
    LEFT JOIN species s ON s.id = q.species_id
`;

export async function getAllProjects(req, res) {
    try {
        const result = await pool.query(projectQuery + " ORDER BY p.id DESC");
        return successResponse(res, "Proyectos.", result.rows);
    } catch (e) {
        return errorResponse(res, "Error.", 500, { detail: e.message });
    }
}

export async function getMyProjects(req, res) {
    try {
        const company_id = req.user.companyId;
        const result = await pool.query(
            projectQuery + " WHERE p.company_id = $1 ORDER BY p.id DESC",
            [company_id]
        );
        return successResponse(res, "Mis proyectos.", result.rows);
    } catch (e) {
        return errorResponse(res, "Error.", 500, { detail: e.message });
    }
}

export async function getProjectById(req, res) {
    try {
        const { id } = req.params;
        const result = await pool.query(projectQuery + " WHERE p.id = $1", [id]);
        if (!result.rows[0]) return errorResponse(res, "Proyecto no encontrado.", 404);

        // Get planting events
        const events = await pool.query(
            `SELECT pe.*, t.name AS territory_name, s.name AS species_name, u.email AS recorded_by_email
             FROM planting_event pe
             LEFT JOIN territory t ON t.id = pe.territory_id
             LEFT JOIN species s ON s.id = pe.species_id
             LEFT JOIN app_user u ON u.id = pe.recorded_by
             WHERE pe.project_id = $1 ORDER BY pe.event_date DESC`,
            [id]
        );

        // Get evidences
        const evidences = await pool.query(
            `SELECT * FROM evidence WHERE project_id = $1 ORDER BY evidence_date DESC`, [id]
        );

        // Get files
        const files = await pool.query(
            `SELECT f.*, u.email AS uploaded_by_email FROM file f
             LEFT JOIN app_user u ON u.id = f.uploaded_by
             WHERE f.project_id = $1 ORDER BY f.uploaded_at DESC`, [id]
        );

        return successResponse(res, "Proyecto.", {
            ...result.rows[0],
            planting_events: events.rows,
            evidences: evidences.rows,
            files: files.rows
        });
    } catch (e) {
        return errorResponse(res, "Error.", 500, { detail: e.message });
    }
}

export async function updateTreesPlanted(req, res) {
    try {
        const { id } = req.params;
        const { trees_planted } = req.body;

        const val = parseInt(trees_planted, 10);
        if (isNaN(val) || val < 0)
            return errorResponse(res, "trees_planted debe ser un entero >= 0.", 400);

        // Get project info and current total
        const projRes = await pool.query(
            `SELECT p.id, q.tree_quantity, q.territory_id, q.species_id,
                    COALESCE((SELECT SUM(pe.quantity) FROM planting_event pe WHERE pe.project_id = p.id), 0) AS current_planted
             FROM project p LEFT JOIN quote q ON q.id = p.quote_id
             WHERE p.id = $1`, [id]
        );
        if (!projRes.rows[0]) return errorResponse(res, "Proyecto no encontrado.", 404);

        const proj = projRes.rows[0];
        if (proj.tree_quantity && val > proj.tree_quantity)
            return errorResponse(res, `No puede superar el objetivo de ${Number(proj.tree_quantity).toLocaleString()} árboles.`, 400);

        const delta = val - Number(proj.current_planted);
        if (delta !== 0) {
            await pool.query(
                `INSERT INTO planting_event (project_id, territory_id, species_id, quantity, event_date, recorded_by)
                 VALUES ($1, $2, $3, $4, CURRENT_DATE, $5)`,
                [id, proj.territory_id, proj.species_id, delta, req.user.id]
            );
        }

        return successResponse(res, "Árboles plantados actualizados.", { trees_planted: val });
    } catch (e) {
        return errorResponse(res, "Error.", 500, { detail: e.message });
    }
}

export async function updateProjectStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, start_date, end_date } = req.body;
        const validStatuses = ['quotation', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) return errorResponse(res, "Estado inválido.", 400);

        await pool.query(
            "UPDATE project SET status = $1, start_date = COALESCE($2, start_date), end_date = COALESCE($3, end_date) WHERE id = $4",
            [status, start_date || null, end_date || null, id]
        );
        return successResponse(res, "Proyecto actualizado.");
    } catch (e) {
        return errorResponse(res, "Error.", 500, { detail: e.message });
    }
}
