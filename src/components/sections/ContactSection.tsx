
"use server";

import SectionWrapper from '@/components/ui/SectionWrapper';
import SectionTitle from '@/components/ui/SectionTitle';
import ContactSectionClientView from './ContactSectionClientView';
import { supabase } from '@/lib/supabaseClient';
import type { ContactPageDetail, SocialLink } from '@/types/supabase';

// Fixed ID for the single contact_page_details entry
const PRIMARY_CONTACT_DETAILS_ID = '00000000-0000-0000-0000-000000000005';

async function getContactPageDetails(): Promise<ContactPageDetail | null> {
  console.log('[ContactSection] Attempting to fetch contact page details...');
  const { data, error, statusText } = await supabase
    .from('contact_page_details')
    .select('*')
    .eq('id', PRIMARY_CONTACT_DETAILS_ID)
    .maybeSingle();

  if (error) {
    console.error('[ContactSection] Supabase error fetching contact_page_details:', { message: error.message, details: error.details, hint: error.hint, code: error.code, status: statusText });
    return null;
  }
  console.log('[ContactSection] Fetched contact_page_details:', data ? data.address : 'No data');
  return data;
}

async function getSocialLinks(): Promise<SocialLink[]> {
  console.log('[ContactSection] Attempting to fetch social links...');
  const { data, error, statusText } = await supabase
    .from('social_links')
    .select('id, label, icon_image_url, url, display_text, sort_order, created_at')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[ContactSection] Supabase error fetching social_links:', { message: error.message, details: error.details, hint: error.hint, code: error.code, status: statusText });
    return [];
  }
  console.log('[ContactSection] Fetched social_links count:', data?.length || 0);
  return (data || []).map(link => ({ ...link, icon_image_url: link.icon_image_url || null }));
}

export default async function ContactSection() {
  const [contactDetails, socialLinks] = await Promise.all([
    getContactPageDetails(),
    getSocialLinks()
  ]);

  console.log('[ContactSection] Rendering with contactDetails address:', contactDetails?.address, 'and socialLinks count:', socialLinks.length);

  return (
    <SectionWrapper id="contact" className="bg-background section-fade-in" style={{ animationDelay: '1.4s' }}>
      <SectionTitle subtitle="Have a project in mind, a question, or just want to say hi? Feel free to reach out. I'm always open to discussing new opportunities.">
        Get In Touch
      </SectionTitle>
      <ContactSectionClientView contactDetails={contactDetails} socialLinks={socialLinks} />
    </SectionWrapper>
  );
}
