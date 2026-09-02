-- Keep customer and administrator data in separate tables while profiles remains
-- the minimal role directory used by the application.

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

CREATE POLICY "customers_read_own" ON public.customer_accounts
FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "customers_update_own" ON public.customer_accounts
FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY "admins_read_admins" ON public.admin_accounts
FOR SELECT TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.sync_account_directory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    DELETE FROM public.customer_accounts WHERE id = NEW.id;
    INSERT INTO public.admin_accounts (id, full_name, approved_at)
    VALUES (NEW.id, NEW.full_name, now())
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
  ELSIF NEW.role = 'user' THEN
    DELETE FROM public.admin_accounts WHERE id = NEW.id;
    INSERT INTO public.customer_accounts (id, full_name, phone)
    VALUES (NEW.id, NEW.full_name, NEW.phone)
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

-- Backfill the new account tables from existing profile rows.
INSERT INTO public.customer_accounts (id, full_name, phone, created_at)
SELECT id, full_name, phone, created_at FROM public.profiles WHERE role = 'user'
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;

INSERT INTO public.admin_accounts (id, full_name, approved_at, created_at)
SELECT id, full_name, created_at, created_at FROM public.profiles WHERE role = 'admin'
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Correct the customer account reported in the issue. The trigger automatically
-- moves it into customer_accounts and removes any admin record.
UPDATE public.profiles AS profile
SET role = 'user', admin_requested = false
FROM auth.users AS account
WHERE profile.id = account.id
  AND lower(account.email) = 'ashukumarfbg8271@gmail.com';
