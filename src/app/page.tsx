// src/app/page.tsx
import { use } from 'react';

import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import SkillsSection from '@/components/sections/SkillsSection';
import TimelineSection from '@/components/sections/TimelineSection';
import CertificationsSection from '@/components/sections/CertificationsSection';
import ResumeSection from '@/components/sections/ResumeSection';
import ContactSection from '@/components/sections/ContactSection';

import { supabase } from '@/lib/supabaseClient';
import type { HeroContent, StoredHeroSocialLink, HeroSocialLinkItem } from '@/types/supabase';

export const dynamic = "force-dynamic";

const PRIMARY_HERO_CONTENT_ID = '00000000-0000-0000-0000-000000000004';

async function getHeroContentData(): Promise<HeroContent | null> {
  console.log('[HomePage] Attempting to fetch hero content...');
  try {
    const { data, error, status } = await supabase
      .from('hero_content')
      .select('id, main_name, subtitles, social_media_links, updated_at')
      .eq('id', PRIMARY_HERO_CONTENT_ID)
      .maybeSingle();

    if (error) {
      console.error('[HomePage] Supabase error fetching hero_content:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        status: status,
      });
      return null;
    }

    if (!data) {
      console.warn(`[HomePage] No hero_content found for ID: ${PRIMARY_HERO_CONTENT_ID}`);
      return null;
    }

    console.log('[HomePage] Successfully fetched hero_content name:', data.main_name);
    console.log('[HomePage] Raw hero_content social_media_links from Supabase:', JSON.stringify(data.social_media_links));

    let mappedSocialLinks: HeroSocialLinkItem[] = [];
    if (data.social_media_links && Array.isArray(data.social_media_links)) {
      mappedSocialLinks = data.social_media_links.map((link: any, index: number): HeroSocialLinkItem => {
        console.log(`[HomePage] Mapping social link ${index} from DB:`, JSON.stringify(link));
        return {
          id: link.id || crypto.randomUUID(), // Use existing DB id if available, or generate client-side UUID
          label: link.label || 'Social Link',
          url: link.url || '#',
          icon_image_url: link.icon_image_url || null, // Use icon_image_url
        };
      });
    } else if (data.social_media_links) {
      console.warn("[HomePage] hero_content.social_media_links is not an array:", data.social_media_links);
    }
    console.log('[HomePage] Mapped social_media_links for HeroSection:', JSON.stringify(mappedSocialLinks));

    // Ensure the returned object matches HeroContent, especially social_media_links
    return {
      id: data.id,
      main_name: data.main_name,
      subtitles: data.subtitles,
      social_media_links: mappedSocialLinks, // Use the correctly typed and mapped array
      updated_at: data.updated_at,
    } as HeroContent; // Asserting as HeroContent which expects StoredHeroSocialLink[] after mapping if needed.
                     // For passing to client component, HeroSocialLinkItem[] is fine.

  } catch (e: any) {
    console.error('[HomePage] EXCEPTION fetching hero_content:', e.message, e);
    return null;
  }
}


export default async function HomePage() {
  console.log('[HomePage] Starting to render HomePage component...');
  const heroContent = await getHeroContentData();
  console.log('[HomePage] Rendering HomePage. Hero content fetched (main_name):', heroContent?.main_name);
  if (heroContent?.social_media_links) {
    console.log('[HomePage] Passing social_media_links to HeroSection:', JSON.stringify(heroContent.social_media_links));
  }

  return (
    <>
      <HeroSection heroContent={heroContent} />
      <AboutSection />
      <ProjectsSection />
      <SkillsSection />
      <TimelineSection />
      <CertificationsSection />
      <ResumeSection />
      <ContactSection />
    </>
  );
}