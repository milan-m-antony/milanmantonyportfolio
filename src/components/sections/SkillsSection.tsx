
"use server"; // Make this a Server Component

import { supabase } from '@/lib/supabaseClient';
import SectionWrapper from '@/components/ui/SectionWrapper';
import type { SkillCategory, Skill } from '@/types/supabase';
// Client component for interactive parts (search, category selection)
import SkillsClientView from './SkillsClientView';

async function getSkillsData(): Promise<SkillCategory[]> {
  const { data: categoriesData, error: categoriesError, status, statusText } = await supabase
    .from('skill_categories')
    .select(`
      id,
      name,
      icon_image_url, 
      sort_order,
      skills (id, name, icon_image_url, description, category_id)
    `)
    .order('sort_order', { ascending: true })
    .order('created_at', { foreignTable: 'skills', ascending: true }); // Order skills within categories

  if (categoriesError) {
    let errorMessage = 'Error fetching skill categories. ';
    if (typeof categoriesError === 'object' && categoriesError !== null) {
      const supabaseError = categoriesError as { message?: string; details?: string; hint?: string; code?: string };
      errorMessage += `Message: ${supabaseError.message || 'N/A'}, Details: ${supabaseError.details || 'N/A'}, Hint: ${supabaseError.hint || 'N/A'}, Code: ${supabaseError.code || 'N/A'}. `;
    } else {
      try {
        errorMessage += `Received error: ${JSON.stringify(categoriesError)}. `;
      } catch (e) {
        errorMessage += `Received non-serializable error. `;
      }
    }
    errorMessage += `Status: ${status || 'N/A'} ${statusText || 'N/A'}.`;
    console.error(errorMessage);
    return [];
  }

  if (!categoriesData) {
    console.warn('No data returned for skill categories, and no explicit Supabase error. This might be an RLS issue, an empty table, or incorrect table name. Status:', status, statusText);
    return [];
  }
   if (!Array.isArray(categoriesData)) {
    console.error('Skill categories data from Supabase is not an array. Received:', categoriesData);
    return [];
  }


  return categoriesData.map(category => {
    if (!category.id || !category.name) {
        console.warn('Skipping skill category due to missing required fields:', category);
        return null;
    }
    const validSkills = category.skills ? category.skills.filter(skill => {
        if (!skill.id || !skill.name) {
            console.warn('Skipping skill within category due to missing required fields:', skill, 'in category', category.name);
            return false;
        }
        return true;
    }).map(skill => ({
      ...skill,
      iconImageUrl: skill.icon_image_url, // Map to camelCase
      categoryId: skill.category_id
    })) : [];

    return {
      id: category.id,
      name: category.name,
      iconImageUrl: category.icon_image_url, // Map to camelCase
      sort_order: category.sort_order,
      skills: validSkills
    };
  }).filter(category => category !== null) as SkillCategory[];
}


export default async function SkillsSection() {
  const skillsData = await getSkillsData();

  return (
    <SectionWrapper id="skills" className="section-fade-in" style={{ animationDelay: '0.6s' }}>
      <SkillsClientView initialSkillsData={skillsData} />
    </SectionWrapper>
  );
}

