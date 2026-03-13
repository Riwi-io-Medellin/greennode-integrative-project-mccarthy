import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth.routes.js";
import testRoutes from "./src/routes/test.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({ ok: true, message: "API funcionando" });
});

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);

export default app;