import { Router } from "express";
import { authenticate, optionalAuthenticate } from "../../common/middleware/authenticate.js";
import * as c from "./submission.controller.js";

const router: Router = Router();

// public: anyone can submit
router.post("/:id/submissions", optionalAuthenticate, c.submitForm);

// owner only
router.get("/:id/submissions", authenticate, c.getSubmissions);
router.get("/:formId/submissions/:submissionId", authenticate, c.getSubmissionById);
router.delete("/:formId/submissions/:submissionId", authenticate, c.deleteSubmission);

export default router;