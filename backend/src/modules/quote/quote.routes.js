import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import {
    createQuote, getMyQuotes, getAllQuotes, getQuoteById,
    updateQuoteStatus, sendQuoteToClient
} from "./quote.controller.js";

const router = Router();

router.post("/", authenticateToken, authorizeRoles("client"), createQuote);
router.get("/my", authenticateToken, authorizeRoles("client"), getMyQuotes);
router.get("/", authenticateToken, authorizeRoles("admin"), getAllQuotes);
router.get("/:id", authenticateToken, getQuoteById);


router.patch("/:id/status", authenticateToken, updateQuoteStatus);

router.post("/:id/send", authenticateToken, authorizeRoles("admin"), sendQuoteToClient);

export default router;
