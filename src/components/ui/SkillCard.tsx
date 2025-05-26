// src/components/ui/SkillCard.tsx
"use client";

import NextImage from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import type { Skill } from '@/types/supabase';
import { cn } from '@/lib/utils';
import React, { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Default inline SVG placeholder for skills if no iconImageUrl is provided
const DefaultSkillSvgFallback = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
  </svg>
);

interface SkillCardProps {
  skill: Skill;
}

export default function SkillCard({ skill }: SkillCardProps) {
  useEffect(() => {
    if (skill && skill.id) {
      const logSkillInteraction = async () => {
        const { error } = await supabase
          .from('skill_interactions')
          .insert({ 
            skill_id: skill.id,
            interaction_type: 'view'
          });
        if (error) {
          console.warn(`[SkillCard] Failed to log interaction for skill ${skill.name} (ID: ${skill.id}):`, error.message);
        }
      };
      logSkillInteraction();
    }
  }, [skill]);

  const hasValidIconUrl = skill.iconImageUrl && typeof skill.iconImageUrl === 'string' && skill.iconImageUrl.trim() !== '';

  return (
    <Card className={cn(
      "text-center p-4 hover:shadow-xl transition-all duration-300 h-full flex flex-col items-center group transform hover:scale-105",
      "bg-card/80 backdrop-blur-md" 
    )}>
      <CardContent className="flex flex-col items-center justify-start gap-3 pt-4 sm:pt-5 md:pt-6 flex-grow w-full">
        {hasValidIconUrl ? (
          <div className="relative h-10 w-10 sm:h-12 sm:w-12 mb-1 rounded-md overflow-hidden">
            <NextImage
              src={skill.iconImageUrl!} // Asserting non-null because of hasValidIconUrl check
              alt={`${skill.name || 'Skill'} icon`}
              fill
              className="object-contain transition-transform group-hover:scale-110"
            />
          </div>
        ) : (
          <DefaultSkillSvgFallback className="h-8 w-8 sm:h-10 sm:w-10 text-primary mb-1 transition-transform group-hover:scale-110" />
        )}
        <p className="text-sm sm:text-base font-semibold text-foreground">{skill.name}</p>
        {skill.description && (
          <p className="text-xs text-muted-foreground mt-2 text-center px-1 sm:px-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out h-auto max-h-0 group-hover:max-h-40 overflow-hidden">
            {skill.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
