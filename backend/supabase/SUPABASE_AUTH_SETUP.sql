-- Run this entire file once in Supabase Dashboard > SQL Editor.
-- It is safe to run again if a previous setup attempt was incomplete.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_requested boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'vendor', 'user'));

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE OR REPLACE FUNCTION public.protect_profile_access_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = OLD.id
     AND NOT public.is_admin()
     AND current_setting('app.admin_request', true) IS DISTINCT FROM 'true'
     AND (NEW.role IS DISTINCT FROM OLD.role OR NEW.admin_requested IS DISTINCT FROM OLD.admin_requested) THEN
    RAISE EXCEPTION 'Only an administrator can change account access';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_access_fields ON public.profiles;
CREATE TRIGGER protect_profile_access_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_access_fields();

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.request_admin_access()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE has_admin boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  PERFORM set_config('app.admin_request', 'true', true);
  PERFORM pg_advisory_xact_lock(8182026);
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') INTO has_admin;
  IF NOT has_admin THEN
    UPDATE public.profiles SET role = 'admin', admin_requested = false WHERE id = auth.uid();
    RETURN 'approved';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN RETURN 'approved'; END IF;
  UPDATE public.profiles SET admin_requested = true WHERE id = auth.uid();
  RETURN 'pending';
END;
$$;

CREATE TABLE IF NOT EXISTS public.customer_accounts (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.admin_accounts (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  approved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_read_own" ON public.customer_accounts;
DROP POLICY IF EXISTS "customers_update_own" ON public.customer_accounts;
DROP POLICY IF EXISTS "admins_read_admins" ON public.admin_accounts;
CREATE POLICY "customers_read_own" ON public.customer_accounts FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "customers_update_own" ON public.customer_accounts FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin()) WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY "admins_read_admins" ON public.admin_accounts FOR SELECT TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.sync_account_directory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    DELETE FROM public.customer_accounts WHERE id = NEW.id;
    INSERT INTO public.admin_accounts (id, full_name, approved_at) VALUES (NEW.id, NEW.full_name, now())
      ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
  ELSIF NEW.role = 'user' THEN
    DELETE FROM public.admin_accounts WHERE id = NEW.id;
    INSERT INTO public.customer_accounts (id, full_name, phone) VALUES (NEW.id, NEW.full_name, NEW.phone)
      ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;
  ELSE
    DELETE FROM public.customer_accounts WHERE id = NEW.id;
    DELETE FROM public.admin_accounts WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_account_directory ON public.profiles;
CREATE TRIGGER sync_account_directory
AFTER INSERT OR UPDATE OF role, full_name, phone ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_account_directory();

INSERT INTO public.customer_accounts (id, full_name, phone, created_at)
SELECT id, full_name, phone, created_at FROM public.profiles WHERE role = 'user'
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;
INSERT INTO public.admin_accounts (id, full_name, approved_at, created_at)
SELECT id, full_name, created_at, created_at FROM public.profiles WHERE role = 'admin'
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Make the reported account a customer. It is automatically copied into customer_accounts.
UPDATE public.profiles AS profile
SET role = 'user', admin_requested = false
FROM auth.users AS account
WHERE profile.id = account.id
  AND lower(account.email) = 'ashukumarfbg8271@gmail.com';
