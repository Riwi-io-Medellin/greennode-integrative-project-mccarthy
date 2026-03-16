import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { getAllProjects, getMyProjects, getProjectById, updateProjectStatus, updateTreesPlanted } from "./project.controller.js";

const router = Router();
router.get("/", authenticateToken, authorizeRoles("admin"), getAllProjects);
router.get("/my", authenticateToken, authorizeRoles("client"), getMyProjects);
router.get("/:id", authenticateToken, getProjectById);
router.patch("/:id/status", authenticateToken, authorizeRoles("admin"), updateProjectStatus);
router.patch("/:id/progress", authenticateToken, authorizeRoles("admin"), updateTreesPlanted);
export default router;
