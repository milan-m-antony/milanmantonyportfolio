"use server";

import React from 'react';
import SectionWrapper from '@/components/ui/SectionWrapper';
import SectionTitle from '@/components/ui/SectionTitle';
import ResumeSectionClientView from './ResumeSectionClientView';
import { supabase } from '@/lib/supabaseClient';
import type {
  ResumeExperience,
  ResumeEducation,
  ResumeKeySkillCategory,
  ResumeLanguage,
  ResumeMeta
} from '@/types/supabase';

// Fixed ID for the resume_meta table, ensure this matches the ID used in ResumeManager.tsx
const PRIMARY_RESUME_META_ID = '00000000-0000-0000-0000-000000000003';

async function getResumeData() {
  console.log('[ResumeSection] Attempting to fetch all resume data...');

  let resumeMetaData: ResumeMeta | null = null;
  try {
    const { data, error } = await supabase
      .from('resume_meta')
      .select('*')
      .eq('id', PRIMARY_RESUME_META_ID)
      .maybeSingle();
    if (error) throw error;
    resumeMetaData = data;
    console.log('[ResumeSection] Fetched resumeMetaData:', resumeMetaData ? `ID: ${resumeMetaData.id}, Desc: ${resumeMetaData.description?.substring(0,20)}...` : 'No data');
  } catch (error) {
    console.error('[ResumeSection] Error fetching resume_meta:', error);
  }

  let experienceData: ResumeExperience[] = [];
  try {
    const { data, error } = await supabase
      .from('resume_experience')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    experienceData = data || [];
    console.log('[ResumeSection] Fetched experienceData count:', experienceData.length);
  } catch (error) {
    console.error('[ResumeSection] Error fetching resume_experience:', error);
  }

  let educationData: ResumeEducation[] = [];
  try {
    const { data, error } = await supabase
      .from('resume_education')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    educationData = data || [];
    console.log('[ResumeSection] Fetched educationData count:', educationData.length);
  } catch (error) {
    console.error('[ResumeSection] Error fetching resume_education:', error);
  }
  
  let keySkillsData: ResumeKeySkillCategory[] = [];
  try {
    const { data, error } = await supabase
      .from('resume_key_skill_categories')
      .select('*, resume_key_skills(*)')
      .order('sort_order', { ascending: true })
      .order('skill_name', { foreignTable: 'resume_key_skills', ascending: true });
    if (error) throw error;
    keySkillsData = (data || []).map(category => ({
      ...category,
      skills: category.resume_key_skills || []
    }));
    console.log('[ResumeSection] Fetched keySkillsData count:', keySkillsData.length);
  } catch (error) {
    console.error('[ResumeSection] Error fetching resume_key_skill_categories:', error);
  }

  let languagesData: ResumeLanguage[] = [];
  try {
    const { data, error } = await supabase
      .from('resume_languages')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    languagesData = data || [];
    console.log('[ResumeSection] Fetched languagesData count:', languagesData.length);
  } catch (error) {
    console.error('[ResumeSection] Error fetching resume_languages:', error);
  }

  console.log('[ResumeSection] Finished fetching all resume data.');
  return {
    resumeMetaData,
    experienceData,
    educationData,
    keySkillsData,
    languagesData,
  };
}

export default async function ResumeSection() {
  console.log('[ResumeSection] SERVER COMPONENT RENDERING');
  const { 
    resumeMetaData, 
    experienceData, 
    educationData, 
    keySkillsData, 
    languagesData 
  } = await getResumeData();

  const sectionSubtitle = resumeMetaData?.description || "A comprehensive overview of my qualifications, experience, and skills.";

  return (
    <SectionWrapper id="resume" aria-labelledby="resume-title" className="section-fade-in scroll-mt-16">
      <SectionTitle id="resume-title" subtitle={sectionSubtitle}>
        My Resume / CV
      </SectionTitle>
      <ResumeSectionClientView 
        resumeMetaData={resumeMetaData}
        experienceData={experienceData}
        educationData={educationData}
        keySkillsData={keySkillsData}
        languagesData={languagesData}
      />
    </SectionWrapper>
  );
}
