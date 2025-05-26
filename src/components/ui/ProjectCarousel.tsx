
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import ProjectCard from '@/components/ui/ProjectCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Project } from '@/types/supabase';

const AUTO_SLIDE_INTERVAL = 5000; // 5 seconds

interface ProjectCarouselProps {
  projects: Project[];
}

const getResponsiveVisibleCardsCount = () => {
  if (typeof window === 'undefined') return 1;
  if (window.innerWidth >= 1024) return 3; // lg and up: 3 cards
  if (window.innerWidth >= 768) return 2;  // md: 2 cards
  return 1; // sm and down: 1 card
};

export default function ProjectCarousel({ projects }: ProjectCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [visibleCardsCountOnClient, setVisibleCardsCountOnClient] = useState<number>(1);

  const totalProjects = projects.length;

  useEffect(() => {
    const calculateAndSetVisibleCards = () => {
      const count = getResponsiveVisibleCardsCount();
      setVisibleCardsCountOnClient(count);
    };

    calculateAndSetVisibleCards();
    window.addEventListener('resize', calculateAndSetVisibleCards);
    return () => window.removeEventListener('resize', calculateAndSetVisibleCards);
  }, []);

  const currentVisibleCards = visibleCardsCountOnClient;

  useEffect(() => {
    if (totalProjects > 0 && currentVisibleCards > 0) {
      const maxPossibleIndex = Math.max(0, totalProjects - currentVisibleCards);
      if (currentIndex > maxPossibleIndex) {
        setCurrentIndex(maxPossibleIndex);
      } else if (currentIndex < 0) {
        setCurrentIndex(0);
      }
    }
  }, [currentVisibleCards, totalProjects, currentIndex]);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (totalProjects <= currentVisibleCards) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % (totalProjects - currentVisibleCards + 1));
  }, [totalProjects, currentVisibleCards]);

  useEffect(() => {
    resetTimeout();
    if (!isPaused && totalProjects > currentVisibleCards) {
      timeoutRef.current = setTimeout(handleNext, AUTO_SLIDE_INTERVAL);
    }
    return () => resetTimeout();
  }, [currentIndex, isPaused, totalProjects, currentVisibleCards, resetTimeout, handleNext]);

  const handlePrev = () => {
    if (totalProjects <= currentVisibleCards) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + (totalProjects - currentVisibleCards + 1)) % (totalProjects - currentVisibleCards + 1));
  };

  if (!projects || totalProjects === 0) {
    return <p className="text-center text-muted-foreground">Loading projects or no projects available...</p>;
  }

  const cardWidthPercentage = 100 / currentVisibleCards;

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="overflow-hidden rounded-lg">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * cardWidthPercentage}%)` }}
          role="list"
        >
          {projects.map((project: Project) => (
            <div
              key={project.id}
              className="flex-shrink-0 p-1 md:p-2 box-border"
              style={{ width: `${cardWidthPercentage}%` }}
              role="listitem"
            >
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      </div>

      {totalProjects > currentVisibleCards && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 ml-1 sm:ml-2 md:ml-4 opacity-70 group-hover:opacity-100 transition-opacity bg-background/50 hover:bg-background/80 focus:opacity-100"
            onClick={handlePrev}
            aria-label="Previous project"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 mr-1 sm:mr-2 md:mr-4 opacity-70 group-hover:opacity-100 transition-opacity bg-background/50 hover:bg-background/80 focus:opacity-100"
            onClick={handleNext}
            aria-label="Next project"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}
    </div>
  );
}
