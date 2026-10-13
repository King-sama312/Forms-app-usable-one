import { Router } from "express";
import { optionalAuthenticate } from "../../common/middleware/optionalAuthenticate.js";
import * as c from "./submission.controller.js";

const router: Router = Router();

router.post("/:id/submissions", optionalAuthenticate, c.submitForm);

export default router;
