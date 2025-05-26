// src/data/portfolioData.ts
// This file is now primarily for public navigation links.
// Dynamic data is fetched from Supabase.

import type { LucideIcon } from 'lucide-react';
import { Home, User, Briefcase, Wrench, MapPin as JourneyIcon, Award, FileText as ResumeIcon, Mail as ContactIcon } from 'lucide-react';

// Navigational items for the public-facing header
export const publicNavItems = [
  { href: '#hero', label: 'Home', icon: Home },
  { href: '#about', label: 'About', icon: User },
  { href: '#projects', label: 'Projects', icon: Briefcase },
  { href: '#skills', label: 'Skills', icon: Wrench },
  { href: '#timeline', label: 'Journey', icon: JourneyIcon },
  { href: '#certifications', label: 'Certifications', icon: Award },
  { href: '#resume', label: 'Resume', icon: ResumeIcon },
  { href: '#contact', label: 'Contact', icon: ContactIcon },
];

// IconMap and related LucideIcon imports for IconMap are no longer needed
// as TimelineItem.tsx uses icon_image_url.
// Individual skill icons in SkillCard.tsx and CategoryCard.tsx also use image URLs or fallback SVGs.

// The types previously here (ProjectStatus, Project, SkillCategory, Skill, TimelineEvent, Certification)
// are now superseded by those defined in src/types/supabase.ts
