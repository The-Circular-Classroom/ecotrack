/*
  Warnings:

  - You are about to drop the column `brand_supplier` on the `size_categories` table. All the data in the column will be lost.
  - You are about to drop the column `organisation` on the `users` table. All the data in the column will be lost.
  - Changed the type of `category_name` on the `item_category_weights` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "size_class" AS ENUM ('S', 'L');

-- AlterTable
-- Safe type conversion without dropping data
ALTER TABLE "item_category_weights" 
  ALTER COLUMN "category_name" TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "item_types" ADD COLUMN     "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "size_categories" DROP COLUMN "brand_supplier",
ADD COLUMN     "brand_supplier_id" INTEGER;

-- AlterTable
ALTER TABLE "size_options" ADD COLUMN     "size_class" "size_class" NOT NULL DEFAULT 'S';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "organisation";

-- DropEnum
DROP TYPE "category_name";

-- CreateTable
CREATE TABLE "brand_suppliers" (
    "id" SERIAL NOT NULL,
    "brand_supplier" VARCHAR(50) NOT NULL,

    CONSTRAINT "brand_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "product_name" VARCHAR(50) NOT NULL,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "product_type_id" INTEGER NOT NULL,
    "school_id" INTEGER,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_types" (
    "id" SERIAL NOT NULL,
    "type_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "product_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "styles" (
    "id" SERIAL NOT NULL,
    "style_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_styles" (
    "id" SERIAL NOT NULL,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "image_url" VARCHAR(500),
    "style_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "product_styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_recipes" (
    "id" SERIAL NOT NULL,
    "recipe_name" VARCHAR(50) NOT NULL,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "product_style_id" INTEGER NOT NULL,

    CONSTRAINT "product_recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" SERIAL NOT NULL,
    "quantity_required" DECIMAL(5,1) NOT NULL,
    "size_class" "size_class",
    "recipe_id" INTEGER NOT NULL,
    "item_type_id" INTEGER NOT NULL,

    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brand_suppliers_brand_supplier_key" ON "brand_suppliers"("brand_supplier");

-- CreateIndex
CREATE INDEX "products_product_type_id_idx" ON "products"("product_type_id");

-- CreateIndex
CREATE INDEX "products_school_id_idx" ON "products"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_types_type_name_key" ON "product_types"("type_name");

-- CreateIndex
CREATE UNIQUE INDEX "styles_style_name_key" ON "styles"("style_name");

-- CreateIndex
CREATE INDEX "product_styles_style_id_idx" ON "product_styles"("style_id");

-- CreateIndex
CREATE INDEX "product_styles_product_id_idx" ON "product_styles"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_styles_product_id_style_id_key" ON "product_styles"("product_id", "style_id");

-- CreateIndex
CREATE INDEX "product_recipes_product_style_id_idx" ON "product_recipes"("product_style_id");

-- CreateIndex
CREATE INDEX "recipe_ingredients_recipe_id_idx" ON "recipe_ingredients"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_ingredients_item_type_id_idx" ON "recipe_ingredients"("item_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_ingredients_recipe_id_item_type_id_key" ON "recipe_ingredients"("recipe_id", "item_type_id");

-- AddForeignKey
ALTER TABLE "size_categories" ADD CONSTRAINT "size_categories_brand_supplier_id_fkey" FOREIGN KEY ("brand_supplier_id") REFERENCES "brand_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_styles" ADD CONSTRAINT "product_styles_style_id_fkey" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_styles" ADD CONSTRAINT "product_styles_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_recipes" ADD CONSTRAINT "product_recipes_product_style_id_fkey" FOREIGN KEY ("product_style_id") REFERENCES "product_styles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "product_recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_item_type_id_fkey" FOREIGN KEY ("item_type_id") REFERENCES "item_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
