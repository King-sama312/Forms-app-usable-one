import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../common/api.error.js";
import {
  addFieldSchema,
  createFormSchema,
  fieldParamsSchema,
  idParamSchema,
  reorderFieldsSchema,
  updateFieldSchema,
  updateFormSchema,
} from "./form.model.js";
import * as formServices from "./form.services.js";

// checks the data with Zod, and throws a 400 error if it is not valid
function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) throw ApiError.badRequest(z.prettifyError(result.error));
  return result.data;
}

/* ---------- forms ---------- */

export async function createForm(req: Request, res: Response) {
  const body = parse(createFormSchema, req.body);
  const form = await formServices.createForm(req.user!.id, body);
  res.status(201).json({ form });
}

export async function getForms(req: Request, res: Response) {
  const forms = await formServices.getForms(req.user!.id);
  res.json({ forms });
}

export async function getFormById(req: Request, res: Response) {
  const { id } = parse(idParamSchema, req.params);
  const form = await formServices.getFormById(id, req.user!.id);
  res.json({ form });
}

export async function updateForm(req: Request, res: Response) {
  const { id } = parse(idParamSchema, req.params);
  const body = parse(updateFormSchema, req.body);
  const form = await formServices.updateForm(id, req.user!.id, body);
  res.json({ form });
}

export async function deleteForm(req: Request, res: Response) {
  const { id } = parse(idParamSchema, req.params);
  await formServices.deleteForm(id, req.user!.id);
  res.sendStatus(204);
}

export async function publishForm(req: Request, res: Response) {
  const { id } = parse(idParamSchema, req.params);
  const form = await formServices.publishForm(id, req.user!.id);
  res.json({ form });
}

export async function unpublishForm(req: Request, res: Response) {
  const { id } = parse(idParamSchema, req.params);
  const form = await formServices.unpublishForm(id, req.user!.id);
  res.json({ form });
}

/* ---------- fields ---------- */

export async function addField(req: Request, res: Response) {
  const { id } = parse(idParamSchema, req.params);
  const body = parse(addFieldSchema, req.body);
  const field = await formServices.addField(id, req.user!.id, body);
  res.status(201).json({ field });
}

export async function updateField(req: Request, res: Response) {
  const { formId, fieldId } = parse(fieldParamsSchema, req.params);
  const body = parse(updateFieldSchema, req.body);
  // note: the service takes fieldId first
  const field = await formServices.updateField(fieldId, formId, req.user!.id, body);
  res.json({ field });
}

export async function deleteField(req: Request, res: Response) {
  const { formId, fieldId } = parse(fieldParamsSchema, req.params);
  await formServices.deleteField(fieldId, formId, req.user!.id);
  res.sendStatus(204);
}

export async function reorderFields(req: Request, res: Response) {
  const { id } = parse(idParamSchema, req.params);
  const { fieldIds } = parse(reorderFieldsSchema, req.body);
  await formServices.reorderFields(id, req.user!.id, fieldIds);
  res.sendStatus(204);
}