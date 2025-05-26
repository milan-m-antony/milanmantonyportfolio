# 8. Troubleshooting (Optional)

This section lists common issues encountered during setup, development, or deployment, along with potential solutions.

## Local Development

*   **Issue:** `supabase start` fails with port conflict errors.
    *   **Solution:** Check which application is using the conflicting port (e.g., 54321, 54322, 54323). Stop that application or configure different ports for Supabase services in `supabase/config.toml` and restart.

*   **Issue:** Docker not running or not responsive.
    *   **Solution:** Ensure Docker Desktop is running and has sufficient resources allocated. Restart Docker Desktop.

*   **Issue:** Changes to Edge Functions not reflecting locally.
    *   **Solution:** Ensure the `policy` for Edge Functions in `supabase/config.toml` is set to `oneshot` for hot-reloading. Restart `supabase start` if necessary.

*   **Issue:** Environment variables (`.env.local`) not picked up by Next.js.
    *   **Solution:** Ensure the file is named exactly `.env.local` and is in the project root. Restart the Next.js development server (`npm run dev`). Verify variable names (`NEXT_PUBLIC_...` for client-side access).

## Database & SQL

*   **Issue:** Error applying migrations or SQL scripts (e.g., syntax error, dependency issue).
    *   **Solution:** Carefully review the SQL error message. Check SQL syntax. If creating tables with foreign keys, ensure referenced tables are created first or use `ALTER TABLE` for constraints later. For RLS, ensure the table exists and RLS is enabled on it.

*   **Issue:** Cannot connect to local database with an external SQL client.
    *   **Solution:** Ensure `supabase start` is running. The local database URL is usually `postgresql://postgres:<your-db-password>@localhost:54322/postgres`. The default password is often `postgres` or what you set during `supabase init`.

## Edge Functions

*   **Issue:** Edge Function invocation fails with a 401 Unauthorized error.
    *   **Solution (Deployed):** Ensure JWT verification is enabled for the function in the Supabase Dashboard if it requires an authenticated user. Make sure the client is sending a valid Supabase JWT.
    *   **Solution (Secrets):** If the function relies on secrets (like `SUPABASE_SERVICE_ROLE_KEY`), ensure they are correctly set in the Supabase Dashboard for the deployed function.

*   **Issue:** Edge Function logs show `Deno.env.get("MY_SECRET")` is undefined.
    *   **Solution:** Secrets must be set in the Supabase Dashboard (Functions > Your Function > Secrets) for deployed functions. They are not automatically picked up from local `.env` files when deployed.

## Deployment (Vercel/Supabase Cloud)

*   **Issue:** Vercel build fails.
    *   **Solution:** Check Vercel deployment logs for specific errors. Common causes: missing dependencies (ensure `package.json` is correct), incorrect build command, or missing environment variables in Vercel project settings.

*   **Issue:** Frontend cannot connect to Supabase (CORS errors, network errors).
    *   **Solution:** Double-check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel environment variables. Ensure they point to your *live* Supabase project. Check Supabase project API settings for any restrictions.

*   **Issue:** Authentication redirects fail after deploying to Vercel.
    *   **Solution:** In your Supabase project's Auth settings (URL Configuration), add your Vercel domain(s) (e.g., `https://your-project.vercel.app`, `https://your-custom-domain.com`) to the "Redirect URLs" allow-list. Also set the "Site URL".

*   **Issue:** Deployed Edge Function is not working as expected.
    *   **Solution:** Check the function logs in the Supabase Dashboard (Functions > Your Function > Logs). Verify secrets are set. Test invoking the function directly (e.g., with cURL or Postman) to isolate issues.

## General Tips

*   **Check Logs:** Always check terminal output, browser console logs, Vercel deployment logs, and Supabase function/database logs for error messages.
*   **Supabase Documentation:** The official Supabase docs ([supabase.com/docs](https://supabase.com/docs)) are an excellent resource.
*   **Supabase CLI Version:** Ensure your Supabase CLI is up to date (`supabase upgrade`).

*(Add more specific troubleshooting tips relevant to your project as you encounter them.)* 