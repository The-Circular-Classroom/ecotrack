/*
  Warnings:

  - A unique constraint covering the columns `[school_name]` on the table `schools` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "school_email" VARCHAR(255),
ADD COLUMN     "school_number" VARCHAR(50),
ADD COLUMN     "type_code" VARCHAR(50),
ALTER COLUMN "logo_url" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "user_flags" JSONB DEFAULT '{"onboarding_completed": false}',
ALTER COLUMN "role" SET DEFAULT 'parent',
ALTER COLUMN "number_child" SET DEFAULT 0,
ALTER COLUMN "child_details" SET DEFAULT '[]';

-- CreateIndex
CREATE UNIQUE INDEX "schools_school_name_key" ON "schools"("school_name");
