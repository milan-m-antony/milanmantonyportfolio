// src/components/ui/TimelineItem.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TimelineEvent as SupabaseTimelineEvent } from '@/types/supabase';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import NextImage from 'next/image';
import React from 'react';

// Default inline SVG placeholder for timeline items if no iconImageUrl is provided
const DefaultTimelineSvgFallback = (props: React.SVGProps<SVGSVGElement>) => (
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
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

interface TimelineItemProps {
  event: SupabaseTimelineEvent;
  isLeft: boolean;
}

export default function TimelineItem({ event, isLeft }: TimelineItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
      }
    );

    const currentRef = itemRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);
  
  const hasValidIconUrl = event.iconImageUrl && typeof event.iconImageUrl === 'string' && event.iconImageUrl.trim() !== '';

  return (
    <div
      ref={itemRef}
      className={cn(
        "mb-8 flex justify-between items-center w-full transition-all duration-700 ease-out",
        isLeft ? "flex-row-reverse left-timeline" : "right-timeline",
        isVisible ? 'opacity-100 translate-y-0 sm:translate-x-0' : 'opacity-0 translate-y-10 sm:translate-y-0 sm:translate-x-10'
      )}
    >
      <div className="order-1 w-5/12"></div> {/* Spacer */}
      <div className={cn(
        "z-20 flex items-center justify-center order-1 shadow-xl w-14 h-14 rounded-full",
        "bg-muted border border-border text-primary" 
      )}>
         {hasValidIconUrl ? (
            <div className="relative w-full h-full rounded-full overflow-hidden"> {/* Added overflow-hidden for the wrapper */}
              <NextImage
                src={event.iconImageUrl!} // Asserting non-null
                alt={`${event.title || 'Event'} icon`}
                width={32} 
                height={32}
                className="object-contain absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" // Center image within the 56x56 circle
              />
            </div>
          ) : (
            <DefaultTimelineSvgFallback className="h-8 w-8" />
          )}
      </div>
      <div className={cn(
        "order-1 rounded-lg shadow-xl w-5/12 px-6 py-4",
        isLeft ? "bg-secondary text-secondary-foreground" : "bg-card text-card-foreground"
      )}>
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="p-0 pb-2">
            <p className="text-sm text-muted-foreground">{event.date}</p>
            <CardTitle className="text-lg font-semibold text-foreground">{event.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-sm text-foreground/80">{event.description}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
