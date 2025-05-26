-- Custom Database Functions

CREATE FUNCTION public.get_current_database_size_pretty() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  SELECT pg_size_pretty(pg_database_size(current_database()));
$$;

ALTER FUNCTION public.get_current_database_size_pretty() OWNER TO postgres;
GRANT ALL ON FUNCTION public.get_current_database_size_pretty() TO anon;
GRANT ALL ON FUNCTION public.get_current_database_size_pretty() TO authenticated;
GRANT ALL ON FUNCTION public.get_current_database_size_pretty() TO service_role;

CREATE FUNCTION public.increment_social_click(platform_name text, click_date date) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO social_media_clicks (platform, date, click_count)
    VALUES (platform_name, click_date, 1)
    ON CONFLICT (platform, date)
    DO UPDATE SET click_count = social_media_clicks.click_count + 1;
END;
$$;

ALTER FUNCTION public.increment_social_click(platform_name text, click_date date) OWNER TO postgres;
GRANT ALL ON FUNCTION public.increment_social_click(platform_name text, click_date date) TO anon;
GRANT ALL ON FUNCTION public.increment_social_click(platform_name text, click_date date) TO authenticated;
GRANT ALL ON FUNCTION public.increment_social_click(platform_name text, click_date date) TO service_role;

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;
