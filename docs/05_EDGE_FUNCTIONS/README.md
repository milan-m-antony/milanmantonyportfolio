# 5. Edge Functions

This section provides an overview of the Supabase Edge Functions used in this project and how to manage them.

## Overview

Edge Functions are serverless functions that run on Supabase's global network. They are written in TypeScript/JavaScript and can be used for various backend tasks, such as:

*   Interacting with the Supabase database (with elevated privileges if needed).
*   Calling third-party APIs.
*   Handling webhooks.
*   Performing complex business logic that shouldn't reside in the client.

## Functions in this Project

1.  **`danger-delete-all-data`**: 
    *   **Description:** An administrative function designed to delete data from specified sections of the portfolio, including database tables and storage buckets. This is a sensitive operation and should be protected accordingly.
    *   **Source Code:** [`./danger_delete_all_data/index.ts`](./danger_delete_all_data/index.ts)
    *   **Import Map:** [`./danger_delete_all_data/deno.json`](./danger_delete_all_data/deno.json)

2.  **(Add other functions here if any)**

## Local Development

When you run `supabase start`, the Supabase CLI will also serve your Edge Functions locally. You can test them by making requests to their local endpoint (usually `http://localhost:54321/functions/v1/<function-name>`).

*   Changes to your function code in `supabase/functions/<function-name>/index.ts` should trigger a reload of the function locally (depending on your `supabase/config.toml` policy, `oneshot` is good for hot-reloading).

## Deployment

There are two main ways to deploy Edge Functions to your live Supabase project:

1.  **Using the Supabase CLI (Recommended for version-controlled projects):**
    ```bash
    # Deploy a specific function
    supabase functions deploy <function-name>

    # Deploy all functions (if you have multiple new or updated functions)
    # supabase deploy # This command is broader and also handles migrations, etc.
    ```
    *   Ensure your `supabase/config.toml` correctly lists and configures each function (e.g., `verify_jwt`, `import_map`).
    *   Set any required secrets for the function in the Supabase Dashboard (Functions > Your Function > Secrets) AFTER deployment if they are not already set. The `SUPABASE_SERVICE_ROLE_KEY` is a common secret for functions needing admin privileges.

2.  **Manual Deployment via Supabase Dashboard:**
    *   Navigate to Functions in your Supabase project dashboard.
    *   Click "Create a function".
    *   You can copy and paste the code from the relevant `index.ts` file (e.g., from `docs/05_EDGE_FUNCTIONS/danger_delete_all_data/index.ts`) directly into the online editor.
    *   Configure settings like JWT verification and add secrets manually.
    *   This method is quicker for one-off deployments or if you are not using the Supabase CLI for function management.

## Secrets Management

**Never hardcode secrets (like API keys or `SUPABASE_SERVICE_ROLE_KEY`) directly into your Edge Function code.**

*   For local development, the Supabase CLI might make some environment variables available.
*   For deployed functions, always use the "Secrets" section in the Supabase Dashboard for each function. These are injected as environment variables at runtime.
    Example: If you set a secret `MY_API_KEY` in the dashboard, you can access it in your function code as `Deno.env.get("MY_API_KEY")`.

## Invoking Functions

Edge Functions can be invoked from your client-side code (e.g., Next.js app) using `supabase.functions.invoke('<function-name>', { body: { ... } })` or via direct HTTP requests. 