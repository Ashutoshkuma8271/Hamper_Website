/*
# Admin role assignment on signup

Updates the handle_new_user trigger so that:
1. If no admin exists yet, the first user to sign up becomes the admin.
2. Otherwise the user gets the default 'vendor' role.

This makes the admin dashboard reachable without manual database intervention.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
BEGIN
  SELECT count(*) INTO admin_count FROM public.profiles WHERE role = 'admin';

  INSERT INTO public.profiles (id, role, business_name, shop_no, gst_no, phone)
  VALUES (
    NEW.id,
    CASE WHEN admin_count = 0 THEN 'admin' ELSE 'vendor' END,
    NEW.raw_user_meta_data ->> 'business_name',
    NEW.raw_user_meta_data ->> 'shop_no',
    NEW.raw_user_meta_data ->> 'gst_no',
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    shop_no = EXCLUDED.shop_no,
    gst_no = EXCLUDED.gst_no,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$;

-- Also update is_admin to check the profiles table directly as a fallback,
-- so admin role set via the trigger is recognized even without app_metadata.
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
