import { apiFetch } from "./client";

export type FormStatus = "DRAFT" | "PUBLISHED" | "EXPIRED";

export type Form = {
  id: string;
  userId: number;
  title: string;
  description: string | null;
  status: FormStatus;
  expiresAt: string | null;
  requireLogin: boolean;
  singleResponse: boolean;
  createdAt: string;
  updatedAt: string;
  fields?: FormField[];
  _count?: {
    fields: number;
    submissions: number;
  };
};

export type FormFieldConfig =
  | { maxLength?: number }
  | { min?: number; max?: number }
  | { options: string[] };

export type FormField = {
  id: string;
  formId: string;
  label: string;
  type: "TEXT" | "NUMBER" | "DROPDOWN" | "CHECKBOX";
  required: boolean;
  order: number;
  config: FormFieldConfig | null;
  createdAt: string;
  updatedAt: string;
};

type FormsResponse = {
  forms: Form[];
};

export async function getForms() {
  const { forms } = await apiFetch<FormsResponse>("/api/forms");
  return forms;
}
