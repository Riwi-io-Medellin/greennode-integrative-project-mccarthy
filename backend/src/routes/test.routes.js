import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/admin-only", authenticateToken, authorizeRoles("admin"), (req, res) => {
    res.json({
        success: true,
        message: "Bienvenido admin."
    });
});

router.get("/company-only", authenticateToken, authorizeRoles("client"), (req, res) => {
    res.json({
        success: true,
        message: "Bienvenida empresa."
    });
});

export default router;