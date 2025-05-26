# 2. Local Development Setup

This guide outlines the steps to run the project on your local machine for development and testing.

## Prerequisites

Ensure you have completed the [Environment Setup](./01_ENVIRONMENT_SETUP.md) and have all the necessary tools listed in the main [README](./README.md).

## Steps

1.  **Clone the Repository (if you haven't already):**
    ```bash
    git clone <repository_url>
    cd <project_directory_name>
    ```

2.  **Install Frontend Dependencies:**
    Navigate to the project root (where `package.json` is located) and run:
    ```bash
    npm install
    

3.  **Initialize Supabase (if setting up for the first time locally):**
    If this is your first time setting up Supabase locally for this project, run:
    ```bash
    supabase init
    ```
    This will create the `supabase` directory and a basic `config.toml` if they don't exist.

4.  **Start Supabase Services:**
    This command starts the local Supabase stack (Postgres database, GoTrue auth, Realtime, Storage, Edge Functions, Studio, etc.) using Docker.
    ```bash
    supabase start
    ```
    *   Wait for all services to be ready. You'll see output indicating the local Supabase Studio URL, API URL, DB URL, etc.
    *   The first time you run this, it might take a while to download Docker images.
    *   Any existing database migrations in `supabase/migrations` will be applied automatically.
    *   The `supabase/seed.sql` file will be executed if it exists and seeding is enabled in `config.toml`.

5.  **Apply Database Schema and Seed Data (if not handled by `supabase start` or for manual setup):**
    If you are managing your database schema with the SQL files in `docs/03_DATABASE_SETUP/` for a manual setup (instead of relying solely on `supabase/migrations/` for this documented setup):
    *   Connect to your local Supabase database using a SQL client (e.g., Supabase Studio SQL Editor, DBeaver, pgAdmin).
    *   Execute the SQL scripts from `docs/03_DATABASE_SETUP/` in the following order:
        1.  `schema.sql` (or individual table creation scripts)
        2.  `rls_policies.sql`
        3.  `database_functions.sql`
    *   You might also want to run a seed script if you have initial data separate from `supabase/seed.sql`.

6.  **Run the Next.js Development Server:**
    In a new terminal window/tab, from the project root, run:
    ```bash
    npm run dev
    
    ```
    This will start the Next.js application, usually on `http://localhost:3000`.

7.  **Accessing Local Services:**
    *   **Next.js App:** `http://localhost:3000` (or as specified in your terminal)
    *   **Supabase Studio:** `http://localhost:54323` (or as specified by `supabase start` output)
    *   **Local API URL:** `http://localhost:54321` (or as specified)

## Stopping Supabase Services

When you're done with your development session, you can stop the local Supabase services:

```bash
supabase stop
```
To stop and remove all data (useful for a clean restart):
```bash
supabase stop --no-backup
```

## Common Issues

*   **Docker Not Running:** Ensure Docker Desktop is running before `supabase start`.
*   **Port Conflicts:** If default ports (54321, 54322, 54323, etc.) are in use, `supabase start` might fail. You can configure different ports in `supabase/config.toml` if necessary.
*   **Environment Variables Not Loaded:** Double-check your `.env.local` file and the instructions in `01_ENVIRONMENT_SETUP.md`. 