# Backend

Supabase is the application backend.

```
backend/supabase/
├── migrations/               # Run in timestamp order through Supabase migrations or SQL Editor
├── functions/login-alert/    # Optional sign-in notification email function
└── SUPABASE_AUTH_SETUP.sql   # One-time recovery/setup script for existing hosted projects
```

The frontend uses the hosted project credentials in `frontend/.env`. Do not commit service-role keys or email-provider API keys.
