/*
  Warnings:

  - The values [sponsor_office] on the enum `storage_location` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "storage_location_new" AS ENUM ('school', 'tcc', 'exited');
ALTER TABLE "transactions" ALTER COLUMN "from_stored_at" TYPE "storage_location_new" USING ("from_stored_at"::text::"storage_location_new");
ALTER TABLE "transactions" ALTER COLUMN "to_stored_at" TYPE "storage_location_new" USING ("to_stored_at"::text::"storage_location_new");
ALTER TABLE "inventory_balance" ALTER COLUMN "stored_at" TYPE "storage_location_new" USING ("stored_at"::text::"storage_location_new");
ALTER TYPE "storage_location" RENAME TO "storage_location_old";
ALTER TYPE "storage_location_new" RENAME TO "storage_location";
DROP TYPE "public"."storage_location_old";
COMMIT;

-- AlterTable
ALTER TABLE "product_recipes" ALTER COLUMN "recipe_name" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "product_types" ALTER COLUMN "type_name" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "product_name" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "styles" ALTER COLUMN "style_name" SET DATA TYPE VARCHAR(500);
