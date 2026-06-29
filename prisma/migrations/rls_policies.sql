-- Row Level Security Policies for Supabase
-- Requirement 5.3: Admin full access, SchoolStaff read/write for their school,
-- PsgVolunteer read for their school, Parent read own record + transaction history
--
-- This migration enables RLS on all tables and creates role-based policies.
-- Roles are read from the Supabase JWT claims: current_setting('request.jwt.claims', true)::json->>'role'
-- The authenticated user's Supabase Auth UID is retrieved via auth.uid()

-- =============================================================================
-- HELPER: Get the current user's school_id from the users table
-- =============================================================================
CREATE OR REPLACE FUNCTION get_current_user_school_id()
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT school_id FROM users WHERE supabase_auth_id = auth.uid()
$$;

-- =============================================================================
-- HELPER: Get the current user's role from JWT claims
-- =============================================================================
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(current_setting('request.jwt.claims', true)::json->>'role', '')
$$;

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE colours ENABLE ROW LEVEL SECURITY;
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_category_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_type_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_suppliers ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- ADMIN POLICIES: Full access to all rows on all tables
-- =============================================================================

CREATE POLICY "admin_full_access" ON users
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');

CREATE POLICY "admin_full_access" ON schools
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');

CREATE POLICY "admin_full_access" ON donation_drives
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');

CREATE POLICY "admin_full_access" ON transactions
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');

CREATE POLICY "admin_full_access" ON item_types
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');

CREATE POLICY "admin_full_access" ON inventory_balance
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');

CREATE POLICY "admin_full_access" ON colours
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');

CREATE POLICY "admin_full_access" ON patterns
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');

CREATE POLICY "admin_full_access" ON materials
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');

CREATE POLICY "admin_full_access" ON size_categories
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');

CREATE POLICY "admin_full_access" ON size_options
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');

CREATE POLICY "admin_full_access" ON item_category_weights
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');

CREATE POLICY "admin_full_access" ON tags
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');

CREATE POLICY "admin_full_access" ON item_type_tags
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');

CREATE POLICY "admin_full_access" ON products
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');

CREATE POLICY "admin_full_access" ON product_types
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');

CREATE POLICY "admin_full_access" ON styles
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');

CREATE POLICY "admin_full_access" ON product_styles
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');

CREATE POLICY "admin_full_access" ON product_recipes
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');

CREATE POLICY "admin_full_access" ON recipe_ingredients
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');

CREATE POLICY "admin_full_access" ON school_partnerships
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');

CREATE POLICY "admin_full_access" ON brand_suppliers
  FOR ALL USING (get_current_user_role() = 'Admin')
  WITH CHECK (get_current_user_role() = 'Admin');


-- =============================================================================
-- SCHOOL STAFF POLICIES: Read/write rows belonging to their school
-- =============================================================================

-- users: staff can see users in their own school
CREATE POLICY "staff_school_access" ON users
  FOR ALL USING (
    get_current_user_role() = 'SchoolStaff'
    AND school_id = get_current_user_school_id()
  )
  WITH CHECK (
    get_current_user_role() = 'SchoolStaff'
    AND school_id = get_current_user_school_id()
  );

-- schools: staff can read/write their own school
CREATE POLICY "staff_school_access" ON schools
  FOR ALL USING (
    get_current_user_role() = 'SchoolStaff'
    AND id = get_current_user_school_id()
  )
  WITH CHECK (
    get_current_user_role() = 'SchoolStaff'
    AND id = get_current_user_school_id()
  );

-- donation_drives: staff can manage drives for their school
CREATE POLICY "staff_school_access" ON donation_drives
  FOR ALL USING (
    get_current_user_role() = 'SchoolStaff'
    AND school_id = get_current_user_school_id()
  )
  WITH CHECK (
    get_current_user_role() = 'SchoolStaff'
    AND school_id = get_current_user_school_id()
  );

-- transactions: staff can manage transactions for item types in their school
CREATE POLICY "staff_school_access" ON transactions
  FOR ALL USING (
    get_current_user_role() = 'SchoolStaff'
    AND item_type_id IN (
      SELECT id FROM item_types WHERE school_id = get_current_user_school_id()
    )
  )
  WITH CHECK (
    get_current_user_role() = 'SchoolStaff'
    AND item_type_id IN (
      SELECT id FROM item_types WHERE school_id = get_current_user_school_id()
    )
  );

-- item_types: staff can manage item types for their school
CREATE POLICY "staff_school_access" ON item_types
  FOR ALL USING (
    get_current_user_role() = 'SchoolStaff'
    AND school_id = get_current_user_school_id()
  )
  WITH CHECK (
    get_current_user_role() = 'SchoolStaff'
    AND school_id = get_current_user_school_id()
  );

-- inventory_balance: staff can manage balances for item types in their school
CREATE POLICY "staff_school_access" ON inventory_balance
  FOR ALL USING (
    get_current_user_role() = 'SchoolStaff'
    AND item_type_id IN (
      SELECT id FROM item_types WHERE school_id = get_current_user_school_id()
    )
  )
  WITH CHECK (
    get_current_user_role() = 'SchoolStaff'
    AND item_type_id IN (
      SELECT id FROM item_types WHERE school_id = get_current_user_school_id()
    )
  );

-- tags: staff can manage tags (shared resource, scoped via created_by_user_id school)
CREATE POLICY "staff_school_access" ON tags
  FOR ALL USING (
    get_current_user_role() = 'SchoolStaff'
    AND created_by_user_id IN (
      SELECT id FROM users WHERE school_id = get_current_user_school_id()
    )
  )
  WITH CHECK (
    get_current_user_role() = 'SchoolStaff'
    AND created_by_user_id IN (
      SELECT id FROM users WHERE school_id = get_current_user_school_id()
    )
  );

-- item_type_tags: staff can manage tags for item types in their school
CREATE POLICY "staff_school_access" ON item_type_tags
  FOR ALL USING (
    get_current_user_role() = 'SchoolStaff'
    AND item_type_id IN (
      SELECT id FROM item_types WHERE school_id = get_current_user_school_id()
    )
  )
  WITH CHECK (
    get_current_user_role() = 'SchoolStaff'
    AND item_type_id IN (
      SELECT id FROM item_types WHERE school_id = get_current_user_school_id()
    )
  );

-- products: staff can manage products for their school
CREATE POLICY "staff_school_access" ON products
  FOR ALL USING (
    get_current_user_role() = 'SchoolStaff'
    AND school_id = get_current_user_school_id()
  )
  WITH CHECK (
    get_current_user_role() = 'SchoolStaff'
    AND school_id = get_current_user_school_id()
  );

-- product_styles: staff can manage styles for products in their school
CREATE POLICY "staff_school_access" ON product_styles
  FOR ALL USING (
    get_current_user_role() = 'SchoolStaff'
    AND product_id IN (
      SELECT id FROM products WHERE school_id = get_current_user_school_id()
    )
  )
  WITH CHECK (
    get_current_user_role() = 'SchoolStaff'
    AND product_id IN (
      SELECT id FROM products WHERE school_id = get_current_user_school_id()
    )
  );

-- product_recipes: staff can manage recipes for product styles in their school
CREATE POLICY "staff_school_access" ON product_recipes
  FOR ALL USING (
    get_current_user_role() = 'SchoolStaff'
    AND product_style_id IN (
      SELECT ps.id FROM product_styles ps
      JOIN products p ON ps.product_id = p.id
      WHERE p.school_id = get_current_user_school_id()
    )
  )
  WITH CHECK (
    get_current_user_role() = 'SchoolStaff'
    AND product_style_id IN (
      SELECT ps.id FROM product_styles ps
      JOIN products p ON ps.product_id = p.id
      WHERE p.school_id = get_current_user_school_id()
    )
  );

-- recipe_ingredients: staff can manage ingredients for recipes in their school
CREATE POLICY "staff_school_access" ON recipe_ingredients
  FOR ALL USING (
    get_current_user_role() = 'SchoolStaff'
    AND recipe_id IN (
      SELECT pr.id FROM product_recipes pr
      JOIN product_styles ps ON pr.product_style_id = ps.id
      JOIN products p ON ps.product_id = p.id
      WHERE p.school_id = get_current_user_school_id()
    )
  )
  WITH CHECK (
    get_current_user_role() = 'SchoolStaff'
    AND recipe_id IN (
      SELECT pr.id FROM product_recipes pr
      JOIN product_styles ps ON pr.product_style_id = ps.id
      JOIN products p ON ps.product_id = p.id
      WHERE p.school_id = get_current_user_school_id()
    )
  );

-- school_partnerships: staff can manage partnerships for their school
CREATE POLICY "staff_school_access" ON school_partnerships
  FOR ALL USING (
    get_current_user_role() = 'SchoolStaff'
    AND school_id = get_current_user_school_id()
  )
  WITH CHECK (
    get_current_user_role() = 'SchoolStaff'
    AND school_id = get_current_user_school_id()
  );

-- Lookup/reference tables: staff can read all (these are shared across schools)
CREATE POLICY "staff_read_colours" ON colours
  FOR SELECT USING (get_current_user_role() = 'SchoolStaff');

CREATE POLICY "staff_read_patterns" ON patterns
  FOR SELECT USING (get_current_user_role() = 'SchoolStaff');

CREATE POLICY "staff_read_materials" ON materials
  FOR SELECT USING (get_current_user_role() = 'SchoolStaff');

CREATE POLICY "staff_read_size_categories" ON size_categories
  FOR SELECT USING (get_current_user_role() = 'SchoolStaff');

CREATE POLICY "staff_read_size_options" ON size_options
  FOR SELECT USING (get_current_user_role() = 'SchoolStaff');

CREATE POLICY "staff_read_item_category_weights" ON item_category_weights
  FOR SELECT USING (get_current_user_role() = 'SchoolStaff');

CREATE POLICY "staff_read_product_types" ON product_types
  FOR SELECT USING (get_current_user_role() = 'SchoolStaff');

CREATE POLICY "staff_read_styles" ON styles
  FOR SELECT USING (get_current_user_role() = 'SchoolStaff');

CREATE POLICY "staff_read_brand_suppliers" ON brand_suppliers
  FOR SELECT USING (get_current_user_role() = 'SchoolStaff');


-- =============================================================================
-- PSG VOLUNTEER POLICIES: Read rows belonging to their school (read-only)
-- =============================================================================

-- users: volunteers can see users in their own school
CREATE POLICY "volunteer_school_read" ON users
  FOR SELECT USING (
    get_current_user_role() = 'PsgVolunteer'
    AND school_id = get_current_user_school_id()
  );

-- schools: volunteers can read their own school
CREATE POLICY "volunteer_school_read" ON schools
  FOR SELECT USING (
    get_current_user_role() = 'PsgVolunteer'
    AND id = get_current_user_school_id()
  );

-- donation_drives: volunteers can read drives for their school
CREATE POLICY "volunteer_school_read" ON donation_drives
  FOR SELECT USING (
    get_current_user_role() = 'PsgVolunteer'
    AND school_id = get_current_user_school_id()
  );

-- transactions: volunteers can read transactions for item types in their school
CREATE POLICY "volunteer_school_read" ON transactions
  FOR SELECT USING (
    get_current_user_role() = 'PsgVolunteer'
    AND item_type_id IN (
      SELECT id FROM item_types WHERE school_id = get_current_user_school_id()
    )
  );

-- item_types: volunteers can read item types for their school
CREATE POLICY "volunteer_school_read" ON item_types
  FOR SELECT USING (
    get_current_user_role() = 'PsgVolunteer'
    AND school_id = get_current_user_school_id()
  );

-- inventory_balance: volunteers can read balances for item types in their school
CREATE POLICY "volunteer_school_read" ON inventory_balance
  FOR SELECT USING (
    get_current_user_role() = 'PsgVolunteer'
    AND item_type_id IN (
      SELECT id FROM item_types WHERE school_id = get_current_user_school_id()
    )
  );

-- tags: volunteers can read tags created by users in their school
CREATE POLICY "volunteer_school_read" ON tags
  FOR SELECT USING (
    get_current_user_role() = 'PsgVolunteer'
    AND created_by_user_id IN (
      SELECT id FROM users WHERE school_id = get_current_user_school_id()
    )
  );

-- item_type_tags: volunteers can read tags for item types in their school
CREATE POLICY "volunteer_school_read" ON item_type_tags
  FOR SELECT USING (
    get_current_user_role() = 'PsgVolunteer'
    AND item_type_id IN (
      SELECT id FROM item_types WHERE school_id = get_current_user_school_id()
    )
  );

-- products: volunteers can read products for their school
CREATE POLICY "volunteer_school_read" ON products
  FOR SELECT USING (
    get_current_user_role() = 'PsgVolunteer'
    AND school_id = get_current_user_school_id()
  );

-- product_styles: volunteers can read styles for products in their school
CREATE POLICY "volunteer_school_read" ON product_styles
  FOR SELECT USING (
    get_current_user_role() = 'PsgVolunteer'
    AND product_id IN (
      SELECT id FROM products WHERE school_id = get_current_user_school_id()
    )
  );

-- product_recipes: volunteers can read recipes for product styles in their school
CREATE POLICY "volunteer_school_read" ON product_recipes
  FOR SELECT USING (
    get_current_user_role() = 'PsgVolunteer'
    AND product_style_id IN (
      SELECT ps.id FROM product_styles ps
      JOIN products p ON ps.product_id = p.id
      WHERE p.school_id = get_current_user_school_id()
    )
  );

-- recipe_ingredients: volunteers can read ingredients for recipes in their school
CREATE POLICY "volunteer_school_read" ON recipe_ingredients
  FOR SELECT USING (
    get_current_user_role() = 'PsgVolunteer'
    AND recipe_id IN (
      SELECT pr.id FROM product_recipes pr
      JOIN product_styles ps ON pr.product_style_id = ps.id
      JOIN products p ON ps.product_id = p.id
      WHERE p.school_id = get_current_user_school_id()
    )
  );

-- school_partnerships: volunteers can read partnerships for their school
CREATE POLICY "volunteer_school_read" ON school_partnerships
  FOR SELECT USING (
    get_current_user_role() = 'PsgVolunteer'
    AND school_id = get_current_user_school_id()
  );

-- Lookup/reference tables: volunteers can read all (shared across schools)
CREATE POLICY "volunteer_read_colours" ON colours
  FOR SELECT USING (get_current_user_role() = 'PsgVolunteer');

CREATE POLICY "volunteer_read_patterns" ON patterns
  FOR SELECT USING (get_current_user_role() = 'PsgVolunteer');

CREATE POLICY "volunteer_read_materials" ON materials
  FOR SELECT USING (get_current_user_role() = 'PsgVolunteer');

CREATE POLICY "volunteer_read_size_categories" ON size_categories
  FOR SELECT USING (get_current_user_role() = 'PsgVolunteer');

CREATE POLICY "volunteer_read_size_options" ON size_options
  FOR SELECT USING (get_current_user_role() = 'PsgVolunteer');

CREATE POLICY "volunteer_read_item_category_weights" ON item_category_weights
  FOR SELECT USING (get_current_user_role() = 'PsgVolunteer');

CREATE POLICY "volunteer_read_product_types" ON product_types
  FOR SELECT USING (get_current_user_role() = 'PsgVolunteer');

CREATE POLICY "volunteer_read_styles" ON styles
  FOR SELECT USING (get_current_user_role() = 'PsgVolunteer');

CREATE POLICY "volunteer_read_brand_suppliers" ON brand_suppliers
  FOR SELECT USING (get_current_user_role() = 'PsgVolunteer');


-- =============================================================================
-- PARENT POLICIES: Read own user record and transaction history only
-- =============================================================================

-- users: parents can read only their own record
CREATE POLICY "parent_own_record" ON users
  FOR SELECT USING (
    get_current_user_role() = 'Parent'
    AND supabase_auth_id = auth.uid()
  );

-- transactions: parents can read only their own transactions
CREATE POLICY "parent_own_transactions" ON transactions
  FOR SELECT USING (
    get_current_user_role() = 'Parent'
    AND user_id = (
      SELECT id FROM users WHERE supabase_auth_id = auth.uid()
    )
  );

-- Parents need read access to lookup tables to make sense of their transaction data
-- item_types: parents can read item types referenced in their transactions
CREATE POLICY "parent_read_item_types" ON item_types
  FOR SELECT USING (
    get_current_user_role() = 'Parent'
    AND id IN (
      SELECT item_type_id FROM transactions
      WHERE user_id = (SELECT id FROM users WHERE supabase_auth_id = auth.uid())
    )
  );

-- inventory_balance: no access for parents (not needed)
-- No policy created means no access when RLS is enabled

-- donation_drives: parents can read drives referenced in their transactions
CREATE POLICY "parent_read_donation_drives" ON donation_drives
  FOR SELECT USING (
    get_current_user_role() = 'Parent'
    AND id IN (
      SELECT donation_drive_id FROM transactions
      WHERE user_id = (SELECT id FROM users WHERE supabase_auth_id = auth.uid())
      AND donation_drive_id IS NOT NULL
    )
  );

-- Lookup/reference tables: parents can read all (needed for display purposes)
CREATE POLICY "parent_read_colours" ON colours
  FOR SELECT USING (get_current_user_role() = 'Parent');

CREATE POLICY "parent_read_patterns" ON patterns
  FOR SELECT USING (get_current_user_role() = 'Parent');

CREATE POLICY "parent_read_materials" ON materials
  FOR SELECT USING (get_current_user_role() = 'Parent');

CREATE POLICY "parent_read_size_categories" ON size_categories
  FOR SELECT USING (get_current_user_role() = 'Parent');

CREATE POLICY "parent_read_size_options" ON size_options
  FOR SELECT USING (get_current_user_role() = 'Parent');

CREATE POLICY "parent_read_item_category_weights" ON item_category_weights
  FOR SELECT USING (get_current_user_role() = 'Parent');

-- schools: parents can read their own school
CREATE POLICY "parent_read_own_school" ON schools
  FOR SELECT USING (
    get_current_user_role() = 'Parent'
    AND id = get_current_user_school_id()
  );

-- =============================================================================
-- SERVICE ROLE BYPASS
-- Note: The Supabase service_role key bypasses RLS by default.
-- Application-level queries using the service role (admin operations,
-- background jobs) are not restricted by these policies.
-- =============================================================================
