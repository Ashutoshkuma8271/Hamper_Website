-- ==============================================================================
-- A_S HAMPER LUXURY GIFTING PLATFORM - SUPABASE PRODUCTION DATABASE SCHEMA
-- ==============================================================================
-- 1. Clean drop of all existing tables with CASCADE for a fresh reset
-- ==============================================================================

DROP TABLE IF EXISTS public.wishlists CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.return_requests CASCADE;
DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.customer_addresses CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.vendor_hampers CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. BASE PROFILES TABLE (Supabase Auth Master Directory)
-- ==============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  business_name TEXT,
  shop_no TEXT,
  gst_no TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'vendor', 'admin')),
  avatar_url TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. SEPARATE CUSTOMERS TABLE (Customer details, stats & reward points)
-- ==============================================================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  reward_points INTEGER NOT NULL DEFAULT 100,
  is_vip BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. SEPARATE VENDORS TABLE (Business & Studio info, GST, city, payouts)
-- ==============================================================================
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  shop_no TEXT,
  gstin TEXT,
  store_slug TEXT UNIQUE,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  total_sales NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_hampers INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 4.90,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. SEPARATE ADMINS TABLE (Primary Store Administrator & Permissions)
-- Note: Single primary admin constraint is enforced via trigger & database rules
-- ==============================================================================
CREATE TABLE public.admins (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role_type TEXT NOT NULL DEFAULT 'super_admin' CHECK (role_type IN ('super_admin', 'store_manager', 'support')),
  is_primary_admin BOOLEAN NOT NULL DEFAULT TRUE,
  can_manage_vendors BOOLEAN NOT NULL DEFAULT TRUE,
  can_manage_products BOOLEAN NOT NULL DEFAULT TRUE,
  can_issue_refunds BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. CATEGORIES TABLE (Gifting Occasions & Themes)
-- ==============================================================================
CREATE TABLE public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Seed Essential Gifting Categories
INSERT INTO public.categories (id, name, description, icon, display_order) VALUES
('birthday', 'Birthday Gifts', 'Vibrant birthday curations, cakes, and sparkling treats', '🎂', 1),
('anniversary', 'Anniversary Gifts', 'Romantic keepsakes, wine sets, and golden memories', '💍', 2),
('wedding', 'Wedding Gifts', 'Grand bridal hampers and royal couple sets', '💒', 3),
('personalized', 'Personalized Gifts', 'Engraved memories, custom prints, and handwritten cards', '🎁', 4),
('corporate', 'Corporate Gifts', 'Executive leather, stationery, and luxury client curations', '🏢', 5),
('festival', 'Festival Gifts', 'Diwali, Rakhi, and seasonal celebration boxes', '🎉', 6),
('luxury', 'Luxury Hampers', 'Signature handcrafted boxes, champagne, and crystal items', '💎', 7),
('gourmet', 'Gourmet Treats', 'Artisan chocolates, roasted nuts, and fine preserves', '🍫', 8)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 7. PRODUCTS TABLE (Catalog Hampers & Builder Items)
-- ==============================================================================
CREATE TABLE public.products (
  id TEXT PRIMARY KEY DEFAULT ('prod_' || uuid_generate_v4()),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  compare_price NUMERIC(10, 2),
  category TEXT NOT NULL DEFAULT 'personalized',
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  image TEXT NOT NULL,
  gallery TEXT[] DEFAULT ARRAY[]::TEXT[],
  rating NUMERIC(3, 2) DEFAULT 4.9,
  reviews_count INTEGER DEFAULT 18,
  in_stock BOOLEAN NOT NULL DEFAULT TRUE,
  stock INTEGER NOT NULL DEFAULT 50,
  is_bestseller BOOLEAN NOT NULL DEFAULT FALSE,
  is_offer BOOLEAN NOT NULL DEFAULT FALSE,
  discount_badge TEXT,
  vendor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  vendor_name TEXT DEFAULT 'A_S Artisan Gifting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. VENDOR HAMPERS TABLE (Handcrafted multi-item vendor hampers)
-- ==============================================================================
CREATE TABLE public.vendor_hampers (
  id TEXT PRIMARY KEY DEFAULT ('hamp_' || uuid_generate_v4()),
  vendor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  base_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  packaging_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  selling_price NUMERIC(10, 2) NOT NULL,
  compare_price NUMERIC(10, 2),
  categories TEXT[] NOT NULL DEFAULT ARRAY['personalized']::TEXT[],
  image TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  sales_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 9. CUSTOMER SAVED ADDRESSES TABLE
-- ==============================================================================
CREATE TABLE public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  address_line TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  phone TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 10. ORDERS TABLE (Live Realtime Tracking, Payments & Order States)
-- ==============================================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  items JSONB NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  wallet_discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  coupon_code TEXT,
  coupon_discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'ONLINE' CHECK (payment_method IN ('ONLINE', 'COD', 'WALLET', 'UPI')),
  payment_status TEXT NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'placed' CHECK (status IN (
    'new', 'placed', 'processing', 'shipped', 'delivered', 'cancelled', 'return_requested', 'returned', 'refund_pending', 'refunded'
  )),
  custom_message TEXT,
  delivery_date DATE,
  delivery_slot TEXT,
  tracking_number TEXT,
  courier_partner TEXT DEFAULT 'BlueDart Express',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 11. ORDER ITEMS TABLE (Granular line-item tracking)
-- ==============================================================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  unit_price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(10, 2) NOT NULL,
  vendor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 12. WALLET & REWARD SYSTEM TABLES
-- ==============================================================================
CREATE TABLE public.wallets (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance NUMERIC(10, 2) NOT NULL DEFAULT 100.00, -- Free starter credit ₹100
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'cashback', 'refund')),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 13. RETURN & REFUND REQUESTS TABLE
-- ==============================================================================
CREATE TABLE public.return_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  refund_mode TEXT NOT NULL DEFAULT 'WALLET' CHECK (refund_mode IN ('WALLET', 'ORIGINAL_SOURCE', 'BANK_TRANSFER')),
  status TEXT NOT NULL DEFAULT 'RETURN REQUESTED' CHECK (status IN (
    'RETURN REQUESTED', 'RETURN APPROVED', 'RETURN REJECTED', 'RETURN PICKUP', 'RETURNED', 'REFUND PENDING', 'REFUNDED'
  )),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 14. REVIEWS TABLE
-- ==============================================================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  is_verified_buyer BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 15. WISHLISTS TABLE
-- ==============================================================================
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- ==============================================================================
-- 16. COUPONS TABLE
-- ==============================================================================
CREATE TABLE public.coupons (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL,
  min_order_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  max_discount NUMERIC(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order_value, max_discount) VALUES
('LUXURY10', '10% off on all luxury gift hampers', 'percentage', 10.00, 999.00, 500.00),
('WELCOME100', 'Flat ₹100 off on your first order', 'fixed', 100.00, 499.00, 100.00),
('FESTIVE20', '20% festive celebration discount', 'percentage', 20.00, 1999.00, 1000.00)
ON CONFLICT (code) DO NOTHING;

-- ==============================================================================
-- 17. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_hampers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Public Read Catalog Policies
CREATE POLICY "Public categories read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public products read" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public vendor_hampers read" ON public.vendor_hampers FOR SELECT USING (is_published = true);
CREATE POLICY "Public coupons read" ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Public reviews read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public reviews insert" ON public.reviews FOR INSERT WITH CHECK (true);

-- Profiles Policies
CREATE POLICY "Profiles viewable by owner & admins" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Profiles insertable on signup" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles updatable by owner or admin" ON public.profiles FOR UPDATE USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Customers, Vendors & Admins Table Policies
CREATE POLICY "Customers viewable by owner & admins" ON public.customers
  FOR ALL USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Vendors viewable by all, updatable by owner & admin" ON public.vendors
  FOR SELECT USING (true);
CREATE POLICY "Vendors manage own profile" ON public.vendors
  FOR ALL USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins accessible by admins only" ON public.admins
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Products & Vendor Hampers Management
CREATE POLICY "Products manage by vendors & admins" ON public.products
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('vendor', 'admin')));

CREATE POLICY "Vendor Hampers manage by owner & admins" ON public.vendor_hampers
  FOR ALL USING (vendor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Saved Addresses Policies
CREATE POLICY "Addresses managed by owner" ON public.customer_addresses
  FOR ALL USING (user_id = auth.uid());

-- Orders Policies
CREATE POLICY "Orders readable by customer, vendor or admin" ON public.orders
  FOR SELECT USING (
    customer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'vendor'))
  );
CREATE POLICY "Orders insertable by all" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Orders updatable by admin or vendor" ON public.orders
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'vendor')));

-- Order Items
CREATE POLICY "Order items readable by customer, vendor, admin" ON public.order_items
  FOR ALL USING (true);

-- Wallets & Transactions
CREATE POLICY "Wallets access by owner & admin" ON public.wallets
  FOR ALL USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Wallet transactions access by owner & admin" ON public.wallet_transactions
  FOR ALL USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Returns & Wishlists
CREATE POLICY "Return requests access" ON public.return_requests
  FOR ALL USING (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'vendor')));

CREATE POLICY "Wishlists managed by owner" ON public.wishlists
  FOR ALL USING (user_id = auth.uid());

-- ==============================================================================
-- 18. AUTOMATED USER SYNC TRIGGER WITH SINGLE ADMIN ENFORCEMENT
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_sync()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_name TEXT;
  user_phone TEXT;
  admin_count INTEGER;
BEGIN
  -- Extract role from metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'account_type', NEW.raw_user_meta_data->>'role', 'user');
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'business_name', split_part(NEW.email, '@', 1));
  user_phone := NEW.raw_user_meta_data->>'phone';

  -- Enforce SINGLE PRIMARY ADMIN RULE:
  IF user_role = 'admin' THEN
    SELECT COUNT(*) INTO admin_count FROM public.admins WHERE id <> NEW.id;
    IF admin_count >= 1 THEN
      RAISE EXCEPTION 'Admin registration is closed. Only one primary Administrator account is allowed on this platform.';
    END IF;
  END IF;

  -- 1. Insert/Update Base Profile
  INSERT INTO public.profiles (
    id, email, full_name, business_name, shop_no, gst_no, phone, role, email_verified, account_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    NEW.raw_user_meta_data->>'business_name',
    NEW.raw_user_meta_data->>'shop_no',
    NEW.raw_user_meta_data->>'gst_no',
    user_phone,
    user_role,
    (NEW.email_confirmed_at IS NOT NULL),
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    email_verified = (NEW.email_confirmed_at IS NOT NULL);

  -- 2. Insert into role-specific dedicated tables
  IF user_role = 'vendor' THEN
    INSERT INTO public.vendors (
      id, email, business_name, owner_name, phone, shop_no, gstin, address, city, state, pincode, is_approved
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'business_name', user_name),
      user_name,
      COALESCE(user_phone, 'Not Provided'),
      NEW.raw_user_meta_data->>'shop_no',
      NEW.raw_user_meta_data->>'gst_no',
      NEW.raw_user_meta_data->>'address',
      NEW.raw_user_meta_data->>'city',
      NEW.raw_user_meta_data->>'state',
      NEW.raw_user_meta_data->>'pincode',
      TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
      business_name = EXCLUDED.business_name,
      phone = EXCLUDED.phone;

  ELSIF user_role = 'admin' THEN
    INSERT INTO public.admins (id, email, full_name, role_type, is_primary_admin)
    VALUES (NEW.id, NEW.email, user_name, 'super_admin', TRUE)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  ELSE
    -- Default Customer
    INSERT INTO public.customers (id, email, full_name, phone)
    VALUES (NEW.id, NEW.email, user_name, user_phone)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;

    -- Starter ₹100 Wallet Credit for new customers
    INSERT INTO public.wallets (user_id, balance)
    VALUES (NEW.id, 100.00)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.wallet_transactions (user_id, amount, type, description)
    VALUES (NEW.id, 100.00, 'credit', 'Welcome gifting credit ₹100 applied')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_sync();

-- ==============================================================================
-- 19. REALTIME PUBLICATION SETUP (All tables broadcast in real-time)
-- ==============================================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE
    public.profiles,
    public.customers,
    public.vendors,
    public.admins,
    public.categories,
    public.products,
    public.vendor_hampers,
    public.customer_addresses,
    public.orders,
    public.order_items,
    public.wallets,
    public.wallet_transactions,
    public.return_requests,
    public.reviews,
    public.wishlists,
    public.coupons;
COMMIT;
