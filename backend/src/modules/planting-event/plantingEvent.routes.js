import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { getEvents, createEvent } from "./plantingEvent.controller.js";

const router = Router();
router.get("/:projectId", authenticateToken, getEvents);
router.post("/", authenticateToken, authorizeRoles("admin"), createEvent);
export default router;
