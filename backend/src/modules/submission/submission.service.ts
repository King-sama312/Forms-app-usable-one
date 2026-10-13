import { z } from "zod";
import { prisma } from "../../prisma.js";
import { ApiError } from "../../common/api.error.js";
import { buildAnswerSchema } from "./submission.model.js";
import { Prisma } from "../../../generated/prisma/browser.js";

export async function submitForm(
  formId: string,
  userId: number | null,
  answers: unknown,
) {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { fields: true },
  });

  if (!form || form.status === "DRAFT") {
    throw ApiError.notFound("Form not found");
  }

  if (
    form.status === "EXPIRED" ||
    (form.expiresAt && form.expiresAt <= new Date())
  ) {
    throw ApiError.conflict("This form is closed");
  }

  const result = buildAnswerSchema(form.fields).safeParse(answers);
  if (!result.success) {
    throw ApiError.badRequest(z.prettifyError(result.error));
  }

  return prisma.submission.create({
    data: { formId, userId, data: result.data as Prisma.InputJsonObject },
    select: { id: true, createdAt: true },
  });
}
