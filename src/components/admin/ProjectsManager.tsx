"use client";

import React, { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, PlusCircle, Edit, Trash2, Briefcase, ExternalLink, Github, Rocket, Wrench, FlaskConical, CheckCircle2, Archive, ClipboardList, type LucideIcon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { Project, ProjectStatus, User as SupabaseUser, AdminActivityLog } from '@/types/supabase';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const projectSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").optional().or(z.literal("")),
  image_url: z.string().url("Must be a valid URL if provided, or will be set by upload.").optional().or(z.literal("")).nullable(),
  live_demo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  repo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  tags: z.string().transform(val => val.split(',').map(tag => tag.trim()).filter(Boolean)),
  status: z.enum(['Deployed', 'In Progress', 'Prototype', 'Archived', 'Concept', 'Completed']),
  progress: z.coerce.number().min(0).max(100).optional().nullable(),
});
type ProjectFormData = z.infer<typeof projectSchema>;

// Status configuration for project cards, similar to public ProjectCard
const cardStatusConfig: Record<ProjectStatus, { icon: LucideIcon; label: string; badgeVariant: "default" | "secondary" | "destructive" | "outline" }> = {
  'Deployed': { icon: Rocket, label: 'Deployed', badgeVariant: 'default' },
  'Completed': { icon: CheckCircle2, label: 'Completed', badgeVariant: 'default' },
  'In Progress': { icon: Wrench, label: 'In Progress', badgeVariant: 'secondary' },
  'Prototype': { icon: FlaskConical, label: 'Prototype', badgeVariant: 'secondary' },
  'Archived': { icon: Archive, label: 'Archived', badgeVariant: 'outline' },
  'Concept': { icon: ClipboardList, label: 'Concept', badgeVariant: 'outline' },
};

export default function ProjectsManager() {
  const router = useRouter();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentDbProjectImageUrl, setCurrentDbProjectImageUrl] = useState<string | null>(null);
  const [showProjectDeleteConfirm, setShowProjectDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectImageFile, setProjectImageFile] = useState<File | null>(null);
  const [projectImagePreview, setProjectImagePreview] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);

  const projectForm = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { title: '', description: '', image_url: '', live_demo_url: '', repo_url: '', tags: [], status: 'Concept', progress: 0 }
  });

  const currentProjectImageUrlForForm = projectForm.watch('image_url');

  useEffect(() => {
    fetchProjects();
    const authListener = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user ?? null;
        setCurrentUser(user);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
        const user = session?.user ?? null;
        setCurrentUser(user);
    });

    return () => {
      authListener.data.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let newPreviewUrl: string | null = null;
    if (projectImageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviewUrl = reader.result as string;
        setProjectImagePreview(newPreviewUrl);
      };
      reader.readAsDataURL(projectImageFile);
      return; 
    } else if (currentProjectImageUrlForForm && currentProjectImageUrlForForm.trim() !== '') {
      newPreviewUrl = currentProjectImageUrlForForm;
    } else if (currentDbProjectImageUrl) {
      newPreviewUrl = currentDbProjectImageUrl;
    }
    setProjectImagePreview(newPreviewUrl);
  }, [projectImageFile, currentProjectImageUrlForForm, currentDbProjectImageUrl]);


  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    const { data, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching projects:', JSON.stringify(fetchError, null, 2));
      toast({ title: "Error", description: `Could not fetch projects: ${fetchError.message}`, variant: "destructive" });
      setProjects([]);
    } else if (data) {
      const mappedData: Project[] = data.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description || null,
        imageUrl: p.image_url || null, // Mapped for client-side use
        liveDemoUrl: p.live_demo_url || null, // Mapped
        repoUrl: p.repo_url || null, // Mapped
        tags: p.tags || [],
        status: p.status as ProjectStatus | null || 'Concept',
        progress: p.progress === null || p.progress === undefined ? null : Number(p.progress),
        created_at: p.created_at,
      }));
      setProjects(mappedData);
    } else {
      setProjects([]);
    }
    setIsLoadingProjects(false);
  };

  const handleProjectImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setProjectImageFile(event.target.files[0]);
      projectForm.setValue('image_url', ''); 
    } else {
      setProjectImageFile(null);
      const formUrl = projectForm.getValues('image_url');
      setProjectImagePreview(formUrl && formUrl.trim() !== '' ? formUrl : currentDbProjectImageUrl || null);
    }
  };

  const onProjectSubmit: SubmitHandler<ProjectFormData> = async (formData) => {
    let imageUrlToSaveInDb = formData.image_url; 
    let oldImageStoragePathToDelete: string | null = null;
    const existingProjectImageUrlForDeletion = currentProject?.imageUrl;


    if (existingProjectImageUrlForDeletion) {
        try {
            const url = new URL(existingProjectImageUrlForDeletion);
            if (url.pathname.includes('/project-images/')) {
                const pathParts = url.pathname.split('/project-images/');
                if (pathParts.length > 1 && !pathParts[1].startsWith('http')) { 
                    oldImageStoragePathToDelete = pathParts[1];
                }
            }
        } catch (e) {
            console.warn("[ProjectsManager] Could not parse existingProjectImageUrlForDeletion for old path:", existingProjectImageUrlForDeletion);
        }
    }
    
    if (projectImageFile) {
      const fileExt = projectImageFile.name.split('.').pop();
      const fileName = `project_${Date.now()}.${fileExt}`; 
      const filePath = `${fileName}`; 

      toast({ title: "Uploading Project Image", description: "Please wait..." });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-images') 
        .upload(filePath, projectImageFile, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.error("Error uploading project image:", JSON.stringify(uploadError, null, 2));
        toast({ title: "Upload Error", description: `Failed to upload project image: ${uploadError.message}`, variant: "destructive" });
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('project-images').getPublicUrl(filePath);
      if (!publicUrlData?.publicUrl) {
        toast({ title: "Error", description: "Failed to get public URL for uploaded image.", variant: "destructive" });
        return;
      }
      imageUrlToSaveInDb = publicUrlData.publicUrl;
    } else if (formData.image_url === '' && existingProjectImageUrlForDeletion) {
        // User cleared the URL field and there was an existing image
        imageUrlToSaveInDb = null; // Ensure DB is updated to null
    }
    
    const dataForSupabase = {
      title: formData.title,
      description: formData.description || null,
      image_url: imageUrlToSaveInDb || null,
      live_demo_url: formData.live_demo_url || null,
      repo_url: formData.repo_url || null,
      tags: formData.tags || [], 
      status: formData.status,
      progress: formData.progress === undefined || formData.progress === null ? null : Number(formData.progress),
    };
    
    let upsertResponse;
    if (formData.id) { 
      upsertResponse = await supabase
        .from('projects')
        .update(dataForSupabase)
        .eq('id', formData.id)
        .select()
        .single();
      if (upsertResponse.error) {
        console.error("Error updating project:", JSON.stringify(upsertResponse.error, null, 2));
        toast({ title: "Error", description: `Failed to update project: ${upsertResponse.error.message}`, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Project updated successfully." });
        if (currentUser && upsertResponse.data) {
          await supabase.from('admin_activity_log').insert({
            action_type: 'PROJECT_UPDATED',
            description: `Project "${formData.title}" was updated.`,
            user_identifier: currentUser.id,
            details: { projectId: upsertResponse.data.id }
          });
          window.dispatchEvent(new CustomEvent('adminActivityAdded'));
          // Delete old image from storage if a new one was uploaded OR if the URL was cleared
          if (oldImageStoragePathToDelete && (projectImageFile || imageUrlToSaveInDb !== existingProjectImageUrlForDeletion)) {
              console.log("[ProjectsManager] Attempting to delete old project image from storage:", oldImageStoragePathToDelete);
              const { error: storageDeleteError } = await supabase.storage.from('project-images').remove([oldImageStoragePathToDelete]);
              if (storageDeleteError) console.warn("[ProjectsManager] Error deleting old project image from storage:", JSON.stringify(storageDeleteError, null, 2));
          }
        }
      }
    } else { 
      upsertResponse = await supabase
        .from('projects')
        .insert(dataForSupabase)
        .select()
        .single();
      if (upsertResponse.error) {
        console.error("Error adding project (raw Supabase error object):", JSON.stringify(upsertResponse.error, null, 2));
        toast({ title: "Error", description: `Failed to add project: ${upsertResponse.error.message || 'Supabase returned an error. Check RLS or console.'}`, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Project added successfully." });
         if (currentUser && upsertResponse.data) {
          await supabase.from('admin_activity_log').insert({
            action_type: 'PROJECT_CREATED',
            description: `Project "${formData.title}" was created.`,
            user_identifier: currentUser.id,
            details: { projectId: upsertResponse.data.id }
          });
          window.dispatchEvent(new CustomEvent('adminActivityAdded'));
        }
      }
    }

    if (!upsertResponse.error) {
        fetchProjects();
        setIsProjectModalOpen(false);
        setProjectImageFile(null); 
        router.refresh();
    }
  };
  
  const handleDeleteProject = async () => {
    if (!projectToDelete || !projectToDelete.id) {
      toast({ title: "Error", description: "No project selected for deletion.", variant: "destructive" });
      return;
    }

    let imageStoragePathToDelete: string | null = null;
    if (projectToDelete.imageUrl) {
        try {
            const url = new URL(projectToDelete.imageUrl);
            if (url.pathname.includes('/project-images/')) {
                const pathParts = url.pathname.split('/project-images/');
                if (pathParts.length > 1 && !pathParts[1].startsWith('http')) { 
                    imageStoragePathToDelete = pathParts[1];
                }
            }
        } catch (e) {
            console.warn("[ProjectsManager] Could not parse projectToDelete.imageUrl for path:", projectToDelete.imageUrl);
        }
    }

    const { error: dbDeleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectToDelete.id);

    if (dbDeleteError) {
      console.error('Error deleting project from database:', JSON.stringify(dbDeleteError, null, 2));
      toast({ title: "Error", description: `Failed to delete project: ${dbDeleteError.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Project "${projectToDelete.title}" deleted successfully.` });
      if (currentUser && projectToDelete) {
        try {
          await supabase.from('admin_activity_log').insert({
            action_type: 'PROJECT_DELETED',
            description: `Project "${projectToDelete.title}" was deleted.`,
            user_identifier: currentUser.id,
            details: { deletedProjectId: projectToDelete.id, deletedTitle: projectToDelete.title }
          });
          window.dispatchEvent(new CustomEvent('adminActivityAdded'));
        } catch (logError) {
          console.error("Error logging project deletion:", logError);
        }
      }
      if (imageStoragePathToDelete) {
        console.log("[ProjectsManager] Deleting project image from storage:", imageStoragePathToDelete);
        const { error: storageDeleteError } = await supabase.storage.from('project-images').remove([imageStoragePathToDelete]);
        if (storageDeleteError) {
            console.warn("[ProjectsManager] Error deleting project image from storage after DB deletion:", JSON.stringify(storageDeleteError, null, 2));
            toast({ title: "Warning", description: `Project data deleted, but failed to delete associated image: ${storageDeleteError.message}. Please check storage.`, variant: "default", duration: 7000 });
        }
      }
      fetchProjects();
    }
    setProjectToDelete(null);
    setShowProjectDeleteConfirm(false);
  };

  const triggerDeleteConfirmation = (project: Project) => {
    setProjectToDelete(project);
    setShowProjectDeleteConfirm(true);
  };

  const handleOpenProjectModal = (project?: Project) => {
    if (project) {
      setCurrentProject(project);
      setCurrentDbProjectImageUrl(project.imageUrl || null); // Store DB image URL for comparison on save
      projectForm.reset({
        id: project.id,
        title: project.title,
        description: project.description || '',
        image_url: project.imageUrl || '',
        live_demo_url: project.liveDemoUrl || '',
        repo_url: project.repoUrl || '',
        tags: Array.isArray(project.tags) ? project.tags : [],
        status: project.status || 'Concept',
        progress: project.progress === null || project.progress === undefined ? null : Number(project.progress),
      });
      setProjectImagePreview(project.imageUrl || null);
    } else {
      setCurrentProject(null);
      setCurrentDbProjectImageUrl(null);
      projectForm.reset({ title: '', description: '', image_url: '', live_demo_url: '', repo_url: '', tags: [], status: 'Concept', progress: 0 });
      setProjectImageFile(null);
      setProjectImagePreview(null);
    }
    setIsProjectModalOpen(true);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Manage Projects
          <Briefcase className="h-6 w-6 text-primary" />
        </CardTitle>
        <CardDescription>Add, edit, or delete your portfolio projects.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 text-right">
          <Button onClick={() => handleOpenProjectModal()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Project
          </Button>
        </div>

        {isLoadingProjects ? (
          <p className="text-center text-muted-foreground">Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No projects found. Add one to get started!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const currentProjectStatusConfig = project.status ? cardStatusConfig[project.status] : cardStatusConfig['Concept'];
              
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
                <Card key={project.id} className="flex flex-col h-full overflow-hidden shadow-lg bg-card transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 hover:scale-[1.015] group">
                  <div className="relative w-full h-48 flex-shrink-0 bg-muted/30 group">
                    {project.imageUrl ? (
                      <Image
                          src={project.imageUrl}
                          alt={project.title || 'Project image'}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                         <Briefcase size={48} className="text-gray-400 dark:text-gray-500" />
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
                              project.status === 'Archived' && "bg-stone-200 text-stone-700 hover:bg-stone-300 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600",
                              project.status === 'Concept' && "bg-slate-400 hover:bg-slate-500 text-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200"
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
                      <div className="pt-2 min-h-[2.8rem]" /> 
                    )}
                  </CardContent>
                  
                  <CardFooter className="px-4 pb-4 pt-3 flex flex-col w-full mt-auto">
                      {(liveDemoButton || sourceCodeButton) && (
                          <div className="flex w-full space-x-2 mb-3">
                              {liveDemoButton}
                              {sourceCodeButton}
                          </div>
                      )}
                      <div className="flex w-full space-x-2 border-t pt-3">
                          <Button variant="outline" size="sm" onClick={() => handleOpenProjectModal(project)} className="flex-1">
                              <Edit className="mr-2 h-4 w-4" /> Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => triggerDeleteConfirmation(project)} className="flex-1">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </Button>
                      </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={isProjectModalOpen} onOpenChange={(isOpen) => { setIsProjectModalOpen(isOpen); if (!isOpen) { setCurrentProject(null); setCurrentDbProjectImageUrl(null); setProjectImageFile(null); projectForm.reset(); } }}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader><DialogTitle>{currentProject?.id ? 'Edit Project' : 'Add New Project'}</DialogTitle></DialogHeader>
          <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="grid gap-4 py-4">
            <ScrollArea className="max-h-[70vh] p-1">
              <div className="grid gap-4 p-3">
                <div><Label htmlFor="title">Title</Label><Input id="title" {...projectForm.register("title")} />{projectForm.formState.errors.title && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.title.message}</p>}</div>
                <div><Label htmlFor="description">Description</Label><Textarea id="description" {...projectForm.register("description")} />{projectForm.formState.errors.description && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.description.message}</p>}</div>
                <div className="space-y-2">
                  <Label htmlFor="project_image_file">Project Image File</Label>
                  <div className="flex items-center gap-3"><Input id="project_image_file" type="file" accept="image/*" onChange={handleProjectImageFileChange} className="flex-grow" /><UploadCloud className="h-6 w-6 text-muted-foreground" /></div>
                  {projectImagePreview && (<div className="mt-2 p-2 border rounded-md bg-muted aspect-video relative w-full max-w-xs mx-auto"><Image src={projectImagePreview} alt="Image preview" fill className="object-contain rounded"/></div>)}
                  <div><Label htmlFor="image_url_project" className="text-xs text-muted-foreground">Or enter Image URL (upload will override)</Label><Input id="image_url_project" {...projectForm.register("image_url")} placeholder="https://example.com/image.png" />{projectForm.formState.errors.image_url && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.image_url.message}</p>}</div>
                </div>
                <div><Label htmlFor="live_demo_url">Live Demo URL</Label><Input id="live_demo_url" {...projectForm.register("live_demo_url")} placeholder="https://example.com/demo" />{projectForm.formState.errors.live_demo_url && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.live_demo_url.message}</p>}</div>
                <div><Label htmlFor="repo_url">Repository URL</Label><Input id="repo_url" {...projectForm.register("repo_url")} placeholder="https://github.com/user/repo" />{projectForm.formState.errors.repo_url && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.repo_url.message}</p>}</div>
                <div><Label htmlFor="tags">Tags (comma-separated)</Label><Input id="tags" {...projectForm.register("tags")} placeholder="React, Next.js, Supabase" /></div>
                <div><Label htmlFor="status">Status</Label>
                  <select id="status" {...projectForm.register("status")} className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50")}>
                    {(['Concept', 'Prototype', 'In Progress', 'Completed', 'Deployed', 'Archived'] as ProjectStatus[]).map(s => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>
                <div><Label htmlFor="progress">Progress (0-100, for 'In Progress')</Label><Input id="progress" type="number" {...projectForm.register("progress", { setValueAs: (v) => (v === '' || v === null || v === undefined ? null : Number(v)) })} />{projectForm.formState.errors.progress && <p className="text-destructive text-sm mt-1">{projectForm.formState.errors.progress.message}</p>}</div>
              </div>
            </ScrollArea>
            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <DialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button></DialogClose>
                <Button type="submit" className="w-full sm:w-auto">{currentProject?.id ? 'Save Changes' : 'Add Project'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showProjectDeleteConfirm} onOpenChange={setShowProjectDeleteConfirm}>
        <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive-foreground">Delete Project: {projectToDelete?.title}?</AlertDialogTitle>
            <AlertDialogDescription className="text-destructive-foreground/90">This action cannot be undone. This will permanently delete the project and its image (if any).</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowProjectDeleteConfirm(false); setProjectToDelete(null); }} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground", "hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive", "hover:bg-destructive-foreground/90")}>Delete Project</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

