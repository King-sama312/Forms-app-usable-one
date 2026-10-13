import type { Request, Response } from "express";
import { parse } from "../../common/parse.js";
import { idParamSchema } from "../form/form.model.js";
import * as submissionServices from "./submission.service.js";

export async function submitForm(req: Request, res: Response) {
  const { id } = parse(idParamSchema, req.params);

  const submission = await submissionServices.submitForm(
    id,
    req.user?.id ?? null, // null when the user is not logged in
    req.body,
  );

  res.status(201).json({ submission });
}
