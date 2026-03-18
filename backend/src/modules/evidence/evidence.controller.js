import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export async function getEvidence(req, res) {
    try {
        const { projectId } = req.params;
        const result = await pool.query(
            "SELECT * FROM evidence WHERE project_id = $1 ORDER BY evidence_date DESC",
            [projectId]
        );
        return successResponse(res, "Evidencias.", result.rows);
    } catch (e) {
        return errorResponse(res, "Error.", 500, { detail: e.message });
    }
}

export async function createEvidence(req, res) {
    try {
        const { project_id, description } = req.body;
        if (!project_id) return errorResponse(res, "project_id es requerido.", 400);

        const countRes = await pool.query(
            "SELECT COUNT(*) FROM evidence WHERE project_id = $1", [parseInt(project_id)]
        );
        if (parseInt(countRes.rows[0].count) >= 5)
            return errorResponse(res, "Límite de evidencias alcanzado. Máximo 5 por proyecto.", 400);

        let evidence_url;
        if (req.file) {
            evidence_url = `/uploads/evidencias/${req.file.filename}`;
        } else if (req.body.evidence_url) {
            evidence_url = req.body.evidence_url;
        } else {
            return errorResponse(res, "Se requiere un archivo de imagen.", 400);
        }

        const result = await pool.query(
            "INSERT INTO evidence (project_id, evidence_url, description, evidence_date) VALUES ($1, $2, $3, NOW()) RETURNING *",
            [parseInt(project_id), evidence_url, description || ""]
        );
        return successResponse(res, "Evidencia creada.", result.rows[0], 201);
    } catch (e) {
        return errorResponse(res, "Error.", 500, { detail: e.message });
    }
}

export async function deleteEvidence(req, res) {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM evidence WHERE id = $1", [id]);
        return successResponse(res, "Evidencia eliminada.");
    } catch (e) {
        return errorResponse(res, "Error.", 500, { detail: e.message });
    }
}
