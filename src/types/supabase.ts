
// Based on your Supabase table structure
// This file helps provide TypeScript types for your Supabase data.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Interface for the structure stored in the JSONB column for Hero social links
export interface StoredHeroSocialLink {
  label: string;
  url: string;
  icon_image_url: string | null;
}

// Interface for Hero social links when managed in client-side state (includes temporary id)
export interface HeroSocialLinkItem extends StoredHeroSocialLink {
  id: string; // Client-side temporary ID for list management
  iconImageUrl?: string | null; // Mapped from icon_image_url
}

export interface AdminProfile {
  id: string;
  profile_photo_url: string | null;
  updated_at: string;
}

export interface SiteSettings {
  id: string; // 'global_settings'
  is_maintenance_mode_enabled: boolean;
  maintenance_message: string | null;
  is_analytics_tracking_enabled: boolean;
  updated_at: string;
}

export interface AdminActivityLog {
  id: string;
  timestamp: string;
  user_identifier: string | null;
  action_type: string;
  description: string;
  details: Json | null;
  is_read: boolean;
}

export interface LegalDocument {
  id: string;
  title: string;
  content: string | null;
  updated_at: string | null; // Made nullable to handle cases where it might be missing
}

export interface ProjectView {
    id: string;
    project_id: string | null;
    viewed_at: string;
    viewer_identifier: string | null;
}

export interface SkillInteraction {
  id: string;
  skill_id: string | null;
  interaction_type: string | null;
  interacted_at: string;
  viewer_identifier: string | null;
}

export interface ResumeDownload {
  id: string;
  downloaded_at: string;
  downloader_identifier: string | null;
}

export interface VisitorLog {
  id?: string;
  visited_at?: string;
  device_type: 'Mobile' | 'Tablet' | 'Desktop' | 'Unknown';
  path_visited?: string | null;
  user_agent_string?: string | null;
  viewer_identifier?: string | null;
}


export interface Database {
  public: {
    Tables: {
      admin_profile: {
        Row: AdminProfile
        Insert: Omit<AdminProfile, 'updated_at'> & { updated_at?: string; }
        Update: Partial<AdminProfile>
      }
      site_settings: {
        Row: SiteSettings
        Insert: Omit<SiteSettings, 'updated_at'> & { updated_at?: string; }
        Update: Partial<SiteSettings>
      }
      admin_activity_log: {
        Row: AdminActivityLog
        Insert: Omit<AdminActivityLog, 'id' | 'timestamp' | 'is_read'> & { id?: string; timestamp?: string; is_read?: boolean; }
        Update: Partial<AdminActivityLog>
      }
      legal_documents: {
        Row: LegalDocument
        Insert: Omit<LegalDocument, 'updated_at'> & { updated_at?: string; }
        Update: Partial<LegalDocument>
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string | null
          live_demo_url: string | null
          repo_url: string | null
          tags: string[] | null
          status: string | null
          progress: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at'> & { id?: string, created_at?: string }
        Update: Partial<Database['public']['Tables']['projects']['Row']>
      }
      project_views: {
        Row: ProjectView
        Insert: Omit<ProjectView, 'id' | 'viewed_at'> & { id?: string; viewed_at?: string;}
        Update: Partial<ProjectView>
      }
      skill_interactions: { 
        Row: SkillInteraction
        Insert: Omit<SkillInteraction, 'id' | 'interacted_at'> & { id?: string; interacted_at?: string;}
        Update: Partial<SkillInteraction>
      }
      resume_downloads: {
        Row: ResumeDownload
        Insert: Omit<ResumeDownload, 'id' | 'downloaded_at'> & { id?: string; downloaded_at?: string;}
        Update: Partial<ResumeDownload>
      }
      visitor_logs: { // New table definition
        Row: VisitorLog
        Insert: Omit<VisitorLog, 'id' | 'visited_at'> & { id?: string; visited_at?: string;}
        Update: Partial<VisitorLog>
      }
      skill_categories: {
        Row: {
          id: string
          name: string
          icon_image_url: string | null
          sort_order: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['skill_categories']['Row'], 'id' | 'created_at'> & { id?: string, created_at?: string }
        Update: Partial<Database['public']['Tables']['skill_categories']['Row']>
      }
      skills: {
        Row: {
          id: string
          name: string
          icon_image_url: string | null
          description: string | null
          category_id: string | null
          created_at: string;
        }
        Insert: Omit<Database['public']['Tables']['skills']['Row'], 'id' | 'created_at'> & { id?: string, created_at?: string }
        Update: Partial<Database['public']['Tables']['skills']['Row']>
      }
      certifications: {
        Row: {
          id: string
          title: string
          issuer: string
          date: string
          image_url: string | null
          verify_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['certifications']['Row'], 'id' | 'created_at'> & { id?: string, created_at?: string }
        Update: Partial<Database['public']['Tables']['certifications']['Row']>
      }
      timeline_events: {
        Row: {
          id: string
          date: string
          title: string
          description: string
          icon_image_url: string | null
          type: string
          sort_order: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['timeline_events']['Row'], 'id' | 'created_at'> & { id?: string, created_at?: string }
        Update: Partial<Database['public']['Tables']['timeline_events']['Row']>
      }
      about_content: {
        Row: {
          id: string
          headline_main: string | null
          headline_code_keyword: string | null
          headline_connector: string | null
          headline_creativity_keyword: string | null
          paragraph1: string | null
          paragraph2: string | null
          paragraph3: string | null
          image_url: string | null
          image_tagline: string | null
          updated_at: string
        }
        Insert: Omit<AboutContent, 'id' | 'updated_at'> & { id: string; updated_at?: string; }
        Update: Partial<Omit<AboutContent, 'id' | 'updated_at'>> & { updated_at?: string; }
      }
      resume_meta: {
        Row: ResumeMeta
        Insert: Omit<ResumeMeta, 'id' | 'updated_at'> & { id: string; updated_at?: string; }
        Update: Partial<Omit<ResumeMeta, 'id' | 'updated_at'>> & { updated_at?: string; }
      }
      resume_experience: {
        Row: ResumeExperience
        Insert: Omit<ResumeExperience, 'id' | 'created_at'> & { id?: string; created_at?: string; }
        Update: Partial<Omit<ResumeExperience, 'id' | 'created_at'>>
      }
      resume_education: {
        Row: ResumeEducation
        Insert: Omit<ResumeEducation, 'id' | 'created_at'> & { id?: string; created_at?: string; }
        Update: Partial<Omit<ResumeEducation, 'id' | 'created_at'>>
      }
      resume_key_skill_categories: {
        Row: ResumeKeySkillCategory
        Insert: Omit<ResumeKeySkillCategory, 'id' | 'created_at'> & { id?: string; created_at?: string; }
        Update: Partial<Omit<ResumeKeySkillCategory, 'id' | 'created_at'>>
      }
      resume_key_skills: {
        Row: ResumeKeySkill
        Insert: Omit<ResumeKeySkill, 'id'> & { id?: string; }
        Update: Partial<Omit<ResumeKeySkill, 'id'>>
      }
      resume_languages: {
        Row: ResumeLanguage
        Insert: Omit<ResumeLanguage, 'id' | 'created_at'> & { id?: string; created_at?: string; }
        Update: Partial<Omit<ResumeLanguage, 'id' | 'created_at'>>
      }
      hero_content: {
        Row: HeroContent;
        Insert: Omit<HeroContent, 'id' | 'updated_at'> & { id: string; updated_at?: string; };
        Update: Partial<Omit<HeroContent, 'id' | 'updated_at'>> & { updated_at?: string; };
      }
      contact_page_details: {
        Row: ContactPageDetail;
        Insert: Omit<ContactPageDetail, 'id' | 'updated_at'> & { id: string; updated_at?: string; };
        Update: Partial<Omit<ContactPageDetail, 'id' | 'updated_at'>> & { updated_at?: string; };
      }
      social_links: {
        Row: SocialLink;
        Insert: Omit<SocialLink, 'id' | 'created_at'> & { id?: string; created_at?: string; icon_image_url?: string | null };
        Update: Partial<Omit<SocialLink, 'id' | 'created_at'>>;
      }
      contact_submissions: {
        Row: ContactSubmission;
        Insert: Omit<ContactSubmission, 'id' | 'submitted_at' | 'status' | 'is_starred'> & { id?: string; submitted_at?: string; status?: SubmissionStatus | null; is_starred?: boolean | null; };
        Update: Partial<Omit<ContactSubmission, 'id'| 'submitted_at'>>;
      }
      site_settings: {
        Row: SiteSettings
        Insert: Omit<SiteSettings, 'updated_at'> & { updated_at?: string; is_analytics_tracking_enabled?: boolean; }
        Update: Partial<SiteSettings> & { is_analytics_tracking_enabled?: boolean; }
      }
    } // End Tables
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type ProjectStatus = 'Deployed' | 'In Progress' | 'Prototype' | 'Archived' | 'Concept' | 'Completed';

export interface Project {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  liveDemoUrl?: string | null;
  repoUrl?: string | null;
  tags: string[] | null;
  status: ProjectStatus | null;
  progress?: number | null;
  created_at: string;
  image_url?: string | null;
  live_demo_url?: string | null;
  repo_url?: string | null;
}

export interface Skill {
  id: string;
  name: string;
  iconImageUrl: string | null;
  description: string | null;
  categoryId?: string | null;
  created_at?: string;
  icon_image_url?: string | null;
  category_id?: string | null;
}

export interface SkillCategory {
  id: string;
  name: string;
  iconImageUrl?: string | null;
  skills?: Skill[];
  sort_order?: number | null;
  created_at?: string;
  icon_image_url?: string | null; // Ensure this exists if used by SkillCategory type directly
  resume_key_skills?: ResumeKeySkill[]; // For resume key skill categories if structure is different
}

export type TimelineEventType = 'work' | 'education' | 'certification' | 'milestone';

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  iconImageUrl: string | null;
  type: TimelineEventType;
  sort_order?: number | null;
  created_at?: string;
  icon_image_url?: string | null;
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  date: string;
  imageUrl: string | null;
  imageHint?: string | null; // Was removed from table, ensure type matches usage
  verifyUrl?: string | null;
  created_at?: string;
  image_url?: string | null;
  verify_url?: string | null;
}

export interface AboutContent {
  id: string;
  headline_main: string | null;
  headline_code_keyword: string | null;
  headline_connector: string | null;
  headline_creativity_keyword: string | null;
  paragraph1: string | null;
  paragraph2: string | null;
  paragraph3: string | null;
  imageUrl: string | null;
  image_tagline: string | null;
  updated_at?: string;
  image_url?: string | null;
}

export interface ResumeMeta {
  id: string;
  description: string | null;
  resume_pdf_url: string | null;
  updated_at: string;
}

export interface ResumeExperience {
  id: string;
  job_title: string;
  company_name: string;
  date_range: string | null;
  description_points: string[] | null;
  icon_image_url: string | null;
  sort_order?: number | null;
  created_at: string;
}

export interface ResumeEducation {
  id: string;
  degree_or_certification: string;
  institution_name: string;
  date_range: string | null;
  description: string | null;
  icon_image_url: string | null;
  sort_order?: number | null;
  created_at: string;
}

export interface ResumeKeySkill {
  id: string;
  skill_name: string;
  category_id?: string | null;
  // created_at was removed from individual skills
}

export interface ResumeKeySkillCategory {
  id: string;
  category_name: string;
  icon_image_url: string | null;
  skills?: ResumeKeySkill[];
  sort_order?: number | null;
  created_at: string;
  resume_key_skills?: ResumeKeySkill[]; // For Supabase relations
}

export interface ResumeLanguage {
  id: string;
  language_name: string;
  proficiency: string | null;
  icon_image_url: string | null;
  sort_order?: number | null;
  created_at: string;
}

export interface HeroContent {
  id: string;
  main_name: string | null;
  subtitles: string[] | null;
  social_media_links: StoredHeroSocialLink[] | null;
  updated_at: string;
}

export interface ContactPageDetail {
  id: string;
  address: string | null;
  phone: string | null;
  phone_href: string | null;
  email: string | null;
  email_href: string | null;
  updated_at: string;
}

export interface SocialLink {
  id: string;
  label: string;
  icon_image_url: string | null;
  url: string;
  display_text: string | null;
  sort_order?: number | null;
  created_at: string;
}

export type SubmissionStatus = 'New' | 'Replied' | 'Archived';

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  phone_number: string | null;
  status: SubmissionStatus | null;
  is_starred: boolean | null;
  submitted_at: string;
  notes?: string | null;
}

// Supabase Auth User type (simplified)
export type User = {
  id: string;
  email?: string;
  // Add other user properties from Supabase Auth if needed
};
