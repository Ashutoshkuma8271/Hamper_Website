-- Fixes the legacy trigger that made all new accounts vendor accounts.
-- Customers are now always 'user'; only the Vendor Zone sends account_type = 'vendor'.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_requested boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'vendor', 'user'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_admin boolean;
  requested_admin boolean;
BEGIN
  PERFORM pg_advisory_xact_lock(8182026);
  requested_admin := NEW.raw_user_meta_data ->> 'account_type' = 'admin';
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') INTO has_admin;

  INSERT INTO public.profiles (id, role, admin_requested, full_name, business_name, shop_no, gst_no, phone)
  VALUES (
    NEW.id,
    CASE
      WHEN requested_admin AND NOT has_admin THEN 'admin'
      WHEN NEW.raw_user_meta_data ->> 'account_type' = 'vendor' THEN 'vendor'
      ELSE 'user'
    END,
    requested_admin AND has_admin,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'business_name',
    NEW.raw_user_meta_data ->> 'shop_no',
    NEW.raw_user_meta_data ->> 'gst_no',
    NEW.raw_user_meta_data ->> 'phone'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
