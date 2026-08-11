-- Separate customer accounts from vendor and admin accounts.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'vendor', 'user'));

-- New customer sign-ups receive a user profile. Vendor Zone explicitly sends
-- account_type = vendor. Admin access is granted only by an existing admin.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, business_name, shop_no, gst_no, phone)
  VALUES (
    NEW.id,
    CASE WHEN NEW.raw_user_meta_data ->> 'account_type' = 'vendor' THEN 'vendor' ELSE 'user' END,
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
