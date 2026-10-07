import { z } from "zod";

const title = z.string().trim().min(1, "Title is required").max(200);
const description = z.string().trim().max(2000);

const label = z.string().trim().min(1, "Label is required").max(200);

const base = { label, required: z.boolean().default(false) };

const options = z
  .array(z.string().trim().min(1, "Option can't be empty"))
  .min(1, "Atleast one option is required")
  .max(100)
  .refine((o) => new Set(o).size === o.length, "Options must be unique");

const textField = z.object({
  ...base,
  type: z.literal("TEXT"),
  config: z.object({ maxLength: z.number().optional() }),
});

const numberField = z.object({
  ...base,
  type: z.literal("NUMBER"),
  config: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .refine(
      (c) => c.min === undefined || c.max === undefined || c.min <= c.max,
      "Min must be smaller than max ",
    ).optional(),
});

const dropdownField = z.object({
  ...base,
  type: z.literal("DROPDOWN"),
  config: z.object({ options }),
});

const checkboxField = z.object({
  ...base,
  type: z.literal("CHECKBOX"),
  config: z.object({ options }),
});

export const fieldSchema = z.discriminatedUnion("type", [
  textField,
  numberField,
  dropdownField,
  checkboxField,
]);

const futureDate = z.coerce
  .date()
  .refine((d) => d > new Date(), "Must be in the future");

export const createFormSchema = z.object({
  title,
  description: description.optional(),
  expiresAt: futureDate.optional(),
  fields: z
    .array(fieldSchema)
    .max(100, "Too many fields")
    .default([])
    .refine(
      (fs) => new Set(fs.map((f) => f.label.toLowerCase())).size === fs.length,
      "Fields label must be unique",
    ),
});
