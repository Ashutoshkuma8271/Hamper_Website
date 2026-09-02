# A_S Hamper

Gift-hamper storefront with customer, vendor, and administrator accounts.

## Project structure

```
project/
├── frontend/                 # React, TypeScript, Vite, and Tailwind application
│   ├── public/               # Static files, including hero images
│   └── src/                  # Components, pages, hooks, and Supabase client
├── backend/
│   └── supabase/
│       ├── migrations/       # Versioned database schema changes
│       └── functions/        # Supabase Edge Functions
├── package.json              # Root development commands
└── README.md
```

## Run locally

Create `frontend/.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then run:

```bash
npm run dev
```

The hosted Supabase project provides authentication and the database; no local backend process is required.
