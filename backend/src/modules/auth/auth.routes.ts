import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import * as authHandler from "./auth.controller.js";

const router: Router = Router();

router.post("/register", authHandler.register);
router.post("/login", authHandler.login);
router.post("/refresh", authHandler.refresh);
router.post("/logout", authHandler.logout);
router.post("/logout-all", authenticate, authHandler.logoutAll);

router.get("/me", authenticate, authHandler.getMe);

export default router;
