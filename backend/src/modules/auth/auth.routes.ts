import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import * as authHandler from "./auth.controller.js";
import { loginIpLimiter, loginAccountLimiter, registerLimiter } from "../../common/middleware/rate-limit.js";

const router: Router = Router();

router.post("/register",registerLimiter, authHandler.register);
router.post("/login",loginIpLimiter,loginAccountLimiter, authHandler.login);
router.post("/refresh", authHandler.refresh);
router.post("/logout", authHandler.logout);
router.post("/logout-all", authenticate, authHandler.logoutAll);

router.get("/me", authenticate, authHandler.getMe);

export default router;
