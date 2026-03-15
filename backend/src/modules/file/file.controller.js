import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export async function getFiles(req, res) {
    try {
        const { projectId } = req.params;
        const result = await pool.query(
            `SELECT f.*, u.email AS uploaded_by_email FROM file f
             LEFT JOIN app_user u ON u.id = f.uploaded_by
             WHERE f.project_id = $1 ORDER BY f.uploaded_at DESC`,
            [projectId]
        );
        return successResponse(res, "Archivos.", result.rows);
    } catch (e) {
        return errorResponse(res, "Error.", 500, { detail: e.message });
    }
}

export async function createFile(req, res) {
    try {
        const { project_id, file_type } = req.body;
        const uploaded_by = req.user.id;
        const validTypes = ['legal_document', 'certificate', 'report', 'other'];

        if (!project_id || !validTypes.includes(file_type))
            return errorResponse(res, "project_id y file_type válido son requeridos.", 400);

        let file_url;
        if (req.file) {
            file_url = `/uploads/documentos/${req.file.filename}`;
        } else if (req.body.file_url) {
            file_url = req.body.file_url;
        } else {
            return errorResponse(res, "Se requiere un archivo.", 400);
        }

        const result = await pool.query(
            "INSERT INTO file (project_id, uploaded_by, file_url, file_type) VALUES ($1, $2, $3, $4) RETURNING *",
            [parseInt(project_id), uploaded_by, file_url, file_type]
        );
        return successResponse(res, "Archivo creado.", result.rows[0], 201);
    } catch (e) {
        return errorResponse(res, "Error.", 500, { detail: e.message });
    }
}

export async function deleteFile(req, res) {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM file WHERE id = $1", [id]);
        return successResponse(res, "Archivo eliminado.");
    } catch (e) {
        return errorResponse(res, "Error.", 500, { detail: e.message });
    }
}
