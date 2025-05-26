-- Row Level Security (RLS) Policies

-- Enable Row Level Security for tables
ALTER TABLE public.about ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_page_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_key_skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_key_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;

-- Policy Definitions
CREATE POLICY "Admin can manage about" ON public.about FOR ALL USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Admin can manage own about_content" ON public.about_content FOR ALL USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Admin can manage own data" ON public.admin_activity_log FOR ALL USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Admin can update their own profile" ON public.admin_profile FOR UPDATE USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));
CREATE POLICY "Admin users can manage their own certifications" ON public.certifications FOR ALL USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Admin users can manage their own contact page details" ON public.contact_page_details FOR ALL USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Admins can read and delete contact submissions" ON public.contact_submissions FOR SELECT, DELETE USING ((auth.role() = 'service_role'::text));
CREATE POLICY "DEV: Anon users can read resume_downloads (for admin)" ON public.resume_downloads FOR SELECT TO anon USING (true);
CREATE POLICY "DEV: Anon users can read visitor_logs (for admin)" ON public.visitor_logs FOR SELECT TO anon USING (true);
CREATE POLICY "Enable CRUD for users based on user_id" ON public.quick_notes FOR ALL USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Enable insert for authenticated users" ON public.social_media_clicks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Owner can manage hero_content" ON public.hero_content FOR ALL USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Owner can manage legal_documents" ON public.legal_documents FOR ALL USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Owner can read project_views" ON public.project_views FOR SELECT USING ((auth.role() = 'service_role'::text));
CREATE POLICY "Owner can manage projects" ON public.projects FOR ALL USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Owner can read resume_downloads" ON public.resume_downloads FOR SELECT USING ((auth.role() = 'service_role'::text));
CREATE POLICY "Owner can manage resume_education" ON public.resume_education FOR ALL USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Owner can manage resume_experience" ON public.resume_experience FOR ALL USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Owner can manage resume_key_skill_categories" ON public.resume_key_skill_categories FOR ALL USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Owner can manage resume_key_skills" ON public.resume_key_skills FOR ALL USING (( SELECT auth.uid() IN ( SELECT rksc.user_id
   FROM public.resume_key_skill_categories rksc
  WHERE (rksc.id = resume_key_skills.category_id)) )) WITH CHECK (( SELECT auth.uid() IN ( SELECT rksc.user_id
   FROM public.resume_key_skill_categories rksc
  WHERE (rksc.id = resume_key_skills.category_id)) ));
CREATE POLICY "Owner can manage resume_languages" ON public.resume_languages FOR ALL USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Owner can manage resume_meta" ON public.resume_meta FOR ALL USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Owner can manage site_settings" ON public.site_settings FOR ALL USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Owner can manage skill_categories" ON public.skill_categories FOR ALL USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Owner can read skill_interactions" ON public.skill_interactions FOR SELECT USING ((auth.role() = 'service_role'::text));
CREATE POLICY "Owner can manage skills" ON public.skills FOR ALL USING (( SELECT auth.uid() IN ( SELECT sc.user_id
   FROM public.skill_categories sc
  WHERE (sc.id = skills.category_id)) )) WITH CHECK (( SELECT auth.uid() IN ( SELECT sc.user_id
   FROM public.skill_categories sc
  WHERE (sc.id = skills.category_id)) ));
CREATE POLICY "Owner can manage social_links" ON public.social_links FOR ALL USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Owner can manage timeline_events" ON public.timeline_events FOR ALL USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Owner can read visitor_logs" ON public.visitor_logs FOR SELECT USING ((auth.role() = 'service_role'::text));
CREATE POLICY "Public can insert contact_submissions" ON public.contact_submissions FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "Public can insert project views" ON public.project_views FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "Public can insert resume_download records" ON public.resume_downloads FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "Public can insert skill_interactions" ON public.skill_interactions FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "Public can insert visitor_logs" ON public.visitor_logs FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "Public can read about_content" ON public.about_content FOR SELECT USING (true);
CREATE POLICY "Public can read admin_profile (for display)" ON public.admin_profile FOR SELECT USING (true);
CREATE POLICY "Public can read contact_page_details" ON public.contact_page_details FOR SELECT USING (true);
CREATE POLICY "Public can read hero_content" ON public.hero_content FOR SELECT USING (true);
CREATE POLICY "Public can read legal_documents" ON public.legal_documents FOR SELECT USING (true);
CREATE POLICY "Public can read resume_meta" ON public.resume_meta FOR SELECT USING (true);
CREATE POLICY "Public can read site_settings (for middleware)" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Public certifications are viewable by everyone" ON public.certifications FOR SELECT USING (true);
CREATE POLICY "Public projects are viewable by everyone" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Public resume_education is viewable by everyone" ON public.resume_education FOR SELECT USING (true);
CREATE POLICY "Public resume_experience is viewable by everyone" ON public.resume_experience FOR SELECT USING (true);
CREATE POLICY "Public resume_key_skill_categories is viewable by everyone" ON public.resume_key_skill_categories FOR SELECT USING (true);
CREATE POLICY "Public resume_key_skills is viewable by everyone" ON public.resume_key_skills FOR SELECT USING (true);
CREATE POLICY "Public resume_languages is viewable by everyone" ON public.resume_languages FOR SELECT USING (true);
CREATE POLICY "Public skill_categories are viewable by everyone" ON public.skill_categories FOR SELECT USING (true);
CREATE POLICY "Public skills are viewable by everyone" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Public social_links are viewable by everyone" ON public.social_links FOR SELECT USING (true);
CREATE POLICY "Public timeline_events are viewable by everyone" ON public.timeline_events FOR SELECT USING (true);
