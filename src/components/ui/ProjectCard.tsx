"use client"; // Needs to be a client component for useEffect

import React, { useEffect, useState } from 'react'; // Import useEffect and useState
import NextImage from 'next/image';
import Link from 'next/link';
import { ExternalLink, Github, Rocket, Wrench, FlaskConical, CheckCircle2, Archive, ClipboardList, type LucideIcon, Eye } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Project, ProjectStatus } from '@/types/supabase'; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/lib/supabaseClient'; // Import Supabase client
import { InView } from 'react-intersection-observer'; // For logging view when card is in viewport
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
}

const statusConfig: Record<ProjectStatus, { icon: LucideIcon; label: string; badgeVariant: "default" | "secondary" | "destructive" | "outline" }> = {
  'Deployed': { icon: Rocket, label: 'Deployed', badgeVariant: 'default' },
  'Completed': { icon: CheckCircle2, label: 'Completed', badgeVariant: 'default' },
  'In Progress': { icon: Wrench, label: 'In Progress', badgeVariant: 'secondary' },
  'Prototype': { icon: FlaskConical, label: 'Prototype', badgeVariant: 'secondary' },
  'Archived': { icon: Archive, label: 'Archived', badgeVariant: 'outline' },
  'Concept': { icon: ClipboardList, label: 'Concept', badgeVariant: 'outline' },
};

const ADMIN_SITE_SETTINGS_ID = 'global_settings'; // Used for fetching analytics setting

// Helper function to check analytics setting with session caching
let globalAnalyticsStatus: boolean | null = null;
let statusLastChecked: number | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // Cache for 5 minutes

async function fetchGlobalAnalyticsSetting(): Promise<boolean> {
  console.log('[ProjectCard] Fetching global analytics setting...');
  const { data: settings, error: settingsError } = await supabase
    .from('site_settings')
    .select('is_analytics_tracking_enabled')
    .eq('id', ADMIN_SITE_SETTINGS_ID)
    .maybeSingle();

  if (settingsError) {
    console.warn('[ProjectCard] Error fetching site_settings for analytics status:', settingsError.message);
    return true; // Default to true (track) if settings can't be fetched
  }
  if (settings && typeof settings.is_analytics_tracking_enabled === 'boolean') {
    console.log('[ProjectCard] Global analytics status from DB:', settings.is_analytics_tracking_enabled);
    return settings.is_analytics_tracking_enabled;
  }
  console.log('[ProjectCard] No specific analytics tracking setting found, defaulting to true.');
  return true; // Default to true if no setting is explicitly found or is null
}

async function isAnalyticsGloballyEnabled(): Promise<boolean> {
  const now = Date.now();
  if (globalAnalyticsStatus !== null && statusLastChecked !== null && (now - statusLastChecked < CACHE_DURATION_MS)) {
    // console.log('[ProjectCard] Using cached global analytics status:', globalAnalyticsStatus);
    return globalAnalyticsStatus;
  }
  
  globalAnalyticsStatus = await fetchGlobalAnalyticsSetting();
  statusLastChecked = now;
  return globalAnalyticsStatus;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const currentProjectStatusConfig = project.status ? statusConfig[project.status] : statusConfig['Concept'];
  const [hasLoggedView, setHasLoggedView] = useState(false);

  const handleInView = async (inView: boolean) => {
    if (inView && project && project.id && !hasLoggedView) {
      const trackingAllowed = await isAnalyticsGloballyEnabled();
      if (!trackingAllowed) {
        setHasLoggedView(true);
        return;
      }
      await supabase.from('project_views').insert({ project_id: project.id });
      setHasLoggedView(true);
    }
  };

  let liveDemoButton = null;
  if (project.liveDemoUrl) {
    liveDemoButton = (
      <Button asChild variant="outline" size="sm" className="flex-1 group/button hover:border-primary hover:bg-accent hover:text-accent-foreground min-w-0 transition-colors">
        <Link href={project.liveDemoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
          <ExternalLink className="mr-1.5 h-4 w-4 text-muted-foreground group-hover/button:text-accent-foreground transition-colors" />
          <span className="group-hover/button:text-accent-foreground transition-colors">Live Demo</span>
        </Link>
      </Button>
    );
  } else {
     liveDemoButton = (
        <TooltipProvider><Tooltip><TooltipTrigger asChild>
          <Button variant="outline" size="sm" className="flex-1 min-w-0" disabled>
            <ExternalLink className="mr-1.5 h-4 w-4" /> Live Demo
          </Button>
        </TooltipTrigger><TooltipContent><p>Live demo not available.</p></TooltipContent></Tooltip></TooltipProvider>
      );
  }

  let sourceCodeButton = null;
  if (project.repoUrl) {
    sourceCodeButton = ( 
      <Button asChild variant="secondary" size="sm" className="flex-1 group/button hover:border-primary hover:bg-primary hover:text-primary-foreground min-w-0 transition-colors">
        <Link href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
          <Github className="mr-1.5 h-4 w-4 text-muted-foreground group-hover/button:text-primary-foreground transition-colors" />
          <span className="group-hover/button:text-primary-foreground transition-colors">Source Code</span>
        </Link>
      </Button>
    );
  } else {
    sourceCodeButton = (
        <TooltipProvider><Tooltip><TooltipTrigger asChild>
        <Button variant="secondary" size="sm" className="flex-1 min-w-0" disabled>
            <Github className="mr-1.5 h-4 w-4" /> Source Code
        </Button>
        </TooltipTrigger><TooltipContent><p>Source code not available.</p></TooltipContent></Tooltip></TooltipProvider>
    );
  }

  return (
    <InView onChange={handleInView} rootMargin="-100px 0px" triggerOnce>
      <Card className="flex flex-col h-full overflow-hidden shadow-lg bg-card transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 hover:scale-[1.015] group">
        <div className="relative w-full h-48 flex-shrink-0 bg-muted/30 group">
          {project.imageUrl ? (
            <NextImage
                src={project.imageUrl}
                alt={project.title || 'Project image'}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
            </div>
          )}
        </div>
        <CardHeader className="pt-4 px-4 pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-semibold leading-tight mb-1 truncate group-hover:text-primary transition-colors duration-300" title={project.title || undefined}>
              {project.title}
            </CardTitle>
            {project.status && currentProjectStatusConfig && (
              <Badge 
                variant={currentProjectStatusConfig.badgeVariant}
                className={cn(
                    "ml-2 flex-shrink-0",
                    project.status === 'Deployed' && "bg-green-600 hover:bg-green-700 text-white",
                    project.status === 'Completed' && "bg-blue-600 hover:bg-blue-700 text-white",
                    project.status === 'In Progress' && "bg-yellow-500 hover:bg-yellow-600 text-black",
                    project.status === 'Prototype' && "bg-purple-500 hover:bg-purple-600 text-white",
                    project.status === 'Archived' && "border-gray-500 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700",
                    project.status === 'Concept' && "bg-gray-400 hover:bg-gray-500 text-black"
                )}
              >
                <currentProjectStatusConfig.icon className="mr-1.5 h-3.5 w-3.5" />
                {currentProjectStatusConfig.label}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow px-4 py-2 space-y-3">
          <div className="min-h-[calc(1.25rem*3)]">
            {project.description ? (
              <p className="text-sm text-muted-foreground line-clamp-3" title={project.description || undefined}>
                {project.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No description available.</p>
            )}
          </div>
          
          <div className="pt-1 min-h-[3.2rem]">
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {project.tags.slice(0, 5).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0.5">{tag}</Badge>
                ))}
              </div>
            )}
          </div>

          {project.status === 'In Progress' && typeof project.progress === 'number' ? (
            <div className="pt-2 min-h-[2.8rem]">
              <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                <span>Progress</span>
                <span>{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2 w-full" aria-label={`${project.progress}% complete`} />
            </div>
          ) : (
            <div className="pt-2 min-h-[2.8rem]" /> // Placeholder for height consistency
          )}
        </CardContent>
        { (liveDemoButton || sourceCodeButton) &&
            <CardFooter className="px-4 pb-4 pt-3 flex w-full space-x-2 border-t mt-auto">
                {liveDemoButton}
                {sourceCodeButton}
            </CardFooter>
        }
      </Card>
    </InView>
  );
}

    