-- Migration for Vendor Products, Vendor Hampers, and Admin Settings

CREATE TABLE IF NOT EXISTS public.vendor_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  price integer NOT NULL CHECK (price >= 0),
  image text NOT NULL,
  description text,
  stock integer NOT NULL DEFAULT 10 CHECK (stock >= 0),
  size_weight text,
  is_available_for_hamper boolean NOT NULL DEFAULT true,
  max_quantity_per_hamper integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vendor_hampers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_name text NOT NULL,
  vendor_shop_no text,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  categories text[] NOT NULL DEFAULT '{"personalized"}',
  tags text[] NOT NULL DEFAULT '{"Gift Hamper"}',
  description text,
  thumbnail text NOT NULL,
  images text[] NOT NULL DEFAULT '{}',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  packaging_charge integer NOT NULL DEFAULT 0,
  customization_charge integer NOT NULL DEFAULT 0,
  total_cost integer NOT NULL DEFAULT 0,
  selling_price integer NOT NULL CHECK (selling_price >= 0),
  original_price integer,
  discount_percent integer DEFAULT 0,
  stock integer NOT NULL DEFAULT 10,
  is_enabled boolean NOT NULL DEFAULT true,
  approval_status text NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('approved', 'pending', 'rejected')),
  rejection_reason text,
  is_published boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_settings (
  id text PRIMARY KEY DEFAULT 'global',
  require_hamper_approval boolean NOT NULL DEFAULT false,
  allow_vendor_direct_publish boolean NOT NULL DEFAULT true,
  max_items_per_hamper integer NOT NULL DEFAULT 15,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_hampers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Policies for vendor_products
CREATE POLICY "vendor_products_public_select" ON public.vendor_products FOR SELECT USING (true);
CREATE POLICY "vendor_products_vendor_insert" ON public.vendor_products FOR INSERT WITH CHECK (vendor_id = auth.uid() OR public.is_admin());
CREATE POLICY "vendor_products_vendor_update" ON public.vendor_products FOR UPDATE USING (vendor_id = auth.uid() OR public.is_admin());
CREATE POLICY "vendor_products_vendor_delete" ON public.vendor_products FOR DELETE USING (vendor_id = auth.uid() OR public.is_admin());

-- Policies for vendor_hampers
CREATE POLICY "vendor_hampers_public_select" ON public.vendor_hampers FOR SELECT USING (true);
CREATE POLICY "vendor_hampers_vendor_insert" ON public.vendor_hampers FOR INSERT WITH CHECK (vendor_id = auth.uid() OR public.is_admin());
CREATE POLICY "vendor_hampers_vendor_update" ON public.vendor_hampers FOR UPDATE USING (vendor_id = auth.uid() OR public.is_admin());
CREATE POLICY "vendor_hampers_vendor_delete" ON public.vendor_hampers FOR DELETE USING (vendor_id = auth.uid() OR public.is_admin());

-- Policies for admin_settings
CREATE POLICY "admin_settings_public_select" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "admin_settings_admin_update" ON public.admin_settings FOR UPDATE USING (public.is_admin());
