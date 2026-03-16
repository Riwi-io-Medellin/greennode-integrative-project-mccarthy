import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware.js";
import { getTerritories, getTerritoryById } from "./territory.controller.js";

const router = Router();
router.get("/", authenticateToken, getTerritories);
router.get("/:id", authenticateToken, getTerritoryById);
export default router;
