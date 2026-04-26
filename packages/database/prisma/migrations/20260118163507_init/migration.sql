-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'school_staff', 'parent', 'psg_volunteer');

-- CreateEnum
CREATE TYPE "StorageLocation" AS ENUM ('school', 'sponsor_office');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('for_sale', 'sold', 'for_repurpose', 'repurposed', 'disposed');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('donation_in', 'transfer', 'status_change', 'sale', 'repurposing', 'disposal');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('unisex', 'male', 'female');

-- CreateEnum
CREATE TYPE "CategoryName" AS ENUM ('uniform_shirt', 'uniform_pants', 'uniform_shorts', 'uniform_skirt', 'house_shirt', 'pinafore', 'pe_shirt', 'pe_shorts', 'polo_shirt', 'tie', 'belt', 'cap', 'other_shirts', 'others');

-- CreateTable
CREATE TABLE "schools" (
    "id" SERIAL NOT NULL,
    "school_name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255),
    "mrt_desc" VARCHAR(255),
    "dgp_code" VARCHAR(100),
    "mainlevel_code" VARCHAR(50),
    "nature_code" VARCHAR(50),
    "postal_code" VARCHAR(50),
    "zone_code" VARCHAR(50),
    "status" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "cognito_sub" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(50),
    "first_name" VARCHAR(255),
    "last_name" VARCHAR(255),
    "full_name" VARCHAR(255),
    "role" "user_role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "organisation" VARCHAR(255),
    "number_child" INTEGER,
    "child_details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3),
    "school_id" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_drives" (
    "id" SERIAL NOT NULL,
    "drive_name" VARCHAR(255) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "school_id" INTEGER,
    "created_by_user_id" INTEGER NOT NULL,

    CONSTRAINT "donation_drives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "from_stored_at" "StorageLocation",
    "to_stored_at" "StorageLocation" NOT NULL,
    "from_status" "ItemStatus",
    "to_status" "ItemStatus" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "item_type_id" INTEGER NOT NULL,
    "donation_drive_id" INTEGER,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "tag_name" VARCHAR(50) NOT NULL,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" INTEGER NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_type_tags" (
    "id" SERIAL NOT NULL,
    "item_type_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "item_type_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_types" (
    "id" SERIAL NOT NULL,
    "gender" "Gender",
    "material" VARCHAR(100),
    "colour" VARCHAR(50),
    "size" VARCHAR(10),
    "image_url" VARCHAR(500),
    "brand_supplier" VARCHAR(50),
    "created_by_user_id" INTEGER,
    "school_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "item_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_category_weights" (
    "id" SERIAL NOT NULL,
    "category_name" "CategoryName" NOT NULL,
    "weight_kg" DECIMAL(5,3) NOT NULL,

    CONSTRAINT "item_category_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_balance" (
    "id" SERIAL NOT NULL,
    "item_status" "ItemStatus" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "stored_at" "StorageLocation" NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "item_type_id" INTEGER NOT NULL,

    CONSTRAINT "inventory_balance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_cognito_sub_key" ON "users"("cognito_sub");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tags_tag_name_key" ON "tags"("tag_name");

-- CreateIndex
CREATE UNIQUE INDEX "item_category_weights_category_name_key" ON "item_category_weights"("category_name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_drives" ADD CONSTRAINT "donation_drives_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_drives" ADD CONSTRAINT "donation_drives_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_item_type_id_fkey" FOREIGN KEY ("item_type_id") REFERENCES "item_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_donation_drive_id_fkey" FOREIGN KEY ("donation_drive_id") REFERENCES "donation_drives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_type_tags" ADD CONSTRAINT "item_type_tags_item_type_id_fkey" FOREIGN KEY ("item_type_id") REFERENCES "item_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_type_tags" ADD CONSTRAINT "item_type_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_types" ADD CONSTRAINT "item_types_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_types" ADD CONSTRAINT "item_types_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_types" ADD CONSTRAINT "item_types_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "item_category_weights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_balance" ADD CONSTRAINT "inventory_balance_item_type_id_fkey" FOREIGN KEY ("item_type_id") REFERENCES "item_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
