SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE SCHEMA public;

ALTER SCHEMA public OWNER TO pg_database_owner;

COMMENT ON SCHEMA public IS 'standard public schema';

SET default_tablespace = '';

SET default_table_access_method = heap;

CREATE TABLE public.about (
    id integer DEFAULT 1 NOT NULL,
    content text NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    image_url text,
    tags text[]
);

ALTER TABLE public.about OWNER TO postgres;

CREATE TABLE public.about_content (
    id uuid NOT NULL,
    headline_main text,
    headline_code_keyword text,
    headline_connector text,
    headline_creativity_keyword text,
    paragraph1 text,
    paragraph2 text,
    paragraph3 text,
    image_url text,
    image_tagline text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.about_content OWNER TO postgres;

CREATE TABLE public.admin_activity_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "timestamp" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_identifier text,
    action_type text NOT NULL,
    description text NOT NULL,
    details jsonb,
    is_read boolean DEFAULT false
);

ALTER TABLE public.admin_activity_log OWNER TO postgres;

CREATE TABLE public.admin_profile (
    id uuid NOT NULL,
    profile_photo_url text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.admin_profile OWNER TO postgres;

CREATE TABLE public.certifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    issuer text NOT NULL,
    date text NOT NULL,
    image_url text,
    verify_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.certifications OWNER TO postgres;

CREATE TABLE public.contact_page_details (
    id uuid NOT NULL,
    address text,
    phone text,
    phone_href text,
    email text,
    email_href text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.contact_page_details OWNER TO postgres;

CREATE TABLE public.contact_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    subject text,
    message text NOT NULL,
    phone_number text,
    status text DEFAULT 'New'::text,
    is_starred boolean DEFAULT false,
    submitted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes text
);

ALTER TABLE public.contact_submissions OWNER TO postgres;

CREATE TABLE public.hero_content (
    id uuid NOT NULL,
    main_name text,
    subtitles text[],
    social_media_links jsonb,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.hero_content OWNER TO postgres;

CREATE TABLE public.legal_documents (
    id text NOT NULL,
    title text NOT NULL,
    content text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.legal_documents OWNER TO postgres;

CREATE TABLE public.project_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    viewed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    viewer_identifier text
);

ALTER TABLE public.project_views OWNER TO postgres;

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    image_url text,
    live_demo_url text,
    repo_url text,
    tags text[],
    status text,
    progress integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.projects OWNER TO postgres;

CREATE TABLE public.quick_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    title text,
    content text,
    tags text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.quick_notes OWNER TO postgres;

COMMENT ON TABLE public.quick_notes IS 'Stores multiple quick notes per admin user.';

COMMENT ON COLUMN public.quick_notes.user_id IS 'The ID of the admin user who owns this note.';

COMMENT ON COLUMN public.quick_notes.title IS 'An optional title for the note.';

COMMENT ON COLUMN public.quick_notes.content IS 'The main text content of the note.';

COMMENT ON COLUMN public.quick_notes.tags IS 'An array of tags associated with the note.';

CREATE TABLE public.resume_downloads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    downloaded_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    downloader_identifier text
);

ALTER TABLE public.resume_downloads OWNER TO postgres;

CREATE TABLE public.resume_education (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    degree_or_certification text NOT NULL,
    institution_name text NOT NULL,
    date_range text,
    description text,
    icon_image_url text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.resume_education OWNER TO postgres;

CREATE TABLE public.resume_experience (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_title text NOT NULL,
    company_name text NOT NULL,
    date_range text,
    description_points text[],
    icon_image_url text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.resume_experience OWNER TO postgres;

CREATE TABLE public.resume_key_skill_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_name text NOT NULL,
    icon_image_url text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.resume_key_skill_categories OWNER TO postgres;

CREATE TABLE public.resume_key_skills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    skill_name text NOT NULL,
    category_id uuid
);

ALTER TABLE public.resume_key_skills OWNER TO postgres;

CREATE TABLE public.resume_languages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    language_name text NOT NULL,
    proficiency text,
    icon_image_url text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.resume_languages OWNER TO postgres;

CREATE TABLE public.resume_meta (
    id uuid NOT NULL,
    description text,
    resume_pdf_url text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.resume_meta OWNER TO postgres;

CREATE TABLE public.site_settings (
    id text NOT NULL,
    is_maintenance_mode_enabled boolean DEFAULT false NOT NULL,
    maintenance_message text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_analytics_tracking_enabled boolean DEFAULT true NOT NULL
);

ALTER TABLE public.site_settings OWNER TO postgres;

CREATE TABLE public.skill_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    icon_image_url text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.skill_categories OWNER TO postgres;

CREATE TABLE public.skill_interactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    skill_id uuid,
    interaction_type text DEFAULT 'view'::text,
    interacted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    viewer_identifier text
);

ALTER TABLE public.skill_interactions OWNER TO postgres;

CREATE TABLE public.skills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    icon_image_url text,
    description text,
    category_id uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.skills OWNER TO postgres;

CREATE TABLE public.social_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    label text NOT NULL,
    icon_image_url text,
    url text NOT NULL,
    display_text text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.social_links OWNER TO postgres;

CREATE TABLE public.social_media_clicks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    platform text NOT NULL,
    clicks_count integer DEFAULT 0 NOT NULL,
    recorded_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT social_media_clicks_clicks_count_check CHECK ((clicks_count >= 0))
);

ALTER TABLE public.social_media_clicks OWNER TO postgres;

COMMENT ON COLUMN public.social_media_clicks.platform IS 'Name of the social media platform (e.g., Facebook, X (Twitter), Instagram)';

COMMENT ON COLUMN public.social_media_clicks.clicks_count IS 'Number of clicks received from this platform on the recorded_date';

COMMENT ON COLUMN public.social_media_clicks.recorded_date IS 'The specific date the clicks_count refers to';

CREATE TABLE public.timeline_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    icon_image_url text,
    type text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.timeline_events OWNER TO postgres;

CREATE TABLE public.visitor_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    visited_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    device_type text,
    path_visited text,
    user_agent_string text,
    viewer_identifier text
);

ALTER TABLE public.visitor_logs OWNER TO postgres;

ALTER TABLE ONLY public.about_content
    ADD CONSTRAINT about_content_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.about
    ADD CONSTRAINT about_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.admin_activity_log
    ADD CONSTRAINT admin_activity_log_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.admin_profile
    ADD CONSTRAINT admin_profile_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.contact_page_details
    ADD CONSTRAINT contact_page_details_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.contact_submissions
    ADD CONSTRAINT contact_submissions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.hero_content
    ADD CONSTRAINT hero_content_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT legal_documents_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.project_views
    ADD CONSTRAINT project_views_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.quick_notes
    ADD CONSTRAINT quick_notes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.resume_downloads
    ADD CONSTRAINT resume_downloads_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.resume_education
    ADD CONSTRAINT resume_education_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.resume_experience
    ADD CONSTRAINT resume_experience_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.resume_key_skill_categories
    ADD CONSTRAINT resume_key_skill_categories_category_name_key UNIQUE (category_name);

ALTER TABLE ONLY public.resume_key_skill_categories
    ADD CONSTRAINT resume_key_skill_categories_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.resume_key_skills
    ADD CONSTRAINT resume_key_skills_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.resume_languages
    ADD CONSTRAINT resume_languages_language_name_key UNIQUE (language_name);

ALTER TABLE ONLY public.resume_languages
    ADD CONSTRAINT resume_languages_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.resume_meta
    ADD CONSTRAINT resume_meta_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.skill_categories
    ADD CONSTRAINT skill_categories_name_key UNIQUE (name);

ALTER TABLE ONLY public.skill_categories
    ADD CONSTRAINT skill_categories_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.skill_interactions
    ADD CONSTRAINT skill_interactions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.social_links
    ADD CONSTRAINT social_links_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.social_media_clicks
    ADD CONSTRAINT social_media_clicks_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.social_media_clicks
    ADD CONSTRAINT social_media_clicks_platform_recorded_date_key UNIQUE (platform, recorded_date);

ALTER TABLE ONLY public.timeline_events
    ADD CONSTRAINT timeline_events_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.visitor_logs
    ADD CONSTRAINT visitor_logs_pkey PRIMARY KEY (id);

CREATE TRIGGER handle_quick_notes_updated_at BEFORE UPDATE ON public.quick_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE ONLY public.project_views
    ADD CONSTRAINT project_views_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.quick_notes
    ADD CONSTRAINT quick_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.resume_key_skills
    ADD CONSTRAINT resume_key_skills_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.resume_key_skill_categories(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.skill_interactions
    ADD CONSTRAINT skill_interactions_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.skill_categories(id) ON DELETE CASCADE;

