-- Customer account data and a strict single-admin model.
-- The administrator must be provisioned by a trusted database operator; public
-- sign-up can never assign the admin role.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ALTER COLUMN customer_id SET DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON public.orders(customer_id);

DROP POLICY IF EXISTS "orders_customer_select" ON public.orders;
CREATE POLICY "orders_customer_select" ON public.orders FOR SELECT TO authenticated
USING (customer_id = auth.uid() OR public.is_admin());

CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  label text NOT NULL DEFAULT 'Home', full_name text, phone text, address_line text NOT NULL,
  city text, state text, postal_code text, is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_addresses_own" ON public.customer_addresses FOR ALL TO authenticated
USING (customer_id = auth.uid() OR public.is_admin()) WITH CHECK (customer_id = auth.uid() OR public.is_admin());

CREATE TABLE IF NOT EXISTS public.customer_wishlist (
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(customer_id, product_id)
);
ALTER TABLE public.customer_wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_wishlist_own" ON public.customer_wishlist FOR ALL TO authenticated
USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

-- Roles are never chosen by a public sign-up form. The configured admin is
-- provisioned by a trusted database operator; every new email/OAuth account is
-- a customer.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, role, admin_requested, full_name, phone)
  VALUES (NEW.id, 'user', false, NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'phone')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Hard database guarantee: even a privileged application query cannot create
-- a second active administrator row.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_single_admin_role_idx
ON public.profiles ((role)) WHERE role = 'admin';

-- Shared management records for categories, coupons, banners, blog entries,
-- reviews and customer notifications. Only the database-confirmed admin can
-- create, edit or remove them.
CREATE TABLE IF NOT EXISTS public.admin_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('category','coupon','banner','blog','review','notification')),
  title text NOT NULL,
  subtitle text,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_resources_public_read" ON public.admin_resources FOR SELECT TO anon, authenticated USING (active OR public.is_admin());
CREATE POLICY "admin_resources_admin_write" ON public.admin_resources FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE INDEX IF NOT EXISTS admin_resources_kind_idx ON public.admin_resources(kind, created_at DESC);

CREATE TABLE IF NOT EXISTS public.customer_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('customer','order','promotional')),
  title text NOT NULL,
  message text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_read_own_notifications" ON public.customer_notifications FOR SELECT TO authenticated
USING (customer_id = auth.uid() OR customer_id IS NULL OR public.is_admin());
CREATE POLICY "customers_mark_own_notifications_read" ON public.customer_notifications FOR UPDATE TO authenticated
USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());
CREATE POLICY "admins_manage_notifications" ON public.customer_notifications FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE INDEX IF NOT EXISTS customer_notifications_customer_idx ON public.customer_notifications(customer_id, created_at DESC);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_best_seller boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS personalization_options jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Product image uploads are served publicly, while writes remain admin-only.
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "admins_upload_product_images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "admins_update_product_images" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND public.is_admin()) WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "admins_delete_product_images" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "public_read_product_images" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'product-images');

-- Existing administrator(s) remain valid; further role promotion requires an
-- explicitly trusted SQL provisioning session, never a browser request.
CREATE OR REPLACE FUNCTION public.enforce_single_admin_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role = 'admin' AND OLD.role IS DISTINCT FROM 'admin'
     AND current_setting('app.admin_provisioning', true) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Administrator access is provisioned only by the database operator';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS enforce_single_admin_role ON public.profiles;
CREATE TRIGGER enforce_single_admin_role BEFORE UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_single_admin_role();

CREATE OR REPLACE FUNCTION public.request_admin_access()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RAISE EXCEPTION 'Administrator access cannot be requested publicly';
END;
$$;
