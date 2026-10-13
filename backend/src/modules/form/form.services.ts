import { prisma } from "../../prisma.js";
import { ApiError } from "../../common/api.error.js";
import { Prisma } from "../../../generated/prisma/client.js";
import type {
  CreateFormBody,
  AddFieldBody,
  UpdateFormBody,
  UpdateFieldBody,
} from "./form.model.js";

export async function createForm(userId: number, data: CreateFormBody) {
  const { title, description, fields, expiresAt } = data;

  const form = await prisma.form.create({
    data: {
      userId,
      title,
      description,
      expiresAt,
      fields: {
        create: fields.map((field, index) => ({ ...field, order: index })),
      },
    },
    include: { fields: { orderBy: { order: "asc" } } },
  });
  return form;
}

export async function getForms(userId: number) {
  const forms = await prisma.form.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { fields: true, submissions: true } } },
  });
  return forms;
}

export async function getFormById(formId: string, userId: number) {
  const form = await prisma.form.findFirst({
    where: { id: formId, userId },
    include: {
      fields: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!form) throw ApiError.notFound(`Form with ID ${formId} not found`);

  return form;
}

export async function deleteForm(formId: string, userId: number) {
  const { count } = await prisma.form.deleteMany({
    where: { id: formId, userId },
  });

  if (count === 0) throw ApiError.notFound(`Form with ID ${formId} not found`);
}

export async function updateForm(
  formId: string,
  userId: number,
  data: UpdateFormBody,
) {
  const form = await prisma.form.findFirst({ where: { id: formId, userId } });
  if (!form) throw ApiError.notFound("Form not found");

  if (form.status !== "DRAFT")
    throw ApiError.conflict("Only forms in draft can be changed");

  const { title, description, expiresAt } = data;
  const updatedForm = await prisma.form.update({
    where: { id: formId },
    data: { title, description, expiresAt },
  });

  return updatedForm;
}

export async function addField(
  formId: string,
  userId: number,
  data: AddFieldBody,
) {
  const form = await prisma.form.findFirst({ where: { id: formId, userId } });
  if (!form) throw ApiError.notFound("Form doesn't exist");

  if (form.status !== "DRAFT")
    throw ApiError.conflict("Only forms in DRAFT can be edited");

  const { _max } = await prisma.field.aggregate({
    where: { formId },
    _max: { order: true },
  });

  const order = (_max.order ?? -1) + 1;

  try {
    return await prisma.field.create({ data: { ...data, formId, order } });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      throw ApiError.conflict("A field with this label already exists");
    }
    throw e;
  }
}

export async function updateField(
  fieldId: string,
  formId: string,
  userId: number,
  data: UpdateFieldBody,
) {
  const field = await prisma.field.findFirst({
    where: { id: fieldId, formId, form: { userId } },
    include: { form: { select: { status: true } } },
  });

  if (!field) throw ApiError.notFound("This field doesn't exist");
  if (field.form.status !== "DRAFT")
    throw ApiError.conflict("Only forms in DRAFT can be edited");

  try {
    return await prisma.field.update({
      where: { id: fieldId },
      data: {
        label: data.label,
        required: data.required,
        type: data.type,
        config: data.config ?? Prisma.DbNull,
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      throw ApiError.conflict("A field with this label already exists");
    }
    throw e;
  }
}

export async function deleteField(
  fieldId: string,
  formId: string,
  userId: number,
) {
  const field = await prisma.field.findFirst({
    where: { id: fieldId, formId, form: { userId } },
    include: { form: { select: { status: true } } },
  });

  if (!field) throw ApiError.notFound("This field doesn't exist");
  if (field.form.status !== "DRAFT")
    throw ApiError.conflict("Only forms in DRAFT can be edited");

  await prisma.field.delete({ where: { id: fieldId } });
}

export async function publishForm(formId: string, userId: number) {
  const form = await prisma.form.findFirst({ where: { id: formId, userId } });
  if (!form) throw ApiError.notFound("Form doesn't exist");

  if (form.status === "EXPIRED")
    throw ApiError.conflict("Can't publish an expired form");
  if (form.status === "PUBLISHED") return form;

  const fieldsCount = await prisma.field.count({ where: { formId } });
  if (fieldsCount === 0)
    throw ApiError.conflict("Cannot publish a form without fields");

  const now = new Date();
  if (form.expiresAt && form.expiresAt <= now)
    throw ApiError.conflict("Cannot publish a form that has already expired");

  return await prisma.form.update({
    where: { id: formId },
    data: { status: "PUBLISHED" },
  });
}

export async function unpublishForm(formId: string, userId: number) {
  const form = await prisma.form.findFirst({ where: { id: formId, userId } });
  if (!form) throw ApiError.notFound("Form doesn't exist");

  if (form.status === "EXPIRED")
    throw ApiError.conflict("Can't unpublish an expired form");
  if (form.status === "DRAFT") return form;
  const { count } = await prisma.form.updateMany({
    where: {
      id: formId,
      userId,
      status: "PUBLISHED",
      submissions: { none: {} },
    },
    data: { status: "DRAFT" },
  });

  if (count === 0) {
    throw ApiError.conflict(
      "Cannot unpublish a form that has already received submissions",
    );
  }

  return prisma.form.findUnique({ where: { id: formId } });
}

export async function reorderFields(
  formId: string,
  userId: number,
  fieldIds: string[],
) {
  const form = await prisma.form.findFirst({
    where: { id: formId, userId },
    include: { fields: { select: { id: true } } },
  });

  if (!form) throw ApiError.notFound("Form not found");
  if (form.status !== "DRAFT") {
    throw ApiError.conflict("Only draft forms can be changed");
  }

  const given = new Set(fieldIds);
  const existing = new Set(form.fields.map((f) => f.id));

  const isValid =
    given.size === fieldIds.length && // no duplicates
    given.size === existing.size && // same count
    fieldIds.every((id) => existing.has(id)); // same IDs

  if (!isValid) {
    throw ApiError.badRequest(
      "fieldIds must list every field of this form exactly once",
    );
  }

  await prisma.$transaction(
    fieldIds.map((id, index) =>
      prisma.field.update({ where: { id }, data: { order: index } }),
    ),
  );
}