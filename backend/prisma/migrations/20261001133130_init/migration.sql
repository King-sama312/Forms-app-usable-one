/*
  Warnings:

  - A unique constraint covering the columns `[label]` on the table `Field` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Field_label_key" ON "Field"("label");
