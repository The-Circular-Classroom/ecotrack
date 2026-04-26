/*
  Warnings:

  - Made the column `gender` on table `item_types` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "item_types" ALTER COLUMN "gender" SET NOT NULL,
ALTER COLUMN "gender" SET DEFAULT 'unisex';
