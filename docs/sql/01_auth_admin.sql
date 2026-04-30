-- -----------------------------------------
-- 1. EXTENSIONS
-- -----------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------
-- 2. ENUMS
-- -----------------------------------------
CREATE TYPE admin_role AS ENUM ('super_admin', 'test_admin');

-- -----------------------------------------
-- 3. TABLES
-- -----------------------------------------

-- ADMINS
CREATE TABLE IF NOT EXISTS admins (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role           admin_role NOT NULL,
  full_name      text,
  contact_number text,
  avatar_url     text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email      text NOT NULL UNIQUE,
  full_name  text,
  phone      text,
  status     text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------
-- 4. INDEXES
-- -----------------------------------------
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email   ON customers(email);

-- -----------------------------------------
-- 5. ENABLE ROW LEVEL SECURITY
-- -----------------------------------------
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------
-- 6. HELPER FUNCTIONS (for RLS)
-- -----------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid() AND role = 'super_admin'::admin_role
  );
$$;

-- -----------------------------------------
-- 7. TRIGGERS
-- -----------------------------------------

-- auto-create customer record on every new signup
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.customers (user_id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_customer_created ON auth.users;
CREATE TRIGGER on_customer_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_customer();

-- -----------------------------------------
-- 8. CREATE RLS POLICIES
-- -----------------------------------------

-- admins
CREATE POLICY "admins read own record"
  ON admins FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "admins read all admins"
  ON admins FOR SELECT USING (public.is_admin());
CREATE POLICY "super admin modify admins"
  ON admins FOR ALL USING (public.is_super_admin());

-- customers
CREATE POLICY "customers read own record"
  ON customers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "admins read customers"
  ON customers FOR SELECT USING (public.is_admin());
CREATE POLICY "super admin modify customers"
  ON customers FOR ALL USING (public.is_super_admin());
