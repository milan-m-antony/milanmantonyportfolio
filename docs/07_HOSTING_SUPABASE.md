# 7. Hosting Supabase (Backend)

This guide covers setting up and managing your Supabase backend, which provides the database, authentication, storage, and Edge Functions for your project.

## Option 1: Using Supabase Cloud (Recommended for Production)

Supabase offers a hosted cloud platform which is generally recommended for live applications.

1.  **Create a Supabase Account:**
    If you don't have one, sign up at [supabase.com](https://supabase.com/).

2.  **Create a New Project:**
    *   From your Supabase dashboard, create a new project.
    *   Choose a name, database password (save this securely!), and region.
    *   Select a pricing plan (Supabase offers a generous free tier).

3.  **Project API Keys and URL:**
    *   Once your project is provisioned, go to Project Settings > API.
    *   You will find your **Project URL** and **Anon (public) Key** here. These are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for your frontend.
    *   You will also find your **Service Role Key** (treat this as a secret). This is `SUPABASE_SERVICE_ROLE_KEY` used for admin operations (e.g., in Edge Functions or backend scripts).

4.  **Database Setup:**
    *   **Using Supabase CLI Migrations (Recommended):**
        *   Link your local project to your live Supabase project: `supabase link --project-ref <your-project-ref>` (get `<your-project-ref>` from your Supabase project dashboard URL: `https://app.supabase.com/project/<project_ref>`).
        *   Push your local database migrations: `supabase db push`.
        *   This will apply all migrations from your `supabase/migrations` folder to your live database.
    *   **Manual SQL Execution:**
        *   Alternatively, you can connect to your live Supabase database using the SQL Editor in the Supabase Dashboard (or an external SQL client).
        *   Execute the SQL scripts from `docs/03_DATABASE_SETUP/` in the following order:
            1.  `schema.sql`
            2.  `rls_policies.sql`
            3.  `database_functions.sql`
        *   You may also need to run a seed script for initial data.

5.  **Storage Bucket Setup:**
    *   Create the necessary storage buckets as defined in `docs/04_STORAGE_SETUP.md`.
    *   You can do this via the Supabase Dashboard (Storage > Buckets > Create bucket) or by running the SQL commands for bucket creation (if you included them in your database setup scripts).
    *   Ensure RLS policies for storage are also applied if needed.

6.  **Edge Function Deployment:**
    *   Deploy your Edge Functions as described in `docs/05_EDGE_FUNCTIONS/README.md`.
    *   This can be done via `supabase functions deploy <function-name>` (after linking the project) or manually by copy-pasting code into the Supabase Dashboard.
    *   **Crucially, set any required secrets** (like `SUPABASE_SERVICE_ROLE_KEY` or other API keys) for each function in the Supabase Dashboard (Functions > Your Function > Secrets).

7.  **Authentication Configuration:**
    *   Go to Auth > URL Configuration.
    *   Set your **Site URL** to your primary frontend URL (e.g., your Vercel deployment URL).
    *   Add your frontend URL(s) to the **Redirect URLs** allow-list (e.g., `https://your-project.vercel.app/auth/callback`).
    *   Configure any third-party providers (e.g., Google, GitHub) if your application uses them.

## Option 2: Self-Hosting Supabase

Supabase is open source and can be self-hosted. This is an advanced option and requires managing your own infrastructure.

*   Refer to the official Supabase documentation for self-hosting guides: [Supabase Self-Hosting](https://supabase.com/docs/guides/hosting/overview)
*   This involves setting up Docker and managing all the Supabase services (Postgres, GoTrue, Kong, etc.) yourself.

## Connecting Frontend to Supabase

Ensure your frontend application (e.g., deployed on Vercel) is configured with the correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` corresponding to your live Supabase project.

## Backups and Maintenance (Supabase Cloud)

*   Supabase Cloud handles point-in-time recovery (PITR) for paid plans and provides daily backups for free-tier projects.
*   Regularly review your Supabase project settings, usage, and security configurations. 