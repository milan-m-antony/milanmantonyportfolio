# Project Setup Guide

This guide explains how to run the project locally and deploy it to Vercel with Supabase as the backend.

---

## 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Supabase account](https://supabase.com/)
- [Vercel account](https://vercel.com/)

---

## 2. Supabase Setup

### a. Create a Supabase Project

1. Go to [Supabase](https://app.supabase.com/) and create a new project.
2. Note your **Project URL** and **anon/public API key**.

### b. Import Database Schema

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Copy the contents of `all_tables_schema.sql` and run it to create all tables, policies, and roles.

### c. Create Storage Buckets

In the Supabase dashboard, go to **Storage** and create the following buckets:

- `project-images`
- `category-icons`
- `skill-icons`
- `about-images`
- `certification-images`
- `resume-pdfs`
- `admin-profile-photos`

### d. Enable Authentication

1. Go to **Authentication** > **Settings**.
2. Configure providers (e.g., Email, Google, GitHub) as needed.
3. Adjust email templates and settings as desired.

---

## 3. Local Development Setup

### a. Clone the Repository

```sh
git clone <your-repo-url>
cd <your-repo-folder>
```

### b. Install Dependencies

```sh
npm install

```

### c. Create `.env.local`

Create a `.env.local` file in the root directory of your project. This file is used to store environment-specific variables and should not be committed to version control (it's usually included in `.gitignore`).

Add the following content to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_DB_URL=your-supabase-db-url
SMTP_PASSWORD=your-smtp-password
SMTP_USERNAME=your-smtp-username
# Add any other environment variables your app requires
```

**Where to find these values:**

*   **`NEXT_PUBLIC_SUPABASE_URL`**: In your Supabase project dashboard, go to **Project Settings** > **API**. You'll find the **Project URL** here.
*   **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: In your Supabase project dashboard, go to **Project Settings** > **API**. You'll find the **Project API keys** > **`anon` `public`** key here.
*   **`SUPABASE_SERVICE_ROLE_KEY`**: In your Supabase project dashboard, go to **Project Settings** > **API**. You'll find the **Project API keys** > **`service_role` `secret`** key here. **Important:** This key has admin privileges and should be kept secret and only used on the server-side.
*   **`SUPABASE_DB_URL`**: In your Supabase project dashboard, go to **Project Settings** > **Database** > **Connection string** (select URI). It will look something like `postgresql://postgres:[YOUR-PASSWORD]@[HOST]:[PORT]/postgres`. (change [YOUR-PASSWORD] to your actual password)
*   **`SMTP_PASSWORD`**: The password for your SMTP server/email provider. This is used for sending emails (e.g., for authentication, notifications).
*   **`SMTP_USERNAME`**: The username for your SMTP server/email provider.

Replace the placeholder values (`your-supabase-url`, `your-supabase-anon-key`, etc.) with your actual credentials and configuration details.

### d. Run the Development Server

```sh
npm run dev
```

The app should now be running at [http://localhost:3000](http://localhost:3000).

---

## 4. Edge Functions 
copy paste edge function in supabase-functions-(each)
---


## 5. Deploy to Vercel

1. Push your code to GitHub/GitLab/Bitbucket.
2. Go to [Vercel](https://vercel.com/) and import your repository.
3. In Vercel dashboard, go to your project's **Settings** > **Environment Variables**. Set the same environment variables as in your `.env.local` file. These should include:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_DB_URL`
   - `SMTP_PASSWORD`
   - `SMTP_USERNAME`
   Ensure you select the appropriate environments (Production, Preview, Development) for each variable.
4. Deploy the project.

---

## 6. Notes

- **Database migrations:** If you update your schema, re-export and re-run the new `all_tables_schema.sql` in Supabase.
- **Storage migration:** Upload your files to the correct buckets via the Supabase dashboard or CLI.
- **Authentication:** Make sure your frontend uses Supabase Auth for login/signup.

---

## 7. Useful Links

- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

---

## 8. Troubleshooting-

- If you see database errors, check your Supabase credentials and schema.
- For storage issues, ensure buckets exist and permissions are set.
- For authentication issues, verify provider setup and API keys.

---

**Enjoy building!**