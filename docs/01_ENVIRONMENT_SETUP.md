# 1. Environment Setup

This project requires several environment variables to be configured for both the Next.js frontend and the Supabase backend components.

## Frontend (Next.js)

Create a file named `.env.local` in the root of the project (alongside `package.json`). Copy the contents from `docs/example.env` into this file and replace the placeholder values with your actual Supabase project credentials and any other required API keys.

**Example `.env.local` structure (refer to `docs/example.env` for a complete list):**

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Add any other frontend-specific environment variables here
# Example: NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

## Supabase (Local Development & Edge Functions)

For local Supabase development using the Supabase CLI, and for Edge Functions (both locally and when deployed), environment variables might be sourced differently:

*   **Supabase CLI (`supabase start`):** The CLI can sometimes pick up variables from a root `.env` file (though `.env.local` is primarily for Next.js). For service role keys or other secrets used by local Supabase services, you might set them directly when prompted or manage them securely.
*   **Edge Functions Deployed to Supabase:** Secrets for deployed Edge Functions should be set directly in the Supabase Dashboard under Functions > (Your Function) > Secrets.

Refer to `docs/example.env` for a list of backend-related variables you might need, such as `SUPABASE_SERVICE_ROLE_KEY`.

## Key Environment Variables

See `docs/example.env` for the comprehensive list. Key variables include:

*   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase project's anonymous key.
*   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase project's service role key (treat this as highly sensitive, do not commit to your repository, primarily for backend operations or admin tasks).
*   `SUPABASE_DB_PASSWORD`: The password for your local Supabase database (intially setuped password)

**Important Security Note:** Never commit your actual secrets (like in `.env.local` or a root `.env` file containing real keys) to your Git repository. Ensure these files are listed in your `.gitignore` file. 




*NEXT_PUBLIC_SUPABASE_URL=* Supabase project URL
*NEXT_PUBLIC_SUPABASE_ANON_KEY=* Supabase project anonymous key
*SUPABASE_SERVICE_ROLE_KEY=* Your Supabase project's service role key
*SUPABASE_DB_URL=* connect-connection string-copy-set password of db
*SMTP_PASSWORD=* 6 digit password generated from google app password
*SMTP_USERNAME=* google app account gmail
