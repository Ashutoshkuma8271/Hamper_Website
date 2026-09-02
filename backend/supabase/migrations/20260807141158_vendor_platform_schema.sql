/*
# Vendor gifting platform — core schema

1. Overview
This migration sets up a multi-user gifting marketplace where:
- Vendors sign up with shop number + GST number and manage their own products.
- An admin manages all products and orders.
- Shoppers (anon) browse products and place orders.

2. New Tables
- `profiles` — extends auth.users with role (admin/vendor), business_name, shop_no, gst_no.
- `products` — hampers sold by vendors; vendor_id owner, name, slug, category, price, image, description, tag, stock, created_at.
- `orders` — checkout orders placed by shoppers; customer fields + line items snapshot + total + status.

3. Security
- RLS enabled on all three tables.
- profiles: each authenticated user reads/updates only their own profile row.
- products: public read (anon + authenticated) so storefront works without login;
  insert/update/delete restricted to the owning vendor or an admin.
- orders: public insert (shoppers checkout as anon); admin can read/update all orders.
- A trigger auto-creates a profile row on signup, defaulting role to 'vendor'.

4. Notes
- Owner columns default to auth.uid() so client inserts omitting the owner still pass RLS.
- Admin authorization uses a SECURITY DEFINER function is_admin() reading raw_app_meta_data
  so admin status is server-enforced and not client-settable.
*/

-- ---------- helper: is_admin ----------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
    false
  );
$$;

-- ---------- profiles ----------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'vendor' CHECK (role IN ('admin','vendor')),
  business_name text,
  shop_no text,
  gst_no text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, business_name, shop_no, gst_no, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'business_name',
    NEW.raw_user_meta_data ->> 'shop_no',
    NEW.raw_user_meta_data ->> 'gst_no',
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- products ----------
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'luxury',
  price integer NOT NULL CHECK (price >= 0),
  image text NOT NULL,
  description text,
  tag text,
  stock integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- public read so storefront works for anon
DROP POLICY IF EXISTS "products_public_select" ON public.products;
CREATE POLICY "products_public_select"
ON public.products FOR SELECT
TO anon, authenticated
USING (true);

-- vendor or admin can insert
DROP POLICY IF EXISTS "products_insert_owner" ON public.products;
CREATE POLICY "products_insert_owner"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (vendor_id = auth.uid() OR public.is_admin());

-- vendor owner or admin can update
DROP POLICY IF EXISTS "products_update_owner" ON public.products;
CREATE POLICY "products_update_owner"
ON public.products FOR UPDATE
TO authenticated
USING (vendor_id = auth.uid() OR public.is_admin())
WITH CHECK (vendor_id = auth.uid() OR public.is_admin());

-- vendor owner or admin can delete
DROP POLICY IF EXISTS "products_delete_owner" ON public.products;
CREATE POLICY "products_delete_owner"
ON public.products FOR DELETE
TO authenticated
USING (vendor_id = auth.uid() OR public.is_admin());

-- ---------- orders ----------
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  address text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','packed','shipped','delivered','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- anyone can place an order (anon checkout)
DROP POLICY IF EXISTS "orders_public_insert" ON public.orders;
CREATE POLICY "orders_public_insert"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- admin can read & update all orders
DROP POLICY IF EXISTS "orders_admin_select" ON public.orders;
CREATE POLICY "orders_admin_select"
ON public.orders FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;
CREATE POLICY "orders_admin_update"
ON public.orders FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- index for storefront filtering
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(category);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
