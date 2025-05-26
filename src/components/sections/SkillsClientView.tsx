
"use client";

import { useState, useMemo, useEffect } from 'react';
import SectionTitle from '@/components/ui/SectionTitle';
import SkillCard from '@/components/ui/SkillCard';
import CategoryCard from '@/components/ui/CategoryCard'; // CategoryCard will now show uploaded images
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X as ClearIcon, ArrowLeft } from 'lucide-react';
import type { SkillCategory, Skill } from '@/types/supabase';

interface SkillsClientViewProps {
  initialSkillsData: SkillCategory[];
}

export default function SkillsClientView({ initialSkillsData }: SkillsClientViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [selectedCategory, searchTerm]);

  const handleCategorySelect = (category: SkillCategory) => {
    setSelectedCategory(category);
    setSearchTerm('');
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSearchTerm('');
  };

  const isGlobalSearchActive = searchTerm !== '' && selectedCategory === null;
  const isCategorySearchActive = searchTerm !== '' && selectedCategory !== null;
  const isCategorySelectedView = selectedCategory !== null && searchTerm === '';
  const isCategoriesOverviewView = !selectedCategory && searchTerm === '';

  const categoriesToDisplay = useMemo(() => {
    if (!isCategoriesOverviewView) return [];
    // For category overview, we now directly pass iconImageUrl to CategoryCard
    return initialSkillsData.map(cat => ({
        ...cat,
        iconImageUrl: cat.iconImageUrl // Ensure this prop is passed
    }));
  }, [isCategoriesOverviewView, initialSkillsData]);

  const skillsToDisplay = useMemo(() => {
    if (isCategoriesOverviewView) return [];

    const lowerSearchTerm = searchTerm.toLowerCase();

    if (isGlobalSearchActive) {
      const allMatchingSkills: Skill[] = [];
      initialSkillsData.forEach(category => {
        category.skills?.forEach(skill => {
          if (skill.name.toLowerCase().includes(lowerSearchTerm) || category.name.toLowerCase().includes(lowerSearchTerm)) {
            if (!allMatchingSkills.find(s => s.id === skill.id)) {
                 allMatchingSkills.push({ ...skill, categoryId: category.id, iconImageUrl: skill.iconImageUrl }); // Pass iconImageUrl
            }
          }
        });
      });
      return allMatchingSkills;
    }
    
    if (isCategorySelectedView && selectedCategory) { 
      return selectedCategory.skills?.map(s => ({ ...s, categoryId: selectedCategory.id, iconImageUrl: s.iconImageUrl })) || []; // Pass iconImageUrl
    }

    if (isCategorySearchActive && selectedCategory) {
      return selectedCategory.skills?.filter(skill => 
        skill.name.toLowerCase().includes(lowerSearchTerm)
      ).map(s => ({ ...s, categoryId: selectedCategory.id, iconImageUrl: s.iconImageUrl })) || []; // Pass iconImageUrl
    }

    return [];
  }, [isCategoriesOverviewView, isGlobalSearchActive, isCategorySelectedView, isCategorySearchActive, searchTerm, selectedCategory, initialSkillsData]);

  let currentTitle = "My Skills & Technologies";
  let currentSubtitle = "A diverse range of technical and soft skills I've honed through experience and continuous learning.";
  
  if (isGlobalSearchActive) {
    currentTitle = `Search Results for "${searchTerm}"`;
    currentSubtitle = `Found ${skillsToDisplay.length} skill(s) across all categories.`;
  } else if (selectedCategory) {
    currentTitle = selectedCategory.name;
    currentSubtitle = `Exploring skills in ${selectedCategory.name}${isCategorySearchActive ? ` (filtered by "${searchTerm}")` : ''}.`;
    if (isCategorySearchActive) {
      currentSubtitle = `Found ${skillsToDisplay.length} skill(s) in ${selectedCategory.name} matching "${searchTerm}".`;
    }
  }

  const searchInputPlaceholder = selectedCategory 
    ? `Search skills in ${selectedCategory.name}...` 
    : "Search skills or categories...";

  return (
    <>
      <SectionTitle subtitle={currentSubtitle}>
        {currentTitle}
      </SectionTitle>

      <div className="mb-8 max-w-lg mx-auto flex gap-2 items-center">
        {selectedCategory && ( 
          <Button variant="outline" size="icon" onClick={handleBackToCategories} aria-label="Back to categories" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={searchInputPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label="Search skills"
          />
        </div>
        {searchTerm && (
          <Button variant="ghost" size="icon" onClick={() => setSearchTerm('')} aria-label="Clear search">
            <ClearIcon className="h-5 w-5" />
          </Button>
        )}
      </div>

      {isCategoriesOverviewView ? (
        <div key={`categories-${animationKey}`}>
          {categoriesToDisplay.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categoriesToDisplay.map((category, index) => (
                <div key={category.id} className="animate-fadeIn" style={{animationDelay: `${index * 0.1}s`}}>
                  <CategoryCard // CategoryCard now expects iconImageUrl
                    name={category.name}
                    iconImageUrl={category.iconImageUrl || null} // Pass the image URL
                    skillCount={category.skills?.length || 0}
                    onClick={() => handleCategorySelect(category)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No skill categories available.</p>
          )}
        </div>
      ) : (
        <div key={`skills-${selectedCategory?.id || 'search_results'}-${animationKey}`}>
            {skillsToDisplay.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {skillsToDisplay.map((skill, index) => (
                <div key={skill.id} className="animate-fadeIn" style={{animationDelay: `${index * 0.05}s`}}>
                  <SkillCard skill={skill} /> {/* SkillCard now expects iconImageUrl in skill object */}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              {isGlobalSearchActive 
                ? `No skills found matching "${searchTerm}". Try a broader search.` 
                : (isCategorySearchActive && selectedCategory ? `No skills in ${selectedCategory.name} matching "${searchTerm}".` 
                : (selectedCategory ? `No skills listed in ${selectedCategory.name}.` : 'No skills to display.'))}
            </p>
          )}
        </div>
      )}
    </>
  );
}
