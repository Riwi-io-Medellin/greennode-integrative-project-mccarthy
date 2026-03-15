import { Router } from "express";
import { login, register, getProfile, verifyEmail, resendCode } from "../controllers/auth.controller.js";
import { validateLogin, validateRegister } from "../middlewares/authValidation.middleware.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/verify-email", verifyEmail);
router.post("/resend-code", resendCode);
router.get("/profile", authenticateToken, getProfile);

export default router;
