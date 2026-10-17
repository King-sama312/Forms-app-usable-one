import { z } from "zod";
import { prisma } from "../../prisma.js";
import { ApiError } from "../../common/api.error.js";
import {
  buildAnswerSchema,
  type ListSubmissionsQuery,
} from "./submission.model.js";
import { Prisma } from "../../../generated/prisma/client.js";

// Submit Form
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

  if (form.requireLogin && userId === null) {
    throw ApiError.unauthorized("You must log in to answer this form");
  }

  if (form.singleResponse && userId !== null) {
    const existing = await prisma.submission.findFirst({
      where: { formId, userId },
      select: { id: true },
    });
    if (existing) throw ApiError.conflict("You already answered this form");
  }

  const result = buildAnswerSchema(form.fields).safeParse(answers);
  if (!result.success) {
    throw ApiError.badRequest(z.prettifyError(result.error));
  }

    try {
    return await prisma.submission.create({
      data: {
        formId,
        userId,
        singleUserId: form.singleResponse ? userId : null,
        data: result.data as Prisma.InputJsonObject,
      },
      select: { id: true, createdAt: true },
    });
  } catch (e) {
    // the double-click case: the database refuses the second row
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw ApiError.conflict("You already answered this form");
    }
    throw e;
  }
}

// Get Submissions
export async function getSubmissions(
  formId: string,
  userId: number,
  { page, limit }: ListSubmissionsQuery,
) {
  const form = await prisma.form.findFirst({
    where: { id: formId, userId },
    select: { id: true },
  });
  if (!form) throw ApiError.notFound("Form not found");

  const [submissions, total] = await prisma.$transaction([
    prisma.submission.findMany({
      where: { formId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.submission.count({ where: { formId } }),
  ]);

  return { submissions, total, page, limit };
}

// Get Submission by ID
export async function getSubmissionById(
  formId: string,
  submissionId: string,
  userId: number,
) {
  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, formId, form: { userId } },
  });
  if (!submission) throw ApiError.notFound("Submission not found");

  return submission;
}

// Delete Submission
export async function deleteSubmission(
  formId: string,
  submissionId: string,
  userId: number,
) {
  const { count } = await prisma.submission.deleteMany({
    where: { id: submissionId, formId, form: { userId } },
  });
  if (count === 0) throw ApiError.notFound("Submission not found");
}
