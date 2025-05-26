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
  try {
    const { data, error } = await supabase
      .from('hero_content')
      .select('id, main_name, subtitles, social_media_links, updated_at')
      .eq('id', PRIMARY_HERO_CONTENT_ID)
      .maybeSingle();

    if (error || !data) return null;

    const mappedSocialLinks: HeroSocialLinkItem[] = Array.isArray(data.social_media_links)
      ? data.social_media_links.map((link: any) => ({
          id: link.id || crypto.randomUUID(),
          label: link.label || 'Social Link',
          url: link.url || '#',
          icon_image_url: link.icon_image_url || null,
        }))
      : [];

    return {
      id: data.id,
      main_name: data.main_name,
      subtitles: data.subtitles,
      social_media_links: mappedSocialLinks,
      updated_at: data.updated_at,
    } as HeroContent;
  } catch {
    return null;
  }
}

interface HomePageProps {
  params?: { [key: string]: string | string[] | undefined };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function HomePage(props: HomePageProps) {
  // const resolvedParams = props.params ? use(props.params) : {};
  // const resolvedSearchParams = props.searchParams ? use(props.searchParams) : {};

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
