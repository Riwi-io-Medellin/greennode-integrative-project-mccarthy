import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware.js";
import { getSpecies, getSpeciesByTerritory } from "./species.controller.js";

const router = Router();
router.get("/", authenticateToken, getSpecies);
router.get("/by-territory/:territoryId", authenticateToken, getSpeciesByTerritory);
export default router;
