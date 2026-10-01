import { z } from "zod";

interface FieldDefinition {
  id: number;
  label: string;
  type: "text" | "number" | "boolean";
  required: boolean;
}

// fetched fields
const apiFields: FieldDefinition[] = [
  { id: 1, label: "username", type: "text", required: true },
  { id: 2, label: "age", type: "number", required: false },
  { id: 3, label: "newsletter", type: "boolean", required: true },
];

const schemaShape: Record<string, z.ZodType> = {};

apiFields.forEach((field) => {
  let zodType: z.ZodType;

  switch (field.type) {
    case "number":
      zodType = z.number();
      break;
    case "boolean":
      zodType = z.boolean();
      break;
    default:
      zodType = z.string();
  }

  if (!field.required) {
    zodType = zodType.optional();
  }

  schemaShape[field.id] = zodType;
});

const dynamicSchema = z.object(schemaShape);
