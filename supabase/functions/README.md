# Supabase Edge Functions

This directory contains the Deno TypeScript code for the Supabase Edge Functions used in this project. These functions handle backend logic that is securely executed on Supabase's servers.

## Functions Overview

Below is a list of the Edge Functions, their purpose, and specific configurations.

### 1. `danger-delete-all-data`

*   **Purpose:** Securely deletes selected data groups (database tables) and associated files from Supabase Storage. This function is triggered from the admin dashboard's "Danger Zone" and is designed for irreversible data removal.
*   **Entrypoint:** `supabase/functions/danger-delete-all-data/index.ts`
*   **Required Secrets (in Supabase Dashboard):**
    *   `SUPABASE_URL`: Your project's Supabase URL.
    *   `SUPABASE_SERVICE_ROLE_KEY`: Your project's service role key.
*   **JWT Verification:** **Recommended: Enabled**. This function should be protected and only callable by an authenticated admin user. The function itself logs the action to `admin_activity_log` using the invoking user's ID from the JWT.

### 2. `admin-update-user-email`

*   **Purpose:** Allows an authenticated admin user to update their own email address (username) in Supabase Auth. The function uses admin privileges to change the email and automatically confirm it.
*   **Entrypoint:** `supabase/functions/admin-update-user-email/index.ts`
*   **Required Secrets (in Supabase Dashboard):**
    *   `SUPABASE_URL`: Your project's Supabase URL.
    *   `SUPABASE_SERVICE_ROLE_KEY`: Your project's service role key.
*   **JWT Verification:** **Required: Enabled**. This function relies on the incoming JWT to identify the user whose email needs to be updated.

### 3. `send-contact-reply`

*   **Purpose:** Sends an email reply to a user who submitted a message via the portfolio's contact form. It uses Nodemailer with Gmail SMTP to send styled HTML emails.
*   **Entrypoint:** `supabase/functions/send-contact-reply/index.ts`
*   **Required Secrets (in Supabase Dashboard):**
    *   `SUPABASE_URL`: Your project's Supabase URL.
    *   `SUPABASE_SERVICE_ROLE_KEY`: Your project's service role key.
    *   `SMTP_USERNAME`: Your Gmail address (e.g., `your.email@gmail.com`).
    *   `SMTP_PASSWORD`: Your Gmail App Password (recommended if 2FA is enabled for your Gmail account).
*   **JWT Verification:** **Recommended: Enabled**. If this function is triggered from an admin-only interface.
*   **Configuration:** Update placeholder constants at the top of the function file (e.g., `YOUR_FULL_NAME`, social media URLs) with your personal details.

### 4. `get-storage-metrics`

*   **Purpose:** Calculates and returns the current PostgreSQL database size and an approximate total size of files stored across all relevant Supabase Storage buckets.
*   **Entrypoint:** `supabase/functions/get-storage-metrics/index.ts`
*   **Required Secrets (in Supabase Dashboard):**
    *   `SUPABASE_URL`: Your project's Supabase URL.
    *   `SUPABASE_SERVICE_ROLE_KEY`: Your project's service role key.
    *   `POSTGRES_DB` (Optional): Your project's database name if it's not the default `postgres`. Used for a fallback database size query.
*   **JWT Verification:** **Optional**. Can be enabled if you want to restrict access, but often metrics endpoints might be accessed with a service role key directly or have more open access if data is not sensitive. The current implementation does not show client-side JWT usage for invocation.
*   **Prerequisites:**
    *   You **MUST** create the following SQL function in your Supabase project's SQL Editor for the primary database size calculation method to work:
        ```sql
        CREATE OR REPLACE FUNCTION get_current_database_size_pretty()
        RETURNS TEXT AS $$
        BEGIN
          RETURN pg_size_pretty(pg_database_size(current_database()));
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        GRANT EXECUTE ON FUNCTION get_current_database_size_pretty() TO authenticated, anon, service_role;
        ```

## Deployment to Supabase

1.  **Install Supabase CLI:**
    If you haven't already, install the Supabase CLI globally or as a dev dependency:
    ```bash
    npm install supabase --save-dev
    # or
    # yarn add supabase --dev
    # or
    # pnpm add -D supabase
    ```

2.  **Login to Supabase CLI:**
    ```bash
    npx supabase login
    ```
    This will open a browser window for you to authenticate.

3.  **Link your Supabase Project:**
    Navigate to your local project's root directory (where your `supabase` folder is) and link your Supabase project:
    ```bash
    npx supabase link --project-ref YOUR_PROJECT_ID
    ```
    Replace `YOUR_PROJECT_ID` with your actual Supabase project ID (found in your Supabase project's dashboard URL: `https://app.supabase.com/project/YOUR_PROJECT_ID`).

4.  **Deploy a Specific Function:**
    To deploy an individual function (e.g., `send-contact-reply`):
    ```bash
    npx supabase functions deploy send-contact-reply --project-ref YOUR_PROJECT_ID
    ```
    If you linked your project in step 3, you might be able to omit `--project-ref YOUR_PROJECT_ID`.
    Ensure the function name matches the directory name under `supabase/functions/`.

5.  **Deploy All Functions:**
    To deploy all functions defined in your `supabase/config.toml` (ensure they are listed there):
    ```bash
    npx supabase deploy --project-ref YOUR_PROJECT_ID
    ```
    (Note: `supabase deploy` is a broader command that can deploy database migrations, functions, etc. `supabase functions deploy` is more targeted).

6.  **Set Secrets in Supabase Dashboard:**
    For each deployed function:
    *   Go to your Supabase Project Dashboard.
    *   Navigate to "Edge Functions" in the sidebar.
    *   Select the function you deployed.
    *   Go to the "Settings" tab, then "Secrets".
    *   Add all the required environment variables (secrets) listed above for that specific function (e.g., `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_USERNAME`, etc.). **Secrets are not deployed with your code.**

7.  **Configure JWT Verification:**
    In the function's settings in the Supabase Dashboard, ensure "Verify JWT" is enabled or disabled as per the recommendations for each function.

## Integration with Vercel-Hosted Next.js App

Your Next.js application, when hosted on Vercel, will interact with these Supabase Edge Functions via HTTP requests.

*   **Invocation:** The Supabase client library (`@supabase/supabase-js`) provides a convenient way to invoke Edge Functions:
    ```javascript
    // Example in your Next.js app
    import { supabase } from '@/lib/supabaseClient'; // Your Supabase client instance

    async function callMyFunction() {
      const { data, error } = await supabase.functions.invoke('function-name', {
        body: { /* payload if any */ }
      });
      if (error) console.error("Error invoking function:", error);
      else console.log("Function returned:", data);
    }
    ```
    Replace `function-name` with the actual name of the Edge Function you want to call.

*   **Environment Variables on Vercel:**
    Your Vercel deployment for the Next.js app needs the following public Supabase environment variables configured in Vercel's project settings:
    *   `NEXT_PUBLIC_SUPABASE_URL`: Your project's Supabase URL.
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your project's public anon key.

*   **CORS:** The Edge Function templates provided include CORS headers (`Access-Control-Allow-Origin: '*'`) which allow your Vercel-hosted frontend to make requests to them. No additional CORS configuration on the Vercel side is typically needed for this interaction.

*   **Function URLs:** The Supabase client library automatically resolves the correct invocation URL for your Edge Functions based on your `NEXT_PUBLIC_SUPABASE_URL`. 