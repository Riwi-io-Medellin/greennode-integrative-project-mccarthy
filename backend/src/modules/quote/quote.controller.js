import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";
import { generateMarcoLogico } from "../../utils/ai.js";

export async function createQuote(req, res) {
    try {
        const { territory_id, species_id, title, description, tree_quantity: tree_quantity_input } = req.body;
        const company_id = req.user.companyId;

        if (!territory_id || !species_id || !title)
            return errorResponse(res, "Territorio, especie y título son obligatorios.", 400);

        // Bloquea solo cotizaciones en vuelo. 'accepted' (proyecto ya creado) y 'rejected'
        // son estados terminales: la empresa puede solicitar nuevas cotizaciones
        const existingQuote = await pool.query(
            `SELECT id FROM quote WHERE company_id = $1 AND status IN ('pending','reviewed','sent') LIMIT 1`,
            [company_id]
        );
        if (existingQuote.rows[0])
            return errorResponse(res, "Ya tienes una cotización activa. Espera a que sea procesada.", 400);

        const companyData = await pool.query("SELECT * FROM company WHERE id = $1", [company_id]);
        const company = companyData.rows[0];
        const tree_quantity = tree_quantity_input ? parseInt(tree_quantity_input, 10) : (company?.employee_count || 1) * 2;

        const [territoryData, speciesData] = await Promise.all([
            pool.query("SELECT * FROM territory WHERE id = $1", [territory_id]),
            pool.query("SELECT * FROM species WHERE id = $1", [species_id])
        ]);
        const territory = territoryData.rows[0];
        const species = speciesData.rows[0];
        const quoted_amount = species ? species.unit_price * tree_quantity * 1.5 : 0;

        let ai_draft_text = "";
        try {
            ai_draft_text = await generateMarcoLogico({ company, territory, species, tree_quantity, title, description, quoted_amount });
        } catch (aiErr) {
            console.error("[createQuote] AI generation failed:", aiErr.message);
            ai_draft_text = `Marco Lógico - ${title}\n\nOBJETIVO: Restauración ecológica en ${territory?.name || 'el territorio seleccionado'} con siembra de ${tree_quantity.toLocaleString()} árboles de ${species?.name || 'la especie seleccionada'}.\n\nPRESUPUESTO ESTIMADO: COP $${quoted_amount.toLocaleString()}\n\nACTIVIDADES:\n1. Diagnóstico técnico del territorio (30 días)\n2. Preparación del terreno (45 días)\n3. Siembra de árboles - Jornada #1 (60 días)\n4. Monitoreo y seguimiento (90 días)\n5. Siembra de refuerzo si aplica (30 días)\n6. Reporte final y certificación (15 días)\n\nSUPERVIVENCIA ESPERADA: ${species?.survival_rate || 85}%`;
        }

        const result = await pool.query(
            `INSERT INTO quote (company_id, territory_id, species_id, tree_quantity, title, description, ai_draft_text, quoted_amount, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending') RETURNING id`,
            [company_id, territory_id, species_id, tree_quantity, title, description || "", ai_draft_text, quoted_amount]
        );

        return successResponse(res, "Cotización creada exitosamente. El equipo la revisará pronto.", {
            id: result.rows[0].id, tree_quantity, quoted_amount, ai_draft_text
        }, 201);
    } catch (e) {
        return errorResponse(res, "Error creando cotización.", 500, { detail: e.message });
    }
}

export async function getMyQuotes(req, res) {
    try {
        const company_id = req.user.companyId;
        const result = await pool.query(
            `SELECT q.*, t.name AS territory_name, t.city AS territory_city,
             s.name AS species_name, s.survival_rate, c.name AS company_name
             FROM quote q
             INNER JOIN territory t ON t.id = q.territory_id
             INNER JOIN species s ON s.id = q.species_id
             INNER JOIN company c ON c.id = q.company_id
             WHERE q.company_id = $1 ORDER BY q.created_at DESC`,
            [company_id]
        );
        return successResponse(res, "Mis cotizaciones.", result.rows);
    } catch (e) {
        return errorResponse(res, "Error.", 500, { detail: e.message });
    }
}

export async function getAllQuotes(req, res) {
    try {
        const result = await pool.query(
            `SELECT q.*, t.name AS territory_name, t.city AS territory_city,
             s.name AS species_name, c.name AS company_name
             FROM quote q
             INNER JOIN territory t ON t.id = q.territory_id
             INNER JOIN species s ON s.id = q.species_id
             INNER JOIN company c ON c.id = q.company_id
             ORDER BY q.created_at DESC`
        );
        return successResponse(res, "Todas las cotizaciones.", result.rows);
    } catch (e) {
        return errorResponse(res, "Error.", 500, { detail: e.message });
    }
}

export async function getQuoteById(req, res) {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT q.*, t.name AS territory_name, t.city AS territory_city,
             t.access_difficulty, t.water_availability, t.seedling_capacity,
             s.name AS species_name, s.survival_rate, s.growth_rate, s.ecosystem_service,
             c.name AS company_name, c.employee_count, c.economic_sector
             FROM quote q
             INNER JOIN territory t ON t.id = q.territory_id
             INNER JOIN species s ON s.id = q.species_id
             INNER JOIN company c ON c.id = q.company_id
             WHERE q.id = $1`,
            [id]
        );
        if (!result.rows[0]) return errorResponse(res, "Cotización no encontrada.", 404);
        return successResponse(res, "Cotización.", result.rows[0]);
    } catch (e) {
        return errorResponse(res, "Error.", 500, { detail: e.message });
    }
}

// Admin guarda cambios (reviewed) | Ciente acepta o rechaza
export async function updateQuoteStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, ai_draft_text, quoted_amount } = req.body;
        const userRole = req.user.role;

        const validStatuses = ['pending', 'reviewed', 'sent', 'accepted', 'rejected'];
        if (!validStatuses.includes(status))
            return errorResponse(res, "Estado inválido.", 400);

        // Clientes solo pueden aceptar o rechazar
        if (userRole === 'client' && !['accepted', 'rejected'].includes(status))
            return errorResponse(res, "No autorizado.", 403);

        const updates = [['status', status]];

        // Solo el admin puede modificar el texto y el monto
        if (userRole === 'admin') {
            if (ai_draft_text !== undefined)
                updates.push(['ai_draft_text', ai_draft_text]);
            if (quoted_amount !== undefined && quoted_amount !== null && quoted_amount !== '')
                updates.push(['quoted_amount', parseFloat(quoted_amount)]);
        }

        const setClauses = updates.map(([col], i) => `${col} = $${i + 1}`).join(', ');
        const values = updates.map(([, val]) => val);
        values.push(id);
        await pool.query(`UPDATE quote SET ${setClauses} WHERE id = $${values.length}`, values);

        // Si el cliente acepta → crear proyecto
        if (status === 'accepted') {
            const qr = await pool.query(
                `SELECT q.*, c.name AS company_name FROM quote q
                 INNER JOIN company c ON c.id = q.company_id WHERE q.id = $1`, [id]
            );
            const q = qr.rows[0];
            if (q) {
                const existing = await pool.query("SELECT id FROM project WHERE quote_id = $1", [id]);
                if (!existing.rows[0]) {
                    await pool.query(
                        `INSERT INTO project (name, description, status, quote_id, company_id, start_date)
                         VALUES ($1, $2, 'in_progress', $3, $4, CURRENT_DATE)`,
                        [q.title, q.description || `Proyecto de reforestación - ${q.company_name}`, id, q.company_id]
                    );
                }
            }
        }

        return successResponse(res, "Cotización actualizada.");
    } catch (e) {
        return errorResponse(res, "Error.", 500, { detail: e.message });
    }
}

// Admin: guarda el 
export async function sendQuoteToClient(req, res) {
    try {
        const { id } = req.params;
        const { ai_draft_text, quoted_amount } = req.body;

        const updates = [];

        if (ai_draft_text !== undefined)
            updates.push(['ai_draft_text', ai_draft_text]);
        if (quoted_amount !== undefined && quoted_amount !== null && quoted_amount !== '')
            updates.push(['quoted_amount', parseFloat(quoted_amount)]);

        const setClauses = ["status = 'sent'", ...updates.map(([col], i) => `${col} = $${i + 1}`)].join(', ');
        const values = updates.map(([, val]) => val);
        values.push(id);
        await pool.query(`UPDATE quote SET ${setClauses} WHERE id = $${values.length}`, values);

        return successResponse(res, "Cotización enviada al cliente con los cambios guardados.");
    } catch (e) {
        return errorResponse(res, "Error enviando cotización.", 500, { detail: e.message });
    }
}
