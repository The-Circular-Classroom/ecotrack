-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'school_staff', 'parent', 'psg_volunteer');

-- CreateEnum
CREATE TYPE "storage_location" AS ENUM ('school', 'tcc', 'exited');

-- CreateEnum
CREATE TYPE "item_status" AS ENUM ('general_office', 'for_sale', 'sold', 'for_repurpose', 'repurposed', 'disposed');

-- CreateEnum
CREATE TYPE "transaction_types" AS ENUM ('donation_in', 'transfer', 'status_change', 'sale', 'repurposing', 'disposal');

-- CreateEnum
CREATE TYPE "gender" AS ENUM ('unisex', 'male', 'female');

-- CreateEnum
CREATE TYPE "size_type" AS ENUM ('alphabetical', 'numerical', 'one_size');

-- CreateEnum
CREATE TYPE "size_class" AS ENUM ('S', 'L');

-- CreateTable
CREATE TABLE "schools" (
    "id" SERIAL NOT NULL,
    "school_name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255),
    "mrt_desc" VARCHAR(255),
    "dgp_code" VARCHAR(100),
    "mainlevel_code" VARCHAR(50),
    "nature_code" VARCHAR(50),
    "type_code" VARCHAR(50),
    "postal_code" VARCHAR(50),
    "zone_code" VARCHAR(50),
    "status" VARCHAR(50),
    "logo_url" TEXT,
    "is_cooperating" BOOLEAN NOT NULL DEFAULT false,
    "school_email" VARCHAR(255),
    "school_number" VARCHAR(50),
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "supabase_auth_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(50),
    "first_name" VARCHAR(255),
    "last_name" VARCHAR(255),
    "full_name" VARCHAR(255),
    "role" "user_role" NOT NULL DEFAULT 'parent',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "user_flags" JSONB DEFAULT '{"onboarding_completed": false}',
    "number_child" INTEGER DEFAULT 0,
    "child_details" JSONB DEFAULT '[]',
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "from_stored_at" "storage_location",
    "to_stored_at" "storage_location",
    "from_status" "item_status",
    "to_status" "item_status" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "transaction_type" "transaction_types" NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "item_type_id" INTEGER NOT NULL,
    "size_option_id" INTEGER NOT NULL,
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
    "item_type_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "item_type_tags_pkey" PRIMARY KEY ("item_type_id","tag_id")
);

-- CreateTable
CREATE TABLE "item_types" (
    "id" SERIAL NOT NULL,
    "gender" "gender" NOT NULL DEFAULT 'unisex',
    "image_url" VARCHAR(500),
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "school_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "primary_colour_id" INTEGER NOT NULL,
    "secondary_colour_id" INTEGER,
    "pattern_id" INTEGER,
    "material_id" INTEGER,
    "size_category_id" INTEGER NOT NULL,

    CONSTRAINT "item_types_pkey" PRIMARY KEY ("id")
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
    "size_type" "size_type" NOT NULL,
    "brand_supplier_id" INTEGER,

    CONSTRAINT "size_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_suppliers" (
    "id" SERIAL NOT NULL,
    "brand_supplier" VARCHAR(50) NOT NULL,

    CONSTRAINT "brand_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "size_options" (
    "id" SERIAL NOT NULL,
    "size_name" VARCHAR(50) NOT NULL,
    "size_class" "size_class" NOT NULL DEFAULT 'S',
    "sort_order" INTEGER NOT NULL,
    "size_category_id" INTEGER NOT NULL,

    CONSTRAINT "size_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_category_weights" (
    "id" SERIAL NOT NULL,
    "category_name" VARCHAR(100) NOT NULL,
    "weight_kg" DECIMAL(5,3) NOT NULL,

    CONSTRAINT "item_category_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_balance" (
    "id" SERIAL NOT NULL,
    "item_status" "item_status" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "stored_at" "storage_location" NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "item_type_id" INTEGER NOT NULL,
    "size_option_id" INTEGER NOT NULL,

    CONSTRAINT "inventory_balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "product_name" VARCHAR(500) NOT NULL,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "product_type_id" INTEGER NOT NULL,
    "school_id" INTEGER,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_types" (
    "id" SERIAL NOT NULL,
    "type_name" VARCHAR(500) NOT NULL,

    CONSTRAINT "product_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "styles" (
    "id" SERIAL NOT NULL,
    "style_name" VARCHAR(500) NOT NULL,

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
    "recipe_name" VARCHAR(500) NOT NULL,
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
CREATE UNIQUE INDEX "schools_school_name_key" ON "schools"("school_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_supabase_auth_id_key" ON "users"("supabase_auth_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_school_id_idx" ON "users"("school_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "donation_drives_start_date_end_date_idx" ON "donation_drives"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "donation_drives_school_id_idx" ON "donation_drives"("school_id");

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
CREATE UNIQUE INDEX "tags_tag_name_key" ON "tags"("tag_name");

-- CreateIndex
CREATE INDEX "item_types_school_id_category_id_idx" ON "item_types"("school_id", "category_id");

-- CreateIndex
CREATE INDEX "item_types_primary_colour_id_idx" ON "item_types"("primary_colour_id");

-- CreateIndex
CREATE INDEX "item_types_gender_idx" ON "item_types"("gender");

-- CreateIndex
CREATE UNIQUE INDEX "colours_colour_name_key" ON "colours"("colour_name");

-- CreateIndex
CREATE UNIQUE INDEX "colours_hexcode_key" ON "colours"("hexcode");

-- CreateIndex
CREATE UNIQUE INDEX "patterns_pattern_name_key" ON "patterns"("pattern_name");

-- CreateIndex
CREATE UNIQUE INDEX "materials_material_name_key" ON "materials"("material_name");

-- CreateIndex
CREATE UNIQUE INDEX "brand_suppliers_brand_supplier_key" ON "brand_suppliers"("brand_supplier");

-- CreateIndex
CREATE UNIQUE INDEX "size_options_size_category_id_size_name_key" ON "size_options"("size_category_id", "size_name");

-- CreateIndex
CREATE UNIQUE INDEX "item_category_weights_category_name_key" ON "item_category_weights"("category_name");

-- CreateIndex
CREATE INDEX "inventory_balance_item_type_id_idx" ON "inventory_balance"("item_type_id");

-- CreateIndex
CREATE INDEX "inventory_balance_stored_at_item_status_idx" ON "inventory_balance"("stored_at", "item_status");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_balance_item_type_id_size_option_id_item_status_s_key" ON "inventory_balance"("item_type_id", "size_option_id", "item_status", "stored_at");

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
ALTER TABLE "school_partnerships" ADD CONSTRAINT "school_partnerships_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_drives" ADD CONSTRAINT "donation_drives_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_drives" ADD CONSTRAINT "donation_drives_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_item_type_id_fkey" FOREIGN KEY ("item_type_id") REFERENCES "item_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_size_option_id_fkey" FOREIGN KEY ("size_option_id") REFERENCES "size_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_donation_drive_id_fkey" FOREIGN KEY ("donation_drive_id") REFERENCES "donation_drives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_type_tags" ADD CONSTRAINT "item_type_tags_item_type_id_fkey" FOREIGN KEY ("item_type_id") REFERENCES "item_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_type_tags" ADD CONSTRAINT "item_type_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_types" ADD CONSTRAINT "item_types_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_types" ADD CONSTRAINT "item_types_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "item_category_weights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "size_categories" ADD CONSTRAINT "size_categories_brand_supplier_id_fkey" FOREIGN KEY ("brand_supplier_id") REFERENCES "brand_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "size_options" ADD CONSTRAINT "size_options_size_category_id_fkey" FOREIGN KEY ("size_category_id") REFERENCES "size_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_balance" ADD CONSTRAINT "inventory_balance_item_type_id_fkey" FOREIGN KEY ("item_type_id") REFERENCES "item_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_balance" ADD CONSTRAINT "inventory_balance_size_option_id_fkey" FOREIGN KEY ("size_option_id") REFERENCES "size_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
