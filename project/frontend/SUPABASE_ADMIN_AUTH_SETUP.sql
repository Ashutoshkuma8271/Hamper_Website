-- ==============================================================================
-- ENTERPRISE ADMIN AUTHENTICATION, DATABASE HARDENING & GMAIL SMTP SETUP
-- ==============================================================================

-- 1. Ensure `profiles` table contains verification & status columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create index on role and account_status for lightning fast security lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role_status ON public.profiles(role, account_status);

-- 3. Server-Side Trigger for Role Assignment & Security Hardening
-- Prevents standard customer signups from tricking the system into elevating to admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_type TEXT;
  raw_full_name TEXT;
  raw_phone TEXT;
BEGIN
  -- Extract user metadata supplied during signup
  user_type := LOWER(COALESCE(NEW.raw_user_meta_data->>'account_type', 'user'));
  raw_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'business_name', 'User');
  raw_phone := NEW.raw_user_meta_data->>'phone';

  -- Sanitize role: Only allow valid roles ('admin', 'vendor', 'user')
  IF user_type NOT IN ('admin', 'vendor', 'user') THEN
    user_type := 'user';
  END IF;

  -- Insert profile record with server-validated role & verification status
  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    phone,
    email_verified,
    account_status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    raw_full_name,
    user_type,
    raw_phone,
    (NEW.email_confirmed_at IS NOT NULL),
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email_verified = (NEW.email_confirmed_at IS NOT NULL),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to sync email_confirmed_at with email_verified status in profiles
CREATE OR REPLACE FUNCTION public.handle_user_email_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_confirmed_at IS DISTINCT FROM OLD.email_confirmed_at AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.profiles
    SET email_verified = TRUE, updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_verified();

-- ==============================================================================
-- GMAIL SMTP CONFIGURATION INSTRUCTIONS FOR SUPABASE DASHBOARD
-- ==============================================================================
/*
To configure Gmail SMTP in your Supabase Dashboard:

1. Open your Supabase Project Dashboard -> Authentication -> Provider Settings -> Email.
2. Enable "Custom SMTP".
3. Enter the following Gmail SMTP details:
   - Sender Email:    your-website-gmail@gmail.com (Your Website Gmail Account)
   - Sender Name:     My Gift Hamper
   - SMTP Host:       smtp.gmail.com
   - SMTP Port:       587
   - Minimum TLS:     TLS (or STARTTLS)
   - SMTP Username:   your-website-gmail@gmail.com
   - SMTP Password:   [16-character Gmail App Password created in Google Account -> Security -> App Passwords]

4. Under Authentication -> Email Templates -> "Confirm signup":
   Subject: Admin Email Verification – My Gift Hamper

   HTML Body:
   ----------------------------------------------------------------------
   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; rounded-radius: 16px;">
     <h2 style="color: #57222C; margin-bottom: 16px;">Admin Email Verification – My Gift Hamper</h2>
     <p style="color: #374151; font-size: 15px;">Hello Admin,</p>
     <p style="color: #374151; font-size: 15px;">Your verification code for My Gift Hamper is:</p>
     <div style="background-color: #FDFBF7; border: 2px dashed #D4AF37; padding: 18px; text-align: center; border-radius: 12px; margin: 20px 0;">
       <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #57222C;">{{ .Token }}</span>
     </div>
     <p style="color: #6B7280; font-size: 13px;">This OTP is valid for a limited time.</p>
     <p style="color: #6B7280; font-size: 13px;">If you did not request this verification, please ignore this email.</p>
   </div>
   ----------------------------------------------------------------------
*/
