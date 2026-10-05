/*
  Warnings:

  - A unique constraint covering the columns `[formId,label]` on the table `Field` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Field_label_key";

-- CreateIndex
CREATE UNIQUE INDEX "Field_formId_label_key" ON "Field"("formId", "label");
