import { z } from "zod";
import type { Field } from "../../../generated/prisma/client.js";

function answerRule(field: Field) {
  // config is Json in the database, so we tell TypeScript its shape
  const config = (field.config ?? {}) as Record<string, any>;

  switch (field.type) {
    case "TEXT": {
      let rule = z.string().trim();
      if (field.required) rule = rule.min(1, "This answer is required");
      if (config.maxLength) rule = rule.max(config.maxLength);
      return rule;
    }
    case "NUMBER": {
      let rule = z.number();
      if (config.min !== undefined) rule = rule.min(config.min);
      if (config.max !== undefined) rule = rule.max(config.max);
      return rule;
    }
    case "DROPDOWN":
      return z.enum(config.options); // must match one option exactly
    case "CHECKBOX": {
      let rule = z
        .array(z.enum(config.options))
        .refine((a) => new Set(a).size === a.length, "Repeated choices");
      if (field.required) rule = rule.min(1, "Choose at least one option");
      return rule;
    }
  }
}

export function buildAnswerSchema(fields: Field[]) {
  const shape: Record<string, z.ZodType> = {};

  for (const field of fields) {
    const rule = answerRule(field);
    shape[field.id] = field.required ? rule : rule.optional();
  }

  return z.strictObject(shape);
}

export const listSubmissionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const submissionParamsSchema = z.object({
  formId: z.uuid(),
  submissionId: z.uuid(),
});

export type ListSubmissionsQuery = z.infer<typeof listSubmissionsQuerySchema>;
