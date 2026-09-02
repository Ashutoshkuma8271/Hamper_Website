-- Secure admin account creation and approval.
-- The first account created through the admin sign-up form becomes an admin.
-- Later admin sign-ups are requests and must be approved by an existing admin.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_requested boolean NOT NULL DEFAULT false;

-- Admins may review and approve account requests. Regular users may only update
-- their own profile, and the trigger below prevents them from changing access fields.
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin"
ON public.profiles FOR UPDATE
TO authenticated
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

-- Used after a Google OAuth redirect. A user may request access, but can never
-- promote themselves once an admin already exists.
CREATE OR REPLACE FUNCTION public.request_admin_access()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_admin boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  PERFORM set_config('app.admin_request', 'true', true);
  PERFORM pg_advisory_xact_lock(8182026);
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') INTO has_admin;
  IF NOT has_admin THEN
    UPDATE public.profiles SET role = 'admin', admin_requested = false WHERE id = auth.uid();
    RETURN 'approved';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RETURN 'approved';
  END IF;
  UPDATE public.profiles SET admin_requested = true WHERE id = auth.uid();
  RETURN 'pending';
END;
$$;

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
  -- Serialize first-admin creation so two simultaneous sign-ups cannot both be admins.
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
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
