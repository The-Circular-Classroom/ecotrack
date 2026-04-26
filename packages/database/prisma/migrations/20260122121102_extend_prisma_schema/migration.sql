/*
  Warnings:

  - The primary key for the `item_type_tags` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `item_type_tags` table. All the data in the column will be lost.
  - You are about to drop the column `brand_supplier` on the `item_types` table. All the data in the column will be lost.
  - You are about to drop the column `colour` on the `item_types` table. All the data in the column will be lost.
  - You are about to drop the column `created_by_user_id` on the `item_types` table. All the data in the column will be lost.
  - You are about to drop the column `material` on the `item_types` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `item_types` table. All the data in the column will be lost.
  - The `gender` column on the `item_types` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `created_at` on the `schools` table. All the data in the column will be lost.
  - The `from_stored_at` column on the `transactions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `from_status` column on the `transactions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `created_at` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[item_type_id,size_option_id,item_status,stored_at]` on the table `inventory_balance` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `size_option_id` to the `inventory_balance` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `item_status` on the `inventory_balance` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `stored_at` on the `inventory_balance` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `category_name` on the `item_category_weights` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `primary_colour_id` to the `item_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size_category_id` to the `item_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size_option_id` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `to_stored_at` on the `transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `to_status` on the `transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `transaction_type` on the `transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `cognito_sub` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "storage_location" AS ENUM ('school', 'sponsor_office');

-- CreateEnum
CREATE TYPE "item_status" AS ENUM ('for_sale', 'sold', 'for_repurpose', 'repurposed', 'disposed');

-- CreateEnum
CREATE TYPE "transaction_types" AS ENUM ('donation_in', 'transfer', 'status_change', 'sale', 'repurposing', 'disposal');

-- CreateEnum
CREATE TYPE "gender" AS ENUM ('unisex', 'male', 'female');

-- CreateEnum
CREATE TYPE "size_type" AS ENUM ('alphabetical', 'numerical', 'one_size');

-- CreateEnum
CREATE TYPE "category_name" AS ENUM ('uniform_shirt', 'uniform_pants', 'uniform_shorts', 'uniform_skirt', 'house_shirt', 'pinafore', 'pe_shirt', 'pe_shorts', 'polo_shirt', 'tie', 'belt', 'cap', 'other_shirts', 'others');

-- DropForeignKey
ALTER TABLE "item_type_tags" DROP CONSTRAINT "item_type_tags_item_type_id_fkey";

-- DropForeignKey
ALTER TABLE "item_type_tags" DROP CONSTRAINT "item_type_tags_tag_id_fkey";

-- DropForeignKey
ALTER TABLE "item_types" DROP CONSTRAINT "item_types_created_by_user_id_fkey";

-- AlterTable
ALTER TABLE "inventory_balance" ADD COLUMN     "size_option_id" INTEGER NOT NULL,
DROP COLUMN "item_status",
ADD COLUMN     "item_status" "item_status" NOT NULL,
DROP COLUMN "stored_at",
ADD COLUMN     "stored_at" "storage_location" NOT NULL;

-- AlterTable
ALTER TABLE "item_category_weights" DROP COLUMN "category_name",
ADD COLUMN     "category_name" "category_name" NOT NULL;

-- AlterTable
ALTER TABLE "item_type_tags" DROP CONSTRAINT "item_type_tags_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "item_type_tags_pkey" PRIMARY KEY ("item_type_id", "tag_id");

-- AlterTable
ALTER TABLE "item_types" DROP COLUMN "brand_supplier",
DROP COLUMN "colour",
DROP COLUMN "created_by_user_id",
DROP COLUMN "material",
DROP COLUMN "size",
ADD COLUMN     "material_id" INTEGER,
ADD COLUMN     "pattern_id" INTEGER,
ADD COLUMN     "primary_colour_id" INTEGER NOT NULL,
ADD COLUMN     "secondary_colour_id" INTEGER,
ADD COLUMN     "size_category_id" INTEGER NOT NULL,
DROP COLUMN "gender",
ADD COLUMN     "gender" "gender";

-- AlterTable
ALTER TABLE "schools" DROP COLUMN "created_at",
ADD COLUMN     "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_cooperating" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "logo_url" VARCHAR(255);

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "size_option_id" INTEGER NOT NULL,
DROP COLUMN "from_stored_at",
ADD COLUMN     "from_stored_at" "storage_location",
DROP COLUMN "to_stored_at",
ADD COLUMN     "to_stored_at" "storage_location" NOT NULL,
DROP COLUMN "from_status",
ADD COLUMN     "from_status" "item_status",
DROP COLUMN "to_status",
ADD COLUMN     "to_status" "item_status" NOT NULL,
DROP COLUMN "transaction_type",
ADD COLUMN     "transaction_type" "transaction_types" NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "created_at",
ADD COLUMN     "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "cognito_sub" SET NOT NULL;

-- DropEnum
DROP TYPE "CategoryName";

-- DropEnum
DROP TYPE "Gender";

-- DropEnum
DROP TYPE "ItemStatus";

-- DropEnum
DROP TYPE "StorageLocation";

-- DropEnum
DROP TYPE "TransactionType";

-- CreateTable
CREATE TABLE "school_partnerships" (
    "id" SERIAL NOT NULL,
    "activity_name" VARCHAR(100) NOT NULL,
    "year_conducted" SMALLINT,
    "remarks" TEXT,
    "school_id" INTEGER NOT NULL,

    CONSTRAINT "school_partnerships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colours" (
    "id" SERIAL NOT NULL,
    "colour_name" VARCHAR(50) NOT NULL,
    "hexcode" VARCHAR(7) NOT NULL,

    CONSTRAINT "colours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patterns" (
    "id" SERIAL NOT NULL,
    "pattern_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" SERIAL NOT NULL,
    "material_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "size_categories" (
    "id" SERIAL NOT NULL,
    "brand_supplier" VARCHAR(50),
    "size_type" "size_type" NOT NULL,

    CONSTRAINT "size_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "size_options" (
    "id" SERIAL NOT NULL,
    "size_name" VARCHAR(50) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "size_category_id" INTEGER NOT NULL,

    CONSTRAINT "size_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "colours_colour_name_key" ON "colours"("colour_name");

-- CreateIndex
CREATE UNIQUE INDEX "colours_hexcode_key" ON "colours"("hexcode");

-- CreateIndex
CREATE UNIQUE INDEX "patterns_pattern_name_key" ON "patterns"("pattern_name");

-- CreateIndex
CREATE UNIQUE INDEX "materials_material_name_key" ON "materials"("material_name");

-- CreateIndex
CREATE UNIQUE INDEX "size_options_size_category_id_size_name_key" ON "size_options"("size_category_id", "size_name");

-- CreateIndex
CREATE INDEX "donation_drives_start_date_end_date_idx" ON "donation_drives"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "donation_drives_school_id_idx" ON "donation_drives"("school_id");

-- CreateIndex
CREATE INDEX "inventory_balance_item_type_id_idx" ON "inventory_balance"("item_type_id");

-- CreateIndex
CREATE INDEX "inventory_balance_stored_at_item_status_idx" ON "inventory_balance"("stored_at", "item_status");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_balance_item_type_id_size_option_id_item_status_s_key" ON "inventory_balance"("item_type_id", "size_option_id", "item_status", "stored_at");

-- CreateIndex
CREATE UNIQUE INDEX "item_category_weights_category_name_key" ON "item_category_weights"("category_name");

-- CreateIndex
CREATE INDEX "item_types_school_id_category_id_idx" ON "item_types"("school_id", "category_id");

-- CreateIndex
CREATE INDEX "item_types_primary_colour_id_idx" ON "item_types"("primary_colour_id");

-- CreateIndex
CREATE INDEX "item_types_gender_idx" ON "item_types"("gender");

-- CreateIndex
CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");

-- CreateIndex
CREATE INDEX "transactions_item_type_id_idx" ON "transactions"("item_type_id");

-- CreateIndex
CREATE INDEX "transactions_transaction_date_idx" ON "transactions"("transaction_date");

-- CreateIndex
CREATE INDEX "transactions_transaction_type_idx" ON "transactions"("transaction_type");

-- CreateIndex
CREATE INDEX "transactions_donation_drive_id_idx" ON "transactions"("donation_drive_id");

-- CreateIndex
CREATE INDEX "users_school_id_idx" ON "users"("school_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- AddForeignKey
ALTER TABLE "school_partnerships" ADD CONSTRAINT "school_partnerships_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_size_option_id_fkey" FOREIGN KEY ("size_option_id") REFERENCES "size_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_type_tags" ADD CONSTRAINT "item_type_tags_item_type_id_fkey" FOREIGN KEY ("item_type_id") REFERENCES "item_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_type_tags" ADD CONSTRAINT "item_type_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_types" ADD CONSTRAINT "item_types_primary_colour_id_fkey" FOREIGN KEY ("primary_colour_id") REFERENCES "colours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_types" ADD CONSTRAINT "item_types_secondary_colour_id_fkey" FOREIGN KEY ("secondary_colour_id") REFERENCES "colours"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_types" ADD CONSTRAINT "item_types_pattern_id_fkey" FOREIGN KEY ("pattern_id") REFERENCES "patterns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_types" ADD CONSTRAINT "item_types_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_types" ADD CONSTRAINT "item_types_size_category_id_fkey" FOREIGN KEY ("size_category_id") REFERENCES "size_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "size_options" ADD CONSTRAINT "size_options_size_category_id_fkey" FOREIGN KEY ("size_category_id") REFERENCES "size_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_balance" ADD CONSTRAINT "inventory_balance_size_option_id_fkey" FOREIGN KEY ("size_option_id") REFERENCES "size_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
