import type { Request, Response } from "express";
import { parse } from "../../common/parse.js";
import { idParamSchema } from "../form/form.model.js";
import * as submissionServices from "./submission.service.js";
import {
  listSubmissionsQuerySchema,
  submissionParamsSchema,
} from "./submission.model.js";

export async function submitForm(req: Request, res: Response) {
  const { id } = parse(idParamSchema, req.params);

  const submission = await submissionServices.submitForm(
    id,
    req.user?.id ?? null, // null when the user is not logged in
    req.body,
  );

  res.status(201).json({ submission });
}

export async function getSubmissions(req: Request, res: Response) {
  const { id } = parse(idParamSchema, req.params);
  const query = parse(listSubmissionsQuerySchema, req.query);

  const result = await submissionServices.getSubmissions(
    id,
    req.user!.id,
    query,
  );
  res.json(result);
}

export async function getSubmissionById(req: Request, res: Response) {
  const { formId, submissionId } = parse(submissionParamsSchema, req.params);

  const submission = await submissionServices.getSubmissionById(
    formId,
    submissionId,
    req.user!.id,
  );
  res.json({ submission });
}

export async function deleteSubmission(req: Request, res: Response) {
  const { formId, submissionId } = parse(submissionParamsSchema, req.params);

  await submissionServices.deleteSubmission(formId, submissionId, req.user!.id);
  res.sendStatus(204);
}
