
"use server"; // Make this a Server Component to fetch data

import { supabase } from '@/lib/supabaseClient';
import SectionWrapper from '@/components/ui/SectionWrapper';
import SectionTitle from '@/components/ui/SectionTitle';
import ProjectCard from '@/components/ui/ProjectCard';
import type { Project } from '@/types/supabase'; // Use the Supabase-aligned type
import ProjectCarousel from '@/components/ui/ProjectCarousel';


async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false }); // Example ordering

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
  // Map Supabase row to Project type if needed, e.g. image_url to imageUrl
  return data.map(p => ({ ...p, imageUrl: p.image_url, liveDemoUrl: p.live_demo_url, repoUrl: p.repo_url })) as Project[];
}


export default async function ProjectsSection() {
  const projectsData = await getProjects();

  if (!projectsData || projectsData.length === 0) {
    return (
      <SectionWrapper id="projects" className="bg-background section-fade-in" style={{ animationDelay: '0.4s' }}>
        <SectionTitle subtitle="A selection of my recent work.">
          Featured Projects
        </SectionTitle>
        <p className="text-center text-muted-foreground">No projects to display at the moment. Data will be populated from Supabase.</p>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper id="projects" className="bg-background section-fade-in" style={{ animationDelay: '0.4s' }}>
      <SectionTitle subtitle="A selection of my recent work, showcasing my skills in creating engaging and functional digital experiences.">
        Featured Projects
      </SectionTitle>
      <ProjectCarousel projects={projectsData} />
    </SectionWrapper>
  );
}
