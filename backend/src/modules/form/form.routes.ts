import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import * as formHandler from "./form.controller.js";

const router: Router = Router();

// every form route needs a logged-in user
router.use(authenticate);

router.post("/", formHandler.createForm);
router.get("/", formHandler.getForms);
router.get("/:id", formHandler.getFormById);
router.patch("/:id", formHandler.updateForm);
router.delete("/:id", formHandler.deleteForm);

router.post("/:id/publish", formHandler.publishForm);
router.post("/:id/unpublish", formHandler.unpublishForm);

router.post("/:id/fields", formHandler.addField);
router.put("/:id/fields/order", formHandler.reorderFields); // must come before the next route
router.put("/:formId/fields/:fieldId", formHandler.updateField);
router.delete("/:formId/fields/:fieldId", formHandler.deleteField);

export default router;