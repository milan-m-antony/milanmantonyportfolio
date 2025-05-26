# 6. Hosting Frontend on Vercel

This guide provides instructions for deploying the Next.js frontend of this project to Vercel.

## Prerequisites

*   A Vercel account (free or paid).
*   Your project code pushed to a Git repository (GitHub, GitLab, Bitbucket).
*   Your Supabase project should be set up (either a live Supabase project or your local one if you plan to expose it via a tunnel for testing, though a live Supabase project is recommended for a Vercel deployment).

## Deployment Steps

1.  **Log in to Vercel:**
    Go to [vercel.com](https://vercel.com/) and log in with your account.

2.  **Import Project:**
    *   From your Vercel dashboard, click on "Add New..." > "Project".
    *   Connect Vercel to your Git provider (e.g., GitHub) if you haven't already.
    *   Select the repository for this project.

3.  **Configure Project:**
    *   **Project Name:** Vercel will usually suggest one based on your repository name; you can change it.
    *   **Framework Preset:** Vercel should automatically detect it as a "Next.js" project. If not, select it manually.
    *   **Root Directory:** If your Next.js app is not in the root of your repository (e.g., it's in a `frontend/` or `app/` subfolder), specify the correct root directory. For this project, if `package.json` and `next.config.js` are at the root, this setting can usually be left as default.
    *   **Build and Output Settings:** Vercel typically handles these automatically for Next.js. Default settings should work.
        *   Build Command: `next build` (or your custom build command if you have one, e.g., `npm run build`)
        *   Output Directory: `.next`
        *   Install Command: `npm install` (or `yarn install`)

4.  **Environment Variables:**
    This is a crucial step. You need to provide Vercel with the necessary environment variables for your Next.js application to connect to Supabase.
    *   Go to your project's settings in Vercel (Project > Settings > Environment Variables).
    *   Add the following variables (refer to `docs/example.env` and your actual Supabase project details):
        *   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase project's anonymous key.
        *   *(Add any other `NEXT_PUBLIC_` variables your frontend needs)*
    *   **Important:** Do NOT add server-side secrets like `SUPABASE_SERVICE_ROLE_KEY` here if they are only used by backend functions/API routes that are *not* part of your Vercel deployment (e.g., if they are exclusively for Supabase Edge Functions). If your Next.js API routes on Vercel need service-level access, you would add `SUPABASE_SERVICE_ROLE_KEY` here, but be mindful of security implications.

5.  **Deploy:**
    *   Click the "Deploy" button.
    *   Vercel will start the build and deployment process. You can monitor the logs in real-time.

6.  **Assign Domain (Optional):**
    *   Once deployed, Vercel will provide you with a default domain (e.g., `your-project.vercel.app`).
    *   You can assign a custom domain in your project's settings (Project > Settings > Domains).

## Continuous Deployment

By default, Vercel sets up continuous deployment. Any new pushes to your connected Git branch (usually `main` or `master`) will automatically trigger a new build and deployment.

## Important Considerations

*   **Supabase URL and Anon Key:** Ensure these are from your *live* Supabase project, not your local development one, unless you are specifically testing with a tunneled local instance.
*   **Authentication Redirects:** In your Supabase project's authentication settings (Auth > URL Configuration), ensure your Vercel deployment URL(s) are added to the "Redirect URLs" allow-list. For example: `https://your-project.vercel.app/auth/callback`.
*   **Site URL:** Also in Supabase Auth settings, set the "Site URL" to your primary Vercel domain.
*   **Troubleshooting Builds:** If a build fails, check the Vercel deployment logs for errors. Common issues include missing dependencies, incorrect environment variables, or build command failures. 