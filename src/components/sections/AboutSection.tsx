"use server"; // This component will now fetch data on the server.

import SectionWrapper from '@/components/ui/SectionWrapper';
import SectionTitle from '@/components/ui/SectionTitle';
import AboutSectionClientView from './AboutSectionClientView'; // New client component
import { supabase } from '@/lib/supabaseClient';
import type { AboutContent } from '@/types/supabase';

// This ID must match the one used in AdminDashboardPage.tsx and your database
const PRIMARY_ABOUT_CONTENT_ID = '00000000-0000-0000-0000-000000000001';

async function getAboutContent(): Promise<AboutContent | null> {
  const { data, error, status } = await supabase
    .from('about_content')
    .select('*')
    .eq('id', PRIMARY_ABOUT_CONTENT_ID)
    .maybeSingle(); // Changed to maybeSingle() for more graceful handling if no row is found

  if (error) {
    console.error('[AboutSection] Supabase error fetching about_content:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      status: status,
    });
    return null;
  }
  if (!data) {
    console.warn('No About Me content found for ID:', PRIMARY_ABOUT_CONTENT_ID);
    return null;
  }
  // Map Supabase row (snake_case) to AboutContent type (camelCase for imageUrl)
  return {
    id: data.id,
    headline_main: data.headline_main,
    headline_code_keyword: data.headline_code_keyword,
    headline_connector: data.headline_connector,
    headline_creativity_keyword: data.headline_creativity_keyword,
    paragraph1: data.paragraph1,
    paragraph2: data.paragraph2,
    paragraph3: data.paragraph3,
    imageUrl: data.image_url, // mapping
    image_tagline: data.image_tagline,
    updated_at: data.updated_at,
  };
}

export default async function AboutSection() {
  const aboutContent = await getAboutContent();

  // If aboutContent is null (no data from DB), pass an object with empty strings for headlines
  // and null for other fields.
  // Otherwise, use the fetched content, providing empty strings as fallbacks for individual null headline fields.
  const contentToDisplay: Omit<AboutContent, 'id' | 'updated_at'> = aboutContent
    ? {
        headline_main: aboutContent.headline_main || "",
        headline_code_keyword: aboutContent.headline_code_keyword || "",
        headline_connector: aboutContent.headline_connector || "",
        headline_creativity_keyword: aboutContent.headline_creativity_keyword || "",
        paragraph1: aboutContent.paragraph1 || null,
        paragraph2: aboutContent.paragraph2 || null,
        paragraph3: aboutContent.paragraph3 || null,
        imageUrl: aboutContent.imageUrl || null,
        image_tagline: aboutContent.image_tagline || null,
      }
    : { // This is the case when the database is empty or content not found
        headline_main: "",
        headline_code_keyword: "",
        headline_connector: "",
        headline_creativity_keyword: "",
        paragraph1: null,
        paragraph2: null,
        paragraph3: null,
        imageUrl: null,
        image_tagline: null,
      };


  return (
    <SectionWrapper id="about" className="section-fade-in bg-background overflow-hidden" style={{ animationDelay: '0.2s' }}>
      <SectionTitle subtitle="A little more about who I am and what I do.">
        About Me
      </SectionTitle>
      <AboutSectionClientView content={contentToDisplay} />
    </SectionWrapper>
  );
}
