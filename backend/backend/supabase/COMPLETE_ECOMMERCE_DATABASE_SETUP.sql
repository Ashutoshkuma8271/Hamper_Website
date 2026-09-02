-- ==============================================================================
-- COMPLETE E-COMMERCE & VENDOR GIFTING PLATFORM DATABASE SCHEMA
-- Supabase PostgreSQL Setup
-- Run this script in Supabase Dashboard > SQL Editor to initialize all tables,
-- triggers, indexes, and RLS policies for Users, Vendors, Admins, Products,
-- Hampers, Orders, Cart, Reviews, Coupons, and Admin Controls.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. HELPER FUNCTIONS
-- ------------------------------------------------------------------------------

-- Check if current authenticated user has 'admin' role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Check if current authenticated user has 'vendor' role
CREATE OR REPLACE FUNCTION public.is_vendor()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'vendor'
  );
$$;

-- ------------------------------------------------------------------------------
-- 2. USER PROFILES & ROLE-BASED TABLES
-- ------------------------------------------------------------------------------

-- Unified Profiles table storing all registered users with role separation
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'vendor', 'user')),
  full_name text,
  business_name text,
  shop_no text,
  gst_no text,
  phone text,
  avatar_url text,
  admin_requested boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Dedicated Customer Accounts Directory
CREATE TABLE IF NOT EXISTS public.customer_accounts (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Dedicated Vendor Profiles Directory
CREATE TABLE IF NOT EXISTS public.vendor_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  business_name text NOT NULL,
  shop_no text NOT NULL,
  gst_no text,
  phone text,
  address text,
  is_verified boolean NOT NULL DEFAULT true,
  rating numeric DEFAULT 5.0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Dedicated Admin Accounts Directory
CREATE TABLE IF NOT EXISTS public.admin_accounts (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  approved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. AUTOMATED USER / VENDOR / ADMIN LOGIN & SIGNUP TRIGGER
-- Automatically records email & creates profile/role entry when user logs in / registers
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account_type text;
  has_admin boolean;
  user_full_name text;
  user_biz_name text;
  user_shop_no text;
  user_gst_no text;
  user_phone text;
  final_role text;
BEGIN
  PERFORM pg_advisory_xact_lock(8182026);
  
  -- Auto-confirm email for Google OAuth & Email Signups
  IF NEW.email_confirmed_at IS NULL THEN
    UPDATE auth.users SET email_confirmed_at = now() WHERE id = NEW.id;
  END IF;

  account_type := COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'user');
  user_full_name := NEW.raw_user_meta_data ->> 'full_name';
  user_biz_name := NEW.raw_user_meta_data ->> 'business_name';
  user_shop_no := NEW.raw_user_meta_data ->> 'shop_no';
  user_gst_no := NEW.raw_user_meta_data ->> 'gst_no';
  user_phone := NEW.raw_user_meta_data ->> 'phone';

  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') INTO has_admin;

  -- Determine user role
  IF account_type = 'admin' AND NOT has_admin THEN
    final_role := 'admin';
  ELSIF account_type = 'vendor' THEN
    final_role := 'vendor';
  ELSE
    final_role := 'user';
  END IF;

  -- Insert or update unified profile
  INSERT INTO public.profiles (id, email, role, full_name, business_name, shop_no, gst_no, phone)
  VALUES (
    NEW.id,
    NEW.email,
    final_role,
    user_full_name,
    user_biz_name,
    user_shop_no,
    user_gst_no,
    user_phone
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();

  -- Route to role-specific directories
  IF final_role = 'admin' THEN
    INSERT INTO public.admin_accounts (id, email, full_name)
    VALUES (NEW.id, NEW.email, user_full_name)
    ON CONFLICT (id) DO NOTHING;
  ELSIF final_role = 'vendor' THEN
    INSERT INTO public.vendor_profiles (id, email, business_name, shop_no, gst_no, phone)
    VALUES (NEW.id, NEW.email, COALESCE(user_biz_name, 'Vendor Shop'), COALESCE(user_shop_no, 'SHOP-100'), user_gst_no, user_phone)
    ON CONFLICT (id) DO NOTHING;
  ELSE
    INSERT INTO public.customer_accounts (id, email, full_name, phone)
    VALUES (NEW.id, NEW.email, user_full_name, user_phone)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 4. E-COMMERCE CORE TABLES
-- ------------------------------------------------------------------------------

-- Product Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text,
  description text,
  image text,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Vendor Products (Items sold standalone or used as hamper components)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_name text NOT NULL DEFAULT 'A_S Artisan Gifting',
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  price numeric NOT NULL CHECK (price >= 0),
  original_price numeric,
  image text NOT NULL,
  description text,
  tag text,
  stock integer NOT NULL DEFAULT 10 CHECK (stock >= 0),
  size_weight text DEFAULT 'Standard',
  is_available_for_hamper boolean NOT NULL DEFAULT true,
  max_quantity_per_hamper integer NOT NULL DEFAULT 5,
  is_offer boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Vendor Personalized Gift Hampers
CREATE TABLE IF NOT EXISTS public.vendor_hampers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_name text NOT NULL DEFAULT 'A_S Artisan Gifting',
  vendor_shop_no text DEFAULT 'SHOP-0142',
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  categories text[] NOT NULL DEFAULT '{"personalized"}',
  tags text[] NOT NULL DEFAULT '{"Gift Hamper"}',
  description text,
  thumbnail text NOT NULL,
  images text[] NOT NULL DEFAULT '{}',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  packaging_charge numeric NOT NULL DEFAULT 0,
  customization_charge numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  selling_price numeric NOT NULL CHECK (selling_price >= 0),
  original_price numeric,
  discount_percent numeric DEFAULT 0,
  stock integer NOT NULL DEFAULT 10,
  is_enabled boolean NOT NULL DEFAULT true,
  approval_status text NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('approved', 'pending', 'rejected')),
  rejection_reason text,
  is_published boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Customer Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE,
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  address text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric NOT NULL DEFAULT 0 CHECK (total >= 0),
  payment_status text NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method text NOT DEFAULT 'Card / UPI',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'packed', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Cart Items
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  hamper_id uuid REFERENCES public.vendor_hampers(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  personalization_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Reviews & Testimonials
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  hamper_id uuid REFERENCES public.vendor_hampers(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  is_approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Discount Coupons & Offers
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  min_order_amount numeric DEFAULT 0,
  max_discount numeric,
  expiry_date timestamptz,
  usage_limit integer DEFAULT 100,
  used_count integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Banners & Promotional Media
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  link text DEFAULT '/all-hampers',
  display_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Global Admin Settings
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id text PRIMARY KEY DEFAULT 'global',
  require_hamper_approval boolean NOT NULL DEFAULT false,
  allow_vendor_direct_publish boolean NOT NULL DEFAULT true,
  max_items_per_hamper integer NOT NULL DEFAULT 15,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Initial Admin Settings Seed
INSERT INTO public.admin_settings (id, require_hamper_approval, allow_vendor_direct_publish, max_items_per_hamper)
VALUES ('global', false, true, 15)
ON CONFLICT (id) DO NOTHING;

-- Initial Category Seeds
INSERT INTO public.categories (id, name, slug, icon, description, image, display_order)
VALUES
  ('birthday', 'Birthday Gifts', 'birthday-gifts', '🎂', 'Confetti, cake, candlelight & birthday surprises', 'https://images.pexels.com/photos/11112057/pexels-photo-11112057.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1),
  ('anniversary', 'Anniversary Gifts', 'anniversary-gifts', '💍', 'For the years worth toasting & celebrating', 'https://images.pexels.com/photos/6822851/pexels-photo-6822851.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 2),
  ('wedding', 'Wedding Gifts', 'wedding-gifts', '💒', 'Trousseau-worthy luxury gifting for couples', 'https://images.pexels.com/photos/759495/pexels-photo-759495.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 3),
  ('personalized', 'Personalized Gifts', 'personalized-gifts', '🎁', 'Monogrammed & custom curated keepsake hampers', 'https://images.pexels.com/photos/8468661/pexels-photo-8468661.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 4),
  ('corporate', 'Corporate Gifts', 'corporate-gifts', '🏢', 'Branded, premium, bulk corporate gift sets', 'https://images.pexels.com/photos/6690454/pexels-photo-6690454.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 5),
  ('festival', 'Festival Gifts', 'festival-gifts', '🎉', 'Diwali, Christmas, Rakhi & festive joy', 'https://images.pexels.com/photos/8887279/pexels-photo-8887279.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 6),
  ('couple', 'Couple Gifts', 'couple-gifts', '❤️', 'Romance, cocoa, wine glasses & cozy moments', 'https://images.pexels.com/photos/19376100/pexels-photo-19376100.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 7),
  ('baby-shower', 'Baby Gifts', 'baby-gifts', '👶', 'Soft, sweet, nursery & brand new baby boxes', 'https://images.pexels.com/photos/9215406/pexels-photo-9215406.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 8),
  ('luxury', 'Luxury Hampers', 'luxury-hampers', '💎', 'Extravagant keepsake baskets & artisan boxes', 'https://images.pexels.com/photos/8468661/pexels-photo-8468661.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 9)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_hampers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: Own profile or admin access
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin()) WITH CHECK (auth.uid() = id OR public.is_admin());

-- Customer & Vendor Directory Policies
CREATE POLICY "customer_accounts_select" ON public.customer_accounts FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "vendor_profiles_public_select" ON public.vendor_profiles FOR SELECT USING (true);
CREATE POLICY "admin_accounts_select" ON public.admin_accounts FOR SELECT TO authenticated USING (public.is_admin());

-- Categories: Public read, Admin write
CREATE POLICY "categories_public_select" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_all" ON public.categories FOR ALL TO authenticated USING (public.is_admin());

-- Products: Public read, Vendor or Admin insert/update/delete
CREATE POLICY "products_public_select" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_vendor_insert" ON public.products FOR INSERT TO authenticated WITH CHECK (vendor_id = auth.uid() OR public.is_admin());
CREATE POLICY "products_vendor_update" ON public.products FOR UPDATE TO authenticated USING (vendor_id = auth.uid() OR public.is_admin());
CREATE POLICY "products_vendor_delete" ON public.products FOR DELETE TO authenticated USING (vendor_id = auth.uid() OR public.is_admin());

-- Vendor Hampers: Public read, Vendor or Admin insert/update/delete
CREATE POLICY "vendor_hampers_public_select" ON public.vendor_hampers FOR SELECT USING (true);
CREATE POLICY "vendor_hampers_vendor_insert" ON public.vendor_hampers FOR INSERT TO authenticated WITH CHECK (vendor_id = auth.uid() OR public.is_admin());
CREATE POLICY "vendor_hampers_vendor_update" ON public.vendor_hampers FOR UPDATE TO authenticated USING (vendor_id = auth.uid() OR public.is_admin());
CREATE POLICY "vendor_hampers_vendor_delete" ON public.vendor_hampers FOR DELETE TO authenticated USING (vendor_id = auth.uid() OR public.is_admin());

-- Orders: Customer or Anon insert, Admin or Customer select own
CREATE POLICY "orders_insert_all" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_select_own_or_admin" ON public.orders FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.is_admin());
CREATE POLICY "orders_admin_update" ON public.orders FOR UPDATE TO authenticated USING (public.is_admin());

-- Cart Items: User own cart
CREATE POLICY "cart_items_own" ON public.cart_items FOR ALL TO authenticated USING (user_id = auth.uid());

-- Reviews & Coupons & Banners: Public read, Admin write
CREATE POLICY "reviews_public_select" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_authenticated" ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "coupons_public_select" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "coupons_admin_all" ON public.coupons FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "banners_public_select" ON public.banners FOR SELECT USING (true);
CREATE POLICY "banners_admin_all" ON public.banners FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "admin_settings_public_select" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "admin_settings_admin_update" ON public.admin_settings FOR UPDATE TO authenticated USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS products_vendor_idx ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(category);
CREATE INDEX IF NOT EXISTS hampers_vendor_idx ON public.vendor_hampers(vendor_id);
CREATE INDEX IF NOT EXISTS hampers_published_idx ON public.vendor_hampers(is_published, approval_status);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_customer_idx ON public.orders(customer_id);

-- ------------------------------------------------------------------------------
-- 7. SUPABASE STORAGE BUCKET SETUP (Solves Storage 404 GET Errors)
-- ------------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access to product-images" ON storage.objects;
CREATE POLICY "Public Access to product-images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated Upload to product-images" ON storage.objects;
CREATE POLICY "Authenticated Upload to product-images" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

