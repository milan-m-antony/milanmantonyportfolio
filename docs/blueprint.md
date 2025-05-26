
# Application Blueprint: Personal Portfolio - Milan

## 1. Overview

*   **Purpose:** A dynamic, modern personal portfolio website for Milan, showcasing projects, skills, career journey, and contact information. All content is dynamically managed through a comprehensive admin dashboard.
*   **Key Technologies:** Next.js (App Router), React, TypeScript, Supabase (PostgreSQL for database, Supabase Storage for file uploads, Supabase Authentication, Supabase Edge Functions), ShadCN UI components, Tailwind CSS, Nodemailer (within Edge Function for email).

## 2. Core Public-Facing Features (User View)

*   **Hero Section:**
    *   Displays admin-configurable main name.
    *   Features a typewriter effect for multiple subtitles, managed from the admin panel.
    *   Shows a list of social media links with icons (icon image URLs configured by admin).
    *   Includes a scroll-down indicator.
*   **About Me Section:**
    *   Dynamic headline composed of multiple parts (main, code keyword, connector, creativity keyword), all editable.
    *   Multiple paragraphs of text for the "About Me" description, managed via admin.
    *   Displays an image (uploaded via admin) with an optional tagline (editable).
*   **Projects Gallery:**
    *   Displays projects in a responsive carousel.
    *   Each project card shows: title, description, image (uploaded via admin or external URL), tags, status (e.g., "Deployed", "In Progress" with progress bar), and links to Live Demo and Source Code (if available). All project details are managed by the admin.
*   **Skills Overview:**
    *   Skills are grouped into categories.
    *   Categories can have custom icon image URLs.
    *   Individual skills within categories can have their own icon image URLs and descriptions.
    *   A search bar allows users to filter skills and categories.
*   **Career Journey (Timeline):**
    *   An interactive, visually distinct timeline.
    *   Displays events like work experience, education, certifications, and milestones.
    *   Each event includes a date, title, description, and a custom icon (via image URL).
*   **Certifications & Badges:**
    *   Displays certifications in a responsive carousel.
    *   Each certification card shows: title, issuer, date, image (uploaded), and a link to verify the credential (if provided).
    *   Image preview in a lightbox/modal on click.
*   **Resume/CV Section:**
    *   Displays an overall resume description/summary from the admin panel.
    *   Provides buttons to "Preview PDF" (in a lightbox-style modal) and "Download PDF". The PDF itself is uploaded via the admin dashboard.
    *   Includes "Last Updated" timestamp for the resume.
    *   Uses tabs to show detailed sections:
        *   **Experience:** Lists job roles with company, dates, description points, and an optional icon (via image URL).
        *   **Education:** Lists degrees/certifications with institution, dates, description, and an optional icon (via image URL).
        *   **Key Skills:** Displays skills grouped by categories. Categories can have icons (via image URL). Skills are listed as badges.
        *   **Languages:** Lists languages with proficiency levels and optional icons (via image URL).
*   **Contact Section:**
    *   Displays contact information (address, phone, email) managed via admin.
    *   Lists social media links (label, URL, icon image URL, display text) managed via admin.
    *   Includes a functional contact form (Name, Email, Subject, Message, optional Phone Number) that saves submissions to the Supabase database.
*   **Footer:**
    *   Contains copyright information.
    *   Links to "Terms & Conditions" and "Privacy Policy" pages, which display content dynamically managed from the admin dashboard (shown in modals).
*   **UI/UX Features:**
    *   Light/Dark mode toggle, persistent across sessions.
    *   Fully responsive design for various screen sizes.
    *   Preloader screen with a "1, 2, 3" zoom animation on initial load.
    *   Subtle animations and transitions for a modern feel.

## 3. Admin Dashboard Features (`/admin/dashboard`)

*   **Authentication:**
    *   Login page at `/admin/dashboard` (redirects from `/admin`).
    *   Uses **Supabase Authentication** (email/password for the admin user).
*   **Layout:**
    *   Collapsible sidebar for navigation between content management sections.
    *   Header displaying current section title, theme toggle, admin profile avatar, and activity log trigger.
*   **Content Management Sections (All with CRUD capabilities):**
    *   **Dashboard Overview:** Landing page (placeholder).
    *   **Hero Section Manager:**
        *   Edit Main Name.
        *   Edit Subtitles (comma-separated for typewriter).
        *   Add, Edit, Delete Social Media Links (each with label, URL, icon image URL).
    *   **About Section Manager:**
        *   Edit Headline components (main, code keyword, connector, creativity keyword).
        *   Edit Paragraphs 1, 2, 3.
        *   Upload/Manage "About Me" image (stored in `about-images` bucket).
        *   Edit Image Tagline.
    *   **Projects Manager:**
        *   Add, Edit, Delete projects.
        *   Fields: Title, Description, Image Upload (to `project-images` bucket) or URL, Live Demo URL, Repo URL, Tags (comma-separated), Status (dropdown: Deployed, In Progress, etc.), Progress percentage (slider).
    *   **Skills Manager:**
        *   **Skill Categories:** Add, Edit, Delete categories (Name, Icon Image Upload to `category-icons` bucket or URL, Sort Order).
        *   **Skills (within categories):** Add, Edit, Delete skills (Name, Icon Image Upload to `skill-icons` bucket or URL, Description).
    *   **Journey (Timeline) Manager:**
        *   Add, Edit, Delete timeline events.
        *   Fields: Date, Title, Description, Icon Image URL, Type (dropdown: Work, Education, etc.), Sort Order.
    *   **Certifications Manager:**
        *   Add, Edit, Delete certifications.
        *   Fields: Title, Issuer, Date, Image Upload (to `certification-images` bucket) or URL, Verification URL.
    *   **Resume Manager:**
        *   **General Info:** Edit overall resume description, Upload/Manage main Resume PDF (to `resume-pdfs` bucket).
        *   **Experience Tab:** Add, Edit, Delete experience entries (Job Title, Company, Dates, Description Points (textarea), Icon Image URL, Sort Order).
        *   **Education Tab:** Add, Edit, Delete education entries (Degree/Cert, Institution, Dates, Description, Icon Image URL, Sort Order).
        *   **Key Skills Tab:**
            *   Manage Skill Categories (Category Name, Icon Image URL, Sort Order).
            *   Manage Skills within categories (Skill Name).
        *   **Languages Tab:** Add, Edit, Delete languages (Language Name, Proficiency, Icon Image URL, Sort Order).
    *   **Contact & Submissions Manager:**
        *   **Contact Page Details:** Edit Address, Phone (display & href), Email (display & href).
        *   **Social Links (for contact page):** Add, Edit, Delete links (Label, URL, Icon Image URL, Display Text, Sort Order).
        *   **Contact Form Submissions:** View list of submissions, filter by status (New, Replied, Archived), mark as starred, change status, view full message in a modal, delete submissions. **Reply via Supabase Edge Function (e.g., using Gmail SMTP via Nodemailer).**
    *   **Legal Pages Manager:**
        *   Edit content for "Terms & Conditions".
        *   Edit content for "Privacy Policy". (Content stored as text, can be Markdown/HTML).
    *   **Settings Manager:**
        *   Toggle site-wide Maintenance Mode (On/Off).
        *   Edit the custom message displayed during Maintenance Mode.
        *   **Danger Zone:** "Delete All Portfolio Data" feature with multi-step confirmation (including password re-entry and countdown), invoking a Supabase Edge Function to clear database tables.
*   **Admin Profile (Dropdown Menu from Avatar):**
    *   Manage (upload, update, delete) admin profile photo (stored in `admin-profile-photos` bucket).
    *   **Account Settings:**
        *   Change admin email/username (initiates Supabase Auth email change, possibly via Edge Function for direct update).
        *   Change admin password (uses Supabase Auth).
    *   Logout button.
*   **Activity Log:**
    *   Accessible via a Bell icon in the header.
    *   Displays a sheet with a list of recent admin actions (e.g., "Project 'X' created", "Admin logged in").
    *   Option to clear the entire activity log (with confirmation).
*   **Image Uploads:** All image uploads are handled via client-side selection, then uploaded to designated Supabase Storage buckets. Old images are deleted from storage when replaced or removed.

## 4. Database Schema (Supabase - PostgreSQL)

*   **`projects`**: `id`, `title`, `description`, `image_url`, `live_demo_url`, `repo_url`, `tags` (TEXT[]), `status`, `progress`, `created_at`.
*   **`skill_categories`**: `id`, `name` (UNIQUE), `icon_image_url`, `sort_order`, `created_at`.
*   **`skills`**: `id`, `name`, `icon_image_url`, `description`, `category_id` (FK to `skill_categories`), `created_at`.
*   **`certifications`**: `id`, `title`, `issuer`, `date`, `image_url`, `verify_url`, `created_at`.
*   **`timeline_events`**: `id`, `date`, `title`, `description`, `icon_image_url`, `type`, `sort_order`, `created_at`.
*   **`about_content`**: `id` (Fixed UUID: `'00000000-0000-0000-0000-000000000001'`), `headline_main`, `headline_code_keyword`, `headline_connector`, `headline_creativity_keyword`, `paragraph1`, `paragraph2`, `paragraph3`, `image_url`, `image_tagline`, `updated_at`.
*   **`resume_meta`**: `id` (Fixed UUID: `'00000000-0000-0000-0000-000000000003'`), `description`, `resume_pdf_url`, `updated_at`.
*   **`resume_experience`**: `id`, `job_title`, `company_name`, `date_range`, `description_points` (TEXT[]), `icon_image_url`, `sort_order`, `created_at`.
*   **`resume_education`**: `id`, `degree_or_certification`, `institution_name`, `date_range`, `description`, `icon_image_url`, `sort_order`, `created_at`.
*   **`resume_key_skill_categories`**: `id`, `category_name` (UNIQUE), `icon_image_url`, `sort_order`, `created_at`.
*   **`resume_key_skills`**: `id`, `skill_name`, `category_id` (FK to `resume_key_skill_categories`).
*   **`resume_languages`**: `id`, `language_name` (UNIQUE), `proficiency`, `icon_image_url`, `sort_order`, `created_at`.
*   **`hero_content`**: `id` (Fixed UUID: `'00000000-0000-0000-0000-000000000004'`), `main_name`, `subtitles` (TEXT[]), `social_media_links` (JSONB - array of `{label, url, icon_image_url}`), `updated_at`.
*   **`contact_page_details`**: `id` (Fixed UUID: `'00000000-0000-0000-0000-000000000005'`), `address`, `phone`, `phone_href`, `email`, `email_href`, `updated_at`.
*   **`social_links`**: `id`, `label`, `icon_image_url`, `url`, `display_text`, `sort_order`, `created_at`.
*   **`contact_submissions`**: `id`, `name`, `email`, `subject`, `message`, `phone_number`, `status` (TEXT, default 'New'), `is_starred` (BOOLEAN, default false), `submitted_at`, `notes`.
*   **`site_settings`**: `id` (Fixed TEXT: `'global_settings'`), `is_maintenance_mode_enabled` (BOOLEAN), `maintenance_message` (TEXT), `updated_at`.
*   **`admin_profile`**: `id` (Fixed UUID: `'00000000-0000-0000-0000-00000000000A'`), `profile_photo_url`, `updated_at`.
*   **`admin_activity_log`**: `id`, `timestamp`, `user_identifier` (stores `auth.uid()`), `action_type`, `description`, `details` (JSONB), `is_read` (BOOLEAN).
*   **`legal_documents`**: `id` (TEXT, PK - e.g., 'terms-and-conditions'), `title`, `content`, `updated_at`.

*(All tables have RLS policies: public read for viewable content, and admin (`authenticated` role) for management).*

## 5. Storage Buckets (Supabase Storage)

*   `project-images`
*   `category-icons` (for skill categories)
*   `skill-icons`
*   `about-images`
*   `certification-images`
*   `resume-pdfs`
*   `resume-experience-icons` (if using image uploads for these)
*   `resume-education-icons` (if using image uploads for these)
*   `resume-language-icons` (if using image uploads for these)
*   `admin-profile-photos`

*(RLS policies on buckets allow public read and authenticated admin uploads/deletes).*

## 6. Key Client-Side Components (Public-Facing)

*   Section Components: `HeroSection.tsx`, `AboutSectionClientView.tsx`, `ProjectCarousel.tsx`, `SkillsClientView.tsx`, `TimelineItem.tsx`, `CertificationsClientView.tsx`, `ResumeSectionClientView.tsx`, `ContactSectionClientView.tsx`.
*   UI Components: Extensive use of ShadCN UI components.
*   Layout Components: `Header.tsx`, `Footer.tsx`, `Preloader.tsx`.
*   `ContactForm.tsx`

## 7. Key Admin-Side Components

*   `AdminPageLayout.tsx` (Main layout for the admin dashboard).
*   Manager Components:
    *   `HeroManager.tsx`
    *   `AboutManager.tsx`
    *   `ProjectsManager.tsx`
    *   `SkillsManager.tsx`
    *   `TimelineManager.tsx`
    *   `CertificationsManager.tsx`
    *   `ResumeManager.tsx`
    *   `ContactManager.tsx`
    *   `LegalManager.tsx`

## 8. Server-Side Logic

*   **Data Fetching:** Primarily done in Server Components (e.g., `src/app/page.tsx`, `src/app/layout.tsx`, and server-side parts of section components) using the Supabase client.
*   **Server Actions:**
    *   `src/lib/actions.ts`: Used for the public contact form submission (`submitContactForm`).
*   **Supabase Edge Functions:**
    *   `send-contact-reply`: Handles sending email replies for contact submissions.
    *   `danger-delete-all-data`: Handles deletion of portfolio database content.
    *   `admin-update-user-email`: Handles admin email/username changes.
*   **Middleware (`src/middleware.ts`):**
    *   Handles maintenance mode redirection by checking `site_settings` in Supabase.
*   **Admin Dashboard Data Operations:** Admin CRUD operations are handled client-side within manager components, directly invoking Supabase client methods (insert, update, delete, storage uploads) using the authenticated admin user's session.

## 9. Styling

*   **Tailwind CSS:** For utility-first styling throughout the application.
*   **ShadCN UI Theme:** Base theme configured in `src/app/globals.css` with CSS variables for light and dark modes, including custom sidebar theme variables.

## 10. Key Environment Variables (`.env.local`)

*   `NEXT_PUBLIC_SUPABASE_URL`
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
*   *(Supabase Edge Functions will require their own secrets set in the Supabase Dashboard, e.g., `SMTP_USERNAME`, `SMTP_PASSWORD`, `RESEND_API_KEY` if used, etc.)*

## 11. Potential Future Enhancements

*   Transition more client-side Supabase calls in admin managers to Next.js Server Actions for a unified data mutation pattern.
*   Implement server-side pagination and more advanced filtering/searching for admin lists.
*   Add a dedicated blog section with admin management.
*   Integrate analytics (e.g., Google Analytics or a self-hosted solution).
*   More robust error handling and user feedback for Edge Function operations.
```