import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./src/routes/auth.routes.js";
import territoryRoutes from "./src/modules/territory/territory.routes.js";
import speciesRoutes from "./src/modules/species/species.routes.js";
import quoteRoutes from "./src/modules/quote/quote.routes.js";
import projectRoutes from "./src/modules/project/project.routes.js";
import evidenceRoutes from "./src/modules/evidence/evidence.routes.js";
import fileRoutes from "./src/modules/file/file.routes.js";
import plantingEventRoutes from "./src/modules/planting-event/plantingEvent.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(express.static(path.join(__dirname, "../frontend")));

const page = (file) => (_req, res) =>
    res.sendFile(path.join(__dirname, "../frontend/pages", file));

// Landing
app.get("/", page("landing/html/landing.html"));
app.get("/landing/empresas", page("landing/html/empresas.html"));
app.get("/landing/cotizacion", page("landing/html/cotizacion.html"));
app.get("/landing/normativa", page("landing/html/normativa.html"));

// Auth
app.get("/login", page("auth/login.html"));
app.get("/register", page("auth/register.html"));
app.get("/verify-email", page("auth/verify-email.html"));

// Admin
app.get("/admin/dashboard", page("admin/dashboard.html"));
app.get("/admin/proyectos", page("admin/proyectos.html"));
app.get("/admin/proyecto-detalle", page("admin/proyecto-detalle.html"));
app.get("/admin/cotizaciones", page("admin/cotizaciones.html"));
app.get("/admin/validacion", page("admin/validacion.html"));
app.get("/admin/archivos", page("admin/archivos.html"));

// Client
app.get("/client/proyectos", page("client/proyectos.html"));
app.get("/client/proyecto-detalle", page("client/proyecto-detalle.html"));
app.get("/client/cotizaciones", page("client/cotizaciones.html"));
app.get("/client/nueva-cotizacion", page("client/nueva-cotizacion.html"));

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/territories", territoryRoutes);
app.use("/api/species", speciesRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/evidence", evidenceRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/planting-events", plantingEventRoutes);

export default app;
