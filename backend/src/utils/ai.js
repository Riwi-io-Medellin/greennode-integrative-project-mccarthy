import "../config/env.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const FALLBACK = {
    objetivo_general: "Aumentar la cobertura forestal mediante la plantación y mantenimiento de especies nativas, contribuyendo a la restauración ecológica y compensación ambiental.",
    objetivos_especificos: [
        "Plantar y establecer el número de árboles definido en la cotización en el territorio asignado.",
        "Garantizar una tasa de supervivencia mínima del 80% al finalizar el primer año.",
        "Generar reportes de seguimiento trimestrales con evidencia fotográfica y métricas de crecimiento.",
    ],
    especies_recomendadas: [
        "Cedrela odorata (Cedro)",
        "Tabebuia rosea (Floramorado)",
        "Quercus humboldtii (Roble colombiano)",
    ],
    metodologia: "Diagnóstico del terreno, preparación de sitio, plantación con ahoyado manual, fertilización inicial, riego de establecimiento y mantenimiento periódico con control de malezas y reposición de fallas.",
    indicadores: [
        "Tasa de supervivencia (%) al mes 3, 6 y 12",
        "Incremento en altura promedio (cm/mes)",
        "Porcentaje de cobertura forestal recuperada vs. línea base",
    ],
    cronograma_meses: 12,
    consideraciones_tecnicas: "Se recomienda iniciar la plantación en época de lluvias para reducir mortalidad en establecimiento. El territorio debe contar con análisis de suelos previo y plan de manejo para especies invasoras.",
};

export async function generateMarcoLogico({
    company,
    territory,
    species,
    tree_quantity,
    title,
    description,
    quoted_amount,
}) {
    if (!OPENAI_API_KEY) {
        console.warn("[AI] OPENAI_API_KEY no configurada — usando Marco Lógico genérico.");
        return JSON.stringify(FALLBACK);
    }

    const prompt = `Eres un experto en proyectos de reforestación y compensación ambiental en Colombia.
Genera un Marco Lógico técnico para la siguiente cotización de reforestación.

RESTRICCIÓN CRÍTICA: La cantidad de árboles a sembrar es EXACTAMENTE ${tree_quantity?.toLocaleString() || "N/A"} árboles.
Este valor fue confirmado por el cliente y está fijo en contrato. No lo cambies, no lo redondees, no sugieras una cantidad diferente bajo ninguna circunstancia. Todos los objetivos, indicadores y cronograma deben construirse ALREDEDOR de este número exacto.

DATOS DE LA COTIZACIÓN:
- Título: ${title}
- Descripción: ${description || "Proyecto de compensación ambiental"}
- Empresa: ${company?.name || "N/A"} (Sector: ${company?.economic_sector || "N/A"}, Empleados: ${company?.employee_count || "N/A"})
- Territorio: ${territory?.name || "N/A"} — ${territory?.city || "N/A"}
  * Capacidad: ${territory?.seedling_capacity || "N/A"} plántulas
  * Dificultad de acceso: ${territory?.access_difficulty || "N/A"}
  * Disponibilidad de agua: ${territory?.water_availability || "N/A"}
- Especie: ${species?.name || "N/A"} (tipo: ${species?.type || "N/A"}, supervivencia: ${species?.survival_rate || "N/A"}%, servicio: ${species?.ecosystem_service || "N/A"})
- Árboles a sembrar (valor fijo, no modificar): ${tree_quantity?.toLocaleString() || "N/A"}
- Presupuesto estimado: COP $${quoted_amount?.toLocaleString() || "N/A"}

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin texto adicional) con esta estructura exacta:
{
  "objetivo_general": "string",
  "objetivos_especificos": ["string", "string", "string"],
  "especies_recomendadas": ["string", "string", "string"],
  "metodologia": "string",
  "indicadores": ["string", "string", "string"],
  "cronograma_meses": number,
  "consideraciones_tecnicas": "string"
}`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 800,
                temperature: 0.7,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(`OpenAI HTTP ${response.status}: ${data?.error?.message || JSON.stringify(data)}`);
        }

        const text = data?.choices?.[0]?.message?.content?.trim();
        if (!text) throw new Error("Empty response from OpenAI");

        // Limpiar posibles bloques de código markdown
        const clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        JSON.parse(clean); // Validar que sea JSON válido

        console.log("[AI] Marco Lógico generado con OpenAI gpt-4o-mini.");
        return clean;
    } catch (err) {
        console.error("[AI] Error generando Marco Lógico — usando fallback genérico:", err.message);
        return JSON.stringify(FALLBACK);
    }
}
