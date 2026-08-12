# 📧 Complete Supabase Email Templates Guide – My Gift Hamper

This master document contains all 6 official **My Gift Hamper** HTML Email Templates styled in luxury wine (`#57222C`), gold (`#D4AF37`), and cream (`#FDFBF7`) colors.

Copy and paste each template into your **Supabase Dashboard** under:
👉 **[Supabase Project Dashboard](https://supabase.com/dashboard/project/boplfknyajnxrraqlqpe/auth/templates) → Authentication → Email Templates**

---

## 1. Confirm Signup / Signup 6-Digit OTP
**Dashboard Location**: `Authentication` → `Email Templates` → `Confirm signup`  
**Subject**: `My Gift Hamper - Email Verification Code`  
**HTML File**: [supabase_otp_email_template.html](file:///c:/Users/91933/Downloads/project-bolt-sb1-hprc18bj/project/frontend/supabase_otp_email_template.html)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>My Gift Hamper - Email Verification OTP</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; background-color: #FDFBF7; margin: 0; padding: 30px 15px;">
  <div style="max-width: 550px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(87, 34, 44, 0.08);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #57222C; font-size: 24px; font-weight: bold; margin: 0;">My Gift Hamper</h1>
      <p style="color: #D4AF37; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">Premium Gift Experiences</p>
    </div>
    <div style="border-top: 1px solid #F3F4F6; padding-top: 24px;">
      <h2 style="color: #1F2937; font-size: 18px; font-weight: bold; margin-top: 0;">Email Verification Code</h2>
      <p style="color: #4B5563; font-size: 14px; line-height: 1.6;">Hello,</p>
      <p style="color: #4B5563; font-size: 14px; line-height: 1.6;">Thank you for registering with <strong>My Gift Hamper</strong>. Please use the following 6-digit OTP verification code to activate your account:</p>
      <div style="background-color: #FDFBF7; border: 2px dashed #D4AF37; padding: 20px; text-align: center; border-radius: 16px; margin: 24px 0;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: bold; letter-spacing: 8px; color: #57222C;">{{ .Token }}</span>
      </div>
      <p style="color: #6B7280; font-size: 12px; line-height: 1.5;">This verification OTP is valid for a limited time. Please do not share this code with anyone for security purposes.</p>
      <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">If you did not request this verification, please ignore this email.</p>
    </div>
    <div style="border-top: 1px solid #F3F4F6; margin-top: 30px; padding-top: 20px; text-align: center; color: #9CA3AF; font-size: 11px;">
      <p style="margin: 0; color: #57222C; font-weight: bold;">My Gift Hamper Security System</p>
      <p style="margin-top: 4px;">Protected by Supabase Encrypted Authentication</p>
    </div>
  </div>
</body>
</html>
```

---

## 2. Invite User
**Dashboard Location**: `Authentication` → `Email Templates` → `Invite user`  
**Subject**: `You Have Been Invited to Join My Gift Hamper`  
**HTML File**: [supabase_invite_user_template.html](file:///c:/Users/91933/Downloads/project-bolt-sb1-hprc18bj/project/frontend/supabase_invite_user_template.html)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>My Gift Hamper - You Have Been Invited</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; background-color: #FDFBF7; margin: 0; padding: 30px 15px;">
  <div style="max-width: 550px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(87, 34, 44, 0.08);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #57222C; font-size: 24px; font-weight: bold; margin: 0;">My Gift Hamper</h1>
      <p style="color: #D4AF37; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">Exclusive Invitation</p>
    </div>
    <div style="border-top: 1px solid #F3F4F6; padding-top: 24px;">
      <h2 style="color: #1F2937; font-size: 18px; font-weight: bold; margin-top: 0;">You Have Been Invited!</h2>
      <p style="color: #4B5563; font-size: 14px; line-height: 1.6;">Hello,</p>
      <p style="color: #4B5563; font-size: 14px; line-height: 1.6;">You have been invited to join <strong>My Gift Hamper</strong>. Click the button below to accept your invitation and set up your account:</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{ .ConfirmationURL }}" style="background-color: #57222C; color: #FFFFFF; padding: 14px 28px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 6px 16px rgba(87, 34, 44, 0.25);">Accept Invitation &amp; Join</a>
      </div>
      <p style="color: #6B7280; font-size: 12px; line-height: 1.5;">If the button above does not work, copy and paste this link into your browser:</p>
      <p style="color: #57222C; font-size: 11px; word-break: break-all;"><a href="{{ .ConfirmationURL }}" style="color: #57222C;">{{ .ConfirmationURL }}</a></p>
      <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">If you were not expecting this invitation, please ignore this email.</p>
    </div>
    <div style="border-top: 1px solid #F3F4F6; margin-top: 30px; padding-top: 20px; text-align: center; color: #9CA3AF; font-size: 11px;">
      <p style="margin: 0; color: #57222C; font-weight: bold;">My Gift Hamper Security System</p>
      <p style="margin-top: 4px;">Protected by Supabase Encrypted Authentication</p>
    </div>
  </div>
</body>
</html>
```

---

## 3. Magic Link / Magic Link OTP
**Dashboard Location**: `Authentication` → `Email Templates` → `Magic link`  
**Subject**: `Log In to My Gift Hamper – Magic Link & Code`  
**HTML File**: [supabase_magic_link_template.html](file:///c:/Users/91933/Downloads/project-bolt-sb1-hprc18bj/project/frontend/supabase_magic_link_template.html)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>My Gift Hamper - Magic Link &amp; OTP Login</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; background-color: #FDFBF7; margin: 0; padding: 30px 15px;">
  <div style="max-width: 550px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(87, 34, 44, 0.08);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #57222C; font-size: 24px; font-weight: bold; margin: 0;">My Gift Hamper</h1>
      <p style="color: #D4AF37; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">Passwordless Login</p>
    </div>
    <div style="border-top: 1px solid #F3F4F6; padding-top: 24px;">
      <h2 style="color: #1F2937; font-size: 18px; font-weight: bold; margin-top: 0;">Your Magic Link &amp; OTP Code</h2>
      <p style="color: #4B5563; font-size: 14px; line-height: 1.6;">Hello,</p>
      <p style="color: #4B5563; font-size: 14px; line-height: 1.6;">Use your 6-digit OTP code or click the Magic Link below to log in instantly:</p>
      <div style="background-color: #FDFBF7; border: 2px dashed #D4AF37; padding: 18px; text-align: center; border-radius: 16px; margin: 20px 0;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #57222C;">{{ .Token }}</span>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{ .ConfirmationURL }}" style="background-color: #57222C; color: #FFFFFF; padding: 14px 28px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 6px 16px rgba(87, 34, 44, 0.25);">Log In via Magic Link</a>
      </div>
      <p style="color: #6B7280; font-size: 12px; line-height: 1.5;">This magic link and OTP code are valid for a limited time. Do not share this code with anyone.</p>
      <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">If you did not request a magic link login, please ignore this email.</p>
    </div>
    <div style="border-top: 1px solid #F3F4F6; margin-top: 30px; padding-top: 20px; text-align: center; color: #9CA3AF; font-size: 11px;">
      <p style="margin: 0; color: #57222C; font-weight: bold;">My Gift Hamper Security System</p>
      <p style="margin-top: 4px;">Protected by Supabase Encrypted Authentication</p>
    </div>
  </div>
</body>
</html>
```

---

## 4. Change Email Address
**Dashboard Location**: `Authentication` → `Email Templates` → `Change email address`  
**Subject**: `Confirm Email Address Change – My Gift Hamper`  
**HTML File**: [supabase_change_email_template.html](file:///c:/Users/91933/Downloads/project-bolt-sb1-hprc18bj/project/frontend/supabase_change_email_template.html)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>My Gift Hamper - Confirm Email Change</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; background-color: #FDFBF7; margin: 0; padding: 30px 15px;">
  <div style="max-width: 550px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(87, 34, 44, 0.08);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #57222C; font-size: 24px; font-weight: bold; margin: 0;">My Gift Hamper</h1>
      <p style="color: #D4AF37; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">Account Security Notice</p>
    </div>
    <div style="border-top: 1px solid #F3F4F6; padding-top: 24px;">
      <h2 style="color: #1F2937; font-size: 18px; font-weight: bold; margin-top: 0;">Confirm Email Address Change</h2>
      <p style="color: #4B5563; font-size: 14px; line-height: 1.6;">Hello,</p>
      <p style="color: #4B5563; font-size: 14px; line-height: 1.6;">A request was made to change the email address for your <strong>My Gift Hamper</strong> account. Use the 6-digit OTP or click the link below to confirm this change:</p>
      <div style="background-color: #FDFBF7; border: 2px dashed #D4AF37; padding: 18px; text-align: center; border-radius: 16px; margin: 20px 0;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #57222C;">{{ .Token }}</span>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{ .ConfirmationURL }}" style="background-color: #57222C; color: #FFFFFF; padding: 14px 28px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 6px 16px rgba(87, 34, 44, 0.25);">Confirm New Email Address</a>
      </div>
      <p style="color: #6B7280; font-size: 12px; line-height: 1.5;">This verification code and link are valid for a limited time. Please do not share this code with anyone.</p>
      <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">If you did not request to change your email address, please contact support immediately to secure your account.</p>
    </div>
    <div style="border-top: 1px solid #F3F4F6; margin-top: 30px; padding-top: 20px; text-align: center; color: #9CA3AF; font-size: 11px;">
      <p style="margin: 0; color: #57222C; font-weight: bold;">My Gift Hamper Security System</p>
      <p style="margin-top: 4px;">Protected by Supabase Encrypted Authentication</p>
    </div>
  </div>
</body>
</html>
```

---

## 5. Reset Password
**Dashboard Location**: `Authentication` → `Email Templates` → `Reset password`  
**Subject**: `Reset Your Password – My Gift Hamper`  
**HTML File**: [supabase_reset_password_template.html](file:///c:/Users/91933/Downloads/project-bolt-sb1-hprc18bj/project/frontend/supabase_reset_password_template.html)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>My Gift Hamper - Password Reset Request</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; background-color: #FDFBF7; margin: 0; padding: 30px 15px;">
  <div style="max-width: 550px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(87, 34, 44, 0.08);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #57222C; font-size: 24px; font-weight: bold; margin: 0;">My Gift Hamper</h1>
      <p style="color: #D4AF37; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">Password Reset</p>
    </div>
    <div style="border-top: 1px solid #F3F4F6; padding-top: 24px;">
      <h2 style="color: #1F2937; font-size: 18px; font-weight: bold; margin-top: 0;">Reset Your Password</h2>
      <p style="color: #4B5563; font-size: 14px; line-height: 1.6;">Hello,</p>
      <p style="color: #4B5563; font-size: 14px; line-height: 1.6;">We received a request to reset the password for your <strong>My Gift Hamper</strong> account. Click the secure button below to create your new password:</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{ .ConfirmationURL }}" style="background-color: #57222C; color: #FFFFFF; padding: 14px 28px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 6px 16px rgba(87, 34, 44, 0.25);">Reset Account Password</a>
      </div>
      <p style="color: #6B7280; font-size: 12px; line-height: 1.5;">Or use your 6-digit recovery OTP code if prompted:</p>
      <div style="background-color: #FDFBF7; border: 2px dashed #D4AF37; padding: 16px; text-align: center; border-radius: 14px; margin: 16px 0;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #57222C;">{{ .Token }}</span>
      </div>
      <p style="color: #6B7280; font-size: 12px; line-height: 1.5;">This password reset link is valid for a limited time. For security reasons, you cannot reuse your previous password.</p>
      <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
    </div>
    <div style="border-top: 1px solid #F3F4F6; margin-top: 30px; padding-top: 20px; text-align: center; color: #9CA3AF; font-size: 11px;">
      <p style="margin: 0; color: #57222C; font-weight: bold;">My Gift Hamper Security System</p>
      <p style="margin-top: 4px;">Protected by Supabase Encrypted Authentication</p>
    </div>
  </div>
</body>
</html>
```

---

## 6. Reauthentication
**Dashboard Location**: `Authentication` → `Email Templates` → `Reauthentication`  
**Subject**: `Security Verification Code – My Gift Hamper`  
**HTML File**: [supabase_reauthentication_template.html](file:///c:/Users/91933/Downloads/project-bolt-sb1-hprc18bj/project/frontend/supabase_reauthentication_template.html)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>My Gift Hamper - Security Reauthentication OTP</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; background-color: #FDFBF7; margin: 0; padding: 30px 15px;">
  <div style="max-width: 550px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(87, 34, 44, 0.08);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #57222C; font-size: 24px; font-weight: bold; margin: 0;">My Gift Hamper</h1>
      <p style="color: #D4AF37; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">Security Verification</p>
    </div>
    <div style="border-top: 1px solid #F3F4F6; padding-top: 24px;">
      <h2 style="color: #1F2937; font-size: 18px; font-weight: bold; margin-top: 0;">Reauthentication Required</h2>
      <p style="color: #4B5563; font-size: 14px; line-height: 1.6;">Hello,</p>
      <p style="color: #4B5563; font-size: 14px; line-height: 1.6;">A sensitive account action requires reauthentication. Please enter the following 6-digit OTP code:</p>
      <div style="background-color: #FDFBF7; border: 2px dashed #D4AF37; padding: 20px; text-align: center; border-radius: 16px; margin: 24px 0;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: bold; letter-spacing: 8px; color: #57222C;">{{ .Token }}</span>
      </div>
      <p style="color: #6B7280; font-size: 12px; line-height: 1.5;">This reauthentication OTP code is valid for a limited time. Please do not share this code with anyone.</p>
      <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">If you did not initiate this action, please secure your account immediately.</p>
    </div>
    <div style="border-top: 1px solid #F3F4F6; margin-top: 30px; padding-top: 20px; text-align: center; color: #9CA3AF; font-size: 11px;">
      <p style="margin: 0; color: #57222C; font-weight: bold;">My Gift Hamper Security System</p>
      <p style="margin-top: 4px;">Protected by Supabase Encrypted Authentication</p>
    </div>
  </div>
</body>
</html>
```
