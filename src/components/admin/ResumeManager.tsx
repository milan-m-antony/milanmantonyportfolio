
"use client";

import React, { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Briefcase, GraduationCap, ListChecks, Languages as LanguagesIcon, FileText as ResumeFileIcon, UploadCloud, Link as LinkIcon, Building, Type as TypeIcon, ChevronDown } from 'lucide-react';
import NextImage from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import type { ResumeExperience, ResumeEducation, ResumeKeySkillCategory, ResumeKeySkill, ResumeLanguage, ResumeMeta } from '@/types/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger as ShadCNAccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter as AlertDialogPrimitiveFooter, AlertDialogHeader as AlertDialogPrimitiveHeader, AlertDialogTitle as AlertDialogPrimitiveTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from "@/components/ui/badge"; // Badge was missing here previously

// Fixed ID for resume_meta table (single row)
const RESUME_META_ID = '00000000-0000-0000-0000-000000000003';

// Zod Schemas
const resumeMetaSchema = z.object({
  id: z.string().uuid().default(RESUME_META_ID),
  description: z.string().optional().nullable(),
  resume_pdf_url: z.string().url("Must be valid URL or will be set by upload").optional().or(z.literal("")).nullable(),
});
type ResumeMetaFormData = z.infer<typeof resumeMetaSchema>;

const resumeExperienceSchema = z.object({
  id: z.string().uuid().optional(),
  job_title: z.string().min(2, "Job title is required"),
  company_name: z.string().min(2, "Company name is required"),
  date_range: z.string().optional().nullable(),
  description_points: z.string().transform(val => val.split('\n').map(p => p.trim()).filter(Boolean)).optional(),
  icon_image_url: z.string().url("Must be a valid URL if provided.").optional().or(z.literal("")).nullable(),
  sort_order: z.coerce.number().optional().default(0),
});
type ResumeExperienceFormData = z.infer<typeof resumeExperienceSchema>;

const resumeEducationSchema = z.object({
  id: z.string().uuid().optional(),
  degree_or_certification: z.string().min(2, "Degree/Certification is required"),
  institution_name: z.string().min(2, "Institution name is required"),
  date_range: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  icon_image_url: z.string().url("Must be a valid URL if provided.").optional().or(z.literal("")).nullable(),
  sort_order: z.coerce.number().optional().default(0),
});
type ResumeEducationFormData = z.infer<typeof resumeEducationSchema>;

const resumeKeySkillCategorySchema = z.object({
  id: z.string().uuid().optional(),
  category_name: z.string().min(2, "Category name is required"),
  icon_image_url: z.string().url("Must be a valid URL if provided.").optional().or(z.literal("")).nullable(),
  sort_order: z.coerce.number().optional().default(0),
});
type ResumeKeySkillCategoryFormData = z.infer<typeof resumeKeySkillCategorySchema>;

const resumeKeySkillSchema = z.object({
  id: z.string().uuid().optional(),
  skill_name: z.string().min(1, "Skill name is required"),
  category_id: z.string().uuid("Category ID is required"),
});
type ResumeKeySkillFormData = z.infer<typeof resumeKeySkillSchema>;

const resumeLanguageSchema = z.object({
  id: z.string().uuid().optional(),
  language_name: z.string().min(2, "Language name is required"),
  proficiency: z.string().optional().nullable(),
  icon_image_url: z.string().url("Must be a valid URL if provided.").optional().or(z.literal("")).nullable(),
  sort_order: z.coerce.number().optional().default(0),
});
type ResumeLanguageFormData = z.infer<typeof resumeLanguageSchema>;


const IconPreview: React.FC<{ url?: string | null; alt?: string; DefaultIcon?: React.ElementType; className?: string }> = ({ url, alt = "Icon Preview", DefaultIcon = TypeIcon, className = "h-8 w-8 text-muted-foreground border rounded p-1" }) => {
  if (url && typeof url === 'string' && url.trim() !== '') {
    // Using standard img for admin previews to avoid next/image issues with data URIs or unconfigured hosts
    return <img src={url} alt={alt} className={cn("object-contain border rounded-sm bg-muted", className)} style={{ maxWidth: '32px', maxHeight: '32px' }} />;
  }
  return <DefaultIcon className={cn("text-muted-foreground border rounded p-1", className)} />;
};


export default function ResumeManager() {
  const router = useRouter();
  const { toast } = useToast();

  // Resume Meta State
  const [isLoadingResumeMeta, setIsLoadingResumeMeta] = React.useState(false);
  const [resumePdfFile, setResumePdfFile] = React.useState<File | null>(null);
  const [currentDbResumePdfUrl, setCurrentDbResumePdfUrl] = React.useState<string | null>(null);

  // Experience State
  const [experiences, setExperiences] = React.useState<ResumeExperience[]>([]);
  const [isLoadingExperiences, setIsLoadingExperiences] = React.useState(false);
  const [isExperienceModalOpen, setIsExperienceModalOpen] = React.useState(false);
  const [currentExperience, setCurrentExperience] = React.useState<ResumeExperience | null>(null);
  const [experienceToDelete, setExperienceToDelete] = React.useState<ResumeExperience | null>(null);
  const [showExperienceDeleteConfirm, setShowExperienceDeleteConfirm] = React.useState(false);

  // Education State
  const [educationItems, setEducationItems] = React.useState<ResumeEducation[]>([]);
  const [isLoadingEducation, setIsLoadingEducation] = React.useState(false);
  const [isEducationModalOpen, setIsEducationModalOpen] = React.useState(false);
  const [currentEducation, setCurrentEducation] = React.useState<ResumeEducation | null>(null);
  const [educationToDelete, setEducationToDelete] = React.useState<ResumeEducation | null>(null);
  const [showEducationDeleteConfirm, setShowEducationDeleteConfirm] = React.useState(false);

  // Key Skill Category State
  const [keySkillCategories, setKeySkillCategories] = React.useState<ResumeKeySkillCategory[]>([]);
  const [isLoadingKeySkillCategories, setIsLoadingKeySkillCategories] = React.useState(false);
  const [isSkillCategoryModalOpen, setIsSkillCategoryModalOpen] = React.useState(false);
  const [currentSkillCategory, setCurrentSkillCategory] = React.useState<ResumeKeySkillCategory | null>(null);
  const [skillCategoryToDelete, setSkillCategoryToDelete] = React.useState<ResumeKeySkillCategory | null>(null);
  const [showSkillCategoryDeleteConfirm, setShowSkillCategoryDeleteConfirm] = React.useState(false);

  // Key Skill State
  const [isSkillModalOpen, setIsSkillModalOpen] = React.useState(false);
  const [currentSkill, setCurrentSkill] = React.useState<ResumeKeySkill | null>(null);
  const [parentKeySkillCategoryId, setParentKeySkillCategoryId] = React.useState<string | null>(null); // To know which category to add/edit skill for
  const [skillToDelete, setSkillToDelete] = React.useState<ResumeKeySkill | null>(null);
  const [showSkillDeleteConfirm, setShowSkillDeleteConfirm] = React.useState(false);
  
  // Language State
  const [languages, setLanguages] = React.useState<ResumeLanguage[]>([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = React.useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = React.useState(false);
  const [currentLanguage, setCurrentLanguage] = React.useState<ResumeLanguage | null>(null);
  const [languageToDelete, setLanguageToDelete] = React.useState<ResumeLanguage | null>(null);
  const [showLanguageDeleteConfirm, setShowLanguageDeleteConfirm] = React.useState(false);

  // Forms
  const resumeMetaForm = useForm<ResumeMetaFormData>({ resolver: zodResolver(resumeMetaSchema), defaultValues: { id: RESUME_META_ID, description: '', resume_pdf_url: '' }});
  const experienceForm = useForm<ResumeExperienceFormData>({ resolver: zodResolver(resumeExperienceSchema), defaultValues: { job_title: '', company_name: '', date_range: '', description_points: [], icon_image_url: '', sort_order: 0 }});
  const educationForm = useForm<ResumeEducationFormData>({ resolver: zodResolver(resumeEducationSchema), defaultValues: { degree_or_certification: '', institution_name: '', date_range: '', description: '', icon_image_url: '', sort_order: 0 }});
  const skillCategoryForm = useForm<ResumeKeySkillCategoryFormData>({ resolver: zodResolver(resumeKeySkillCategorySchema), defaultValues: { category_name: '', icon_image_url: '', sort_order: 0 }});
  const skillForm = useForm<ResumeKeySkillFormData>({ resolver: zodResolver(resumeKeySkillSchema), defaultValues: { skill_name: '', category_id: '' }});
  const languageForm = useForm<ResumeLanguageFormData>({ resolver: zodResolver(resumeLanguageSchema), defaultValues: { language_name: '', proficiency: '', icon_image_url: '', sort_order: 0 }});
  
  const watchedSkillCategoryIconUrl = skillCategoryForm.watch("icon_image_url");
  const watchedExperienceIconUrl = experienceForm.watch("icon_image_url");
  const watchedEducationIconUrl = educationForm.watch("icon_image_url");
  const watchedLanguageIconUrl = languageForm.watch("icon_image_url");


  // Fetch Resume Meta
  const fetchResumeMeta = async () => { setIsLoadingResumeMeta(true); const { data, error } = await supabase.from('resume_meta').select('*').eq('id', RESUME_META_ID).maybeSingle(); if (error) { toast({ title: "Error fetching resume meta", description: error.message, variant: "destructive" }); } else if (data) { resumeMetaForm.reset({ id: data.id, description: data.description || '', resume_pdf_url: data.resume_pdf_url || '' }); setCurrentDbResumePdfUrl(data.resume_pdf_url || null); } else { resumeMetaForm.reset({ id: RESUME_META_ID, description: '', resume_pdf_url: '' }); setCurrentDbResumePdfUrl(null); } setIsLoadingResumeMeta(false); };
  const handleResumePdfFileChange = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files?.[0]) { setResumePdfFile(event.target.files[0]); resumeMetaForm.setValue('resume_pdf_url', ''); } else { setResumePdfFile(null); if (currentDbResumePdfUrl) { resumeMetaForm.setValue('resume_pdf_url', currentDbResumePdfUrl); } } };
  const onResumeMetaSubmit: SubmitHandler<ResumeMetaFormData> = async (formData) => {
    setIsLoadingResumeMeta(true);
    let pdfUrlToSave = formData.resume_pdf_url;
    let oldPdfStoragePathToDelete: string | null = null;

    if (currentDbResumePdfUrl) {
        try {
            const url = new URL(currentDbResumePdfUrl);
            const pathParts = url.pathname.split('/resume-pdfs/');
            if (pathParts.length > 1 && !pathParts[1].startsWith('http')) {
                oldPdfStoragePathToDelete = decodeURIComponent(pathParts[1]);
            }
        } catch (e) { console.warn("[ResumeManager] Could not parse currentDbResumePdfUrl for old path:", currentDbResumePdfUrl); }
    }

    if (resumePdfFile) {
      const fileExt = resumePdfFile.name.split('.').pop();
      const fileName = `resume_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      toast({ title: "Uploading Resume PDF", description: "Please wait..." });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resume-pdfs')
        .upload(filePath, resumePdfFile, { cacheControl: '3600', upsert: true }); // Use upsert: true to overwrite if same name (though unlikely with timestamp)

      if (uploadError) {
        console.error("Error uploading PDF:", JSON.stringify(uploadError, null, 2));
        let specificMessage = `Failed to upload PDF: ${uploadError.message}`;
        if (uploadError.message?.includes("security policy") || uploadError.message?.includes("Unauthorized")) {
            specificMessage = "Failed to upload PDF: Permission denied. Please check Supabase Storage RLS policies for 'resume-pdfs' bucket for authenticated users.";
        }
        toast({ title: "Upload Error", description: specificMessage, variant: "destructive", duration: 7000 });
        setIsLoadingResumeMeta(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('resume-pdfs').getPublicUrl(filePath);
      if (!publicUrlData?.publicUrl) {
        toast({ title: "Error", description: "Failed to get public URL for PDF after upload.", variant: "destructive" });
        setIsLoadingResumeMeta(false);
        return;
      }
      pdfUrlToSave = publicUrlData.publicUrl;
      
      // If new PDF uploaded successfully and there was an old one different from the new one, delete old one from storage.
      if (oldPdfStoragePathToDelete && oldPdfStoragePathToDelete !== filePath) {
          console.log("[ResumeManager] New PDF uploaded, attempting to delete old PDF:", oldPdfStoragePathToDelete);
          const { error: storageDeleteError } = await supabase.storage.from('resume-pdfs').remove([oldPdfStoragePathToDelete]);
          if (storageDeleteError) {
              console.warn("[ResumeManager] Failed to delete old PDF from storage:", JSON.stringify(storageDeleteError, null, 2));
          } else {
              console.log("[ResumeManager] Old PDF successfully deleted from storage.");
          }
      }
    } else if (formData.resume_pdf_url === '' && oldPdfStoragePathToDelete) {
        // PDF URL was cleared in the form, and there was an old PDF. Delete it.
        console.log("[ResumeManager] PDF URL cleared, attempting to delete old PDF:", oldPdfStoragePathToDelete);
        const { error: storageDeleteError } = await supabase.storage.from('resume-pdfs').remove([oldPdfStoragePathToDelete]);
        if (storageDeleteError) {
            console.warn("[ResumeManager] Failed to delete old PDF from storage after URL clear:", JSON.stringify(storageDeleteError, null, 2));
        } else {
            console.log("[ResumeManager] Old PDF successfully deleted from storage after URL clear.");
        }
    }


    const dataForUpsert = { id: RESUME_META_ID, description: formData.description || null, resume_pdf_url: pdfUrlToSave || null, updated_at: new Date().toISOString() };
    const { error: upsertError } = await supabase.from('resume_meta').upsert(dataForUpsert, { onConflict: 'id' });
    if (upsertError) { toast({ title: "Error", description: `Failed to save resume info: ${upsertError.message}`, variant: "destructive" }); } 
    else { 
        toast({ title: "Success", description: "Resume info saved." }); 
        fetchResumeMeta(); // Re-fetch to update currentDbResumePdfUrl
        router.refresh(); 
    }
    setResumePdfFile(null);
    setIsLoadingResumeMeta(false); 
  };

  // Experience CRUD
  const fetchExperiences = async () => { setIsLoadingExperiences(true); const { data, error } = await supabase.from('resume_experience').select('*').order('sort_order', { ascending: true }); if (error) { toast({ title: "Error fetching experiences", description: error.message, variant: "destructive" }); setExperiences([]); } else { setExperiences((data || []).map(item => ({ ...item, description_points: item.description_points || [], icon_image_url: item.icon_image_url || null }))); } setIsLoadingExperiences(false); };
  const onExperienceSubmit: SubmitHandler<ResumeExperienceFormData> = async (formData) => { const dataToSave = { ...formData, description_points: formData.description_points || [], icon_image_url: formData.icon_image_url?.trim() === '' ? null : formData.icon_image_url, sort_order: Number(formData.sort_order) || 0 }; let response; if (formData.id) { response = await supabase.from('resume_experience').update(dataToSave).eq('id', formData.id).select(); } else { const { id, ...insertData } = dataToSave; response = await supabase.from('resume_experience').insert(insertData).select(); } if (response.error) { toast({ title: "Error saving experience", description: response.error.message, variant: "destructive" }); } else { toast({ title: "Success", description: "Experience saved." }); fetchExperiences(); setIsExperienceModalOpen(false); router.refresh(); }};
  const handleDeleteExperience = async () => { if (!experienceToDelete) return; const { error } = await supabase.from('resume_experience').delete().eq('id', experienceToDelete.id); if (error) { toast({ title: "Error deleting experience", description: error.message, variant: "destructive" }); } else { toast({ title: "Success", description: "Experience deleted." }); fetchExperiences(); router.refresh(); } setExperienceToDelete(null); setShowExperienceDeleteConfirm(false); };
  const triggerExperienceDeleteConfirmation = (experience: ResumeExperience) => { setExperienceToDelete(experience); setShowExperienceDeleteConfirm(true); };
  const handleOpenExperienceModal = (experience?: ResumeExperience) => { setCurrentExperience(experience || null); experienceForm.reset(experience ? { ...experience, description_points: experience.description_points?.join('\n') || '', icon_image_url: experience.icon_image_url || '', sort_order: Number(experience.sort_order ?? 0), } : { job_title: '', company_name: '', date_range: '', description_points: [], icon_image_url: '', sort_order: 0 }); setIsExperienceModalOpen(true); };

  // Education CRUD
  const fetchEducationItems = async () => { setIsLoadingEducation(true); const { data, error } = await supabase.from('resume_education').select('*').order('sort_order', { ascending: true }); if (error) { toast({ title: "Error fetching education", description: error.message, variant: "destructive" }); setEducationItems([]); } else { setEducationItems((data || []).map(item => ({ ...item, icon_image_url: item.icon_image_url || null }))); } setIsLoadingEducation(false); };
  const onEducationSubmit: SubmitHandler<ResumeEducationFormData> = async (formData) => { const dataToSave = { ...formData, icon_image_url: formData.icon_image_url?.trim() === '' ? null : formData.icon_image_url, sort_order: Number(formData.sort_order) || 0 }; let response; if (formData.id) { response = await supabase.from('resume_education').update(dataToSave).eq('id', formData.id).select(); } else { const { id, ...insertData } = dataToSave; response = await supabase.from('resume_education').insert(insertData).select(); } if (response.error) { toast({ title: "Error saving education", description: response.error.message, variant: "destructive" }); } else { toast({ title: "Success", description: "Education item saved." }); fetchEducationItems(); setIsEducationModalOpen(false); router.refresh(); }};
  const handleDeleteEducation = async () => { if (!educationToDelete) return; const { error } = await supabase.from('resume_education').delete().eq('id', educationToDelete.id); if (error) { toast({ title: "Error deleting education", description: error.message, variant: "destructive" }); } else { toast({ title: "Success", description: "Education item deleted." }); fetchEducationItems(); router.refresh(); } setEducationToDelete(null); setShowEducationDeleteConfirm(false); };
  const triggerEducationDeleteConfirmation = (education: ResumeEducation) => { setEducationToDelete(education); setShowEducationDeleteConfirm(true); };
  const handleOpenEducationModal = (education?: ResumeEducation) => { setCurrentEducation(education || null); educationForm.reset(education ? {...education, icon_image_url: education.icon_image_url || '', sort_order: Number(education.sort_order ?? 0)} : { degree_or_certification: '', institution_name: '', date_range: '', description: '', icon_image_url: '', sort_order: 0 }); setIsEducationModalOpen(true); };

  // Key Skill Category & Skill CRUD
  const fetchKeySkillCategoriesAndSkills = async () => { setIsLoadingKeySkillCategories(true); const { data, error } = await supabase.from('resume_key_skill_categories').select(`*, resume_key_skills(*)`).order('sort_order', { ascending: true }).order('skill_name', { foreignTable: 'resume_key_skills', ascending: true }); if (error) { toast({ title: "Error fetching key skills", description: error.message, variant: "destructive" }); setKeySkillCategories([]); } else { setKeySkillCategories((data || []).map(cat => ({ ...cat, skills: cat.resume_key_skills || [], icon_image_url: cat.icon_image_url || null }))); } setIsLoadingKeySkillCategories(false); };
  const onSkillCategorySubmit: SubmitHandler<ResumeKeySkillCategoryFormData> = async (formData) => { const dataToSave = { ...formData, icon_image_url: formData.icon_image_url?.trim() === '' ? null : formData.icon_image_url, sort_order: Number(formData.sort_order) || 0 }; let response; if (formData.id) { response = await supabase.from('resume_key_skill_categories').update(dataToSave).eq('id', formData.id).select(); } else { const { id, ...insertData } = dataToSave; response = await supabase.from('resume_key_skill_categories').insert(insertData).select(); } if (response.error) { toast({ title: "Error saving category", description: response.error.message, variant: "destructive" }); } else { toast({ title: "Success", description: "Skill category saved." }); fetchKeySkillCategoriesAndSkills(); setIsSkillCategoryModalOpen(false); router.refresh(); }};
  const handleDeleteSkillCategory = async () => { if (!skillCategoryToDelete) return; const { error } = await supabase.from('resume_key_skill_categories').delete().eq('id', skillCategoryToDelete.id); if (error) { toast({ title: "Error deleting category", description: error.message, variant: "destructive" }); } else { toast({ title: "Success", description: "Skill category deleted (skills within it also deleted by cascade)." }); fetchKeySkillCategoriesAndSkills(); router.refresh(); } setSkillCategoryToDelete(null); setShowSkillCategoryDeleteConfirm(false); };
  const triggerSkillCategoryDeleteConfirmation = (category: ResumeKeySkillCategory) => { setSkillCategoryToDelete(category); setShowSkillCategoryDeleteConfirm(true); };
  const handleOpenSkillCategoryModal = (category?: ResumeKeySkillCategory) => { setCurrentSkillCategory(category || null); skillCategoryForm.reset(category ? { ...category, icon_image_url: category.icon_image_url || '', sort_order: Number(category.sort_order ?? 0) } : { category_name: '', icon_image_url: '', sort_order: 0 }); setIsSkillCategoryModalOpen(true); };
  const onSkillSubmit: SubmitHandler<ResumeKeySkillFormData> = async (formData) => { const dataToSave = { ...formData }; let response; if (formData.id) { response = await supabase.from('resume_key_skills').update(dataToSave).eq('id', formData.id).select(); } else { const { id, ...insertData } = dataToSave; response = await supabase.from('resume_key_skills').insert(insertData).select(); } if (response.error) { toast({ title: "Error saving skill", description: response.error.message, variant: "destructive" }); } else { toast({ title: "Success", description: "Skill saved." }); fetchKeySkillCategoriesAndSkills(); setIsSkillModalOpen(false); router.refresh(); }};
  const handleDeleteSkill = async () => { if (!skillToDelete) return; const { error } = await supabase.from('resume_key_skills').delete().eq('id', skillToDelete.id); if (error) { toast({ title: "Error deleting skill", description: error.message, variant: "destructive" }); } else { toast({ title: "Success", description: "Skill deleted." }); fetchKeySkillCategoriesAndSkills(); router.refresh(); } setSkillToDelete(null); setShowSkillDeleteConfirm(false); };
  const triggerSkillDeleteConfirmation = (skill: ResumeKeySkill) => { setSkillToDelete(skill); setShowSkillDeleteConfirm(true); };
  const handleOpenSkillModal = (categoryId: string, skill?: ResumeKeySkill) => { setParentKeySkillCategoryId(categoryId); setCurrentSkill(skill || null); skillForm.reset(skill ? { ...skill, category_id: categoryId } : { skill_name: '', category_id: categoryId }); setIsSkillModalOpen(true); };

  // Language CRUD
  const fetchLanguages = async () => { setIsLoadingLanguages(true); const { data, error } = await supabase.from('resume_languages').select('*').order('sort_order', { ascending: true }); if (error) { toast({ title: "Error fetching languages", description: error.message, variant: "destructive" }); setLanguages([]); } else { setLanguages((data || []).map(item => ({ ...item, icon_image_url: item.icon_image_url || null }))); } setIsLoadingLanguages(false); };
  const onLanguageSubmit: SubmitHandler<ResumeLanguageFormData> = async (formData) => { const dataToSave = { ...formData, icon_image_url: formData.icon_image_url?.trim() === '' ? null : formData.icon_image_url, sort_order: Number(formData.sort_order) || 0 }; let response; if (formData.id) { response = await supabase.from('resume_languages').update(dataToSave).eq('id', formData.id).select(); } else { const { id, ...insertData } = dataToSave; response = await supabase.from('resume_languages').insert(insertData).select(); } if (response.error) { toast({ title: "Error saving language", description: response.error.message, variant: "destructive" }); } else { toast({ title: "Success", description: "Language saved." }); fetchLanguages(); setIsLanguageModalOpen(false); router.refresh(); }};
  const handleDeleteLanguage = async () => { if (!languageToDelete) return; const { error } = await supabase.from('resume_languages').delete().eq('id', languageToDelete.id); if (error) { toast({ title: "Error deleting language", description: error.message, variant: "destructive" }); } else { toast({ title: "Success", description: "Language deleted." }); fetchLanguages(); router.refresh(); } setLanguageToDelete(null); setShowLanguageDeleteConfirm(false); };
  const triggerLanguageDeleteConfirmation = (language: ResumeLanguage) => { setLanguageToDelete(language); setShowLanguageDeleteConfirm(true); };
  const handleOpenLanguageModal = (language?: ResumeLanguage) => { setCurrentLanguage(language || null); languageForm.reset(language ? {...language, icon_image_url: language.icon_image_url || '', sort_order: Number(language.sort_order ?? 0)} : { language_name: '', proficiency: '', icon_image_url: '', sort_order: 0 }); setIsLanguageModalOpen(true); };

  React.useEffect(() => {
    fetchResumeMeta(); fetchExperiences(); fetchEducationItems(); fetchKeySkillCategoriesAndSkills(); fetchLanguages();
  }, []);

  return (
    <>
      <Card className="shadow-lg mb-8">
        <CardHeader><CardTitle className="flex items-center justify-between">Manage General Resume Info <ResumeFileIcon className="h-6 w-6 text-primary" /></CardTitle><CardDescription>Update the overall resume description and downloadable PDF file.</CardDescription></CardHeader>
        <CardContent>{isLoadingResumeMeta ? <p className="text-center text-muted-foreground">Loading resume info...</p> : (
          <form onSubmit={resumeMetaForm.handleSubmit(onResumeMetaSubmit)} className="grid gap-6 py-4">
            <div><Label htmlFor="resumeDescription">Overall Resume Description</Label><Textarea id="resumeDescription" {...resumeMetaForm.register("description")} rows={4} placeholder="A brief summary or objective..." />{resumeMetaForm.formState.errors.description && <p className="text-destructive text-sm mt-1">{resumeMetaForm.formState.errors.description.message}</p>}</div>
            <div className="space-y-2"><Label htmlFor="resume_pdf_file">Resume PDF File</Label><div className="flex items-center gap-3"><Input id="resume_pdf_file" type="file" accept=".pdf" onChange={handleResumePdfFileChange} className="flex-grow"/><UploadCloud className="h-6 w-6 text-muted-foreground"/></div>{resumePdfFile && <p className="text-sm text-muted-foreground mt-1">New file: {resumePdfFile.name}</p>}{currentDbResumePdfUrl && !resumePdfFile && (<div className="mt-2 text-sm">Current PDF: <a href={currentDbResumePdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center"><LinkIcon className="mr-1 h-4 w-4" />View Current PDF</a></div>)}<div><Label htmlFor="resume_pdf_url_manual" className="text-xs text-muted-foreground">Or enter direct PDF URL (upload overrides)</Label><Input id="resume_pdf_url_manual" {...resumeMetaForm.register("resume_pdf_url")} placeholder="https://example.com/resume.pdf" />{resumeMetaForm.formState.errors.resume_pdf_url && <p className="text-destructive text-sm mt-1">{resumeMetaForm.formState.errors.resume_pdf_url.message}</p>}</div></div>
            <Button type="submit" className="w-full sm:w-auto justify-self-start" disabled={isLoadingResumeMeta}>{isLoadingResumeMeta ? 'Saving...' : 'Save Resume Info'}</Button>
          </form>
        )}</CardContent>
      </Card>

      <Card className="shadow-lg mb-8">
        <CardHeader><CardTitle className="flex items-center justify-between">Manage Resume Sections<ListChecks className="h-6 w-6 text-primary" /></CardTitle><CardDescription>Update your professional experience, education, skills, and languages.</CardDescription></CardHeader>
        <CardContent>
          <Tabs defaultValue="experience" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
              <TabsTrigger value="experience"><Briefcase className="mr-2 h-4 w-4 inline-block" />Experience</TabsTrigger>
              <TabsTrigger value="education"><GraduationCap className="mr-2 h-4 w-4 inline-block" />Education</TabsTrigger>
              <TabsTrigger value="skills"><ListChecks className="mr-2 h-4 w-4 inline-block" />Key Skills</TabsTrigger>
              <TabsTrigger value="languages"><LanguagesIcon className="mr-2 h-4 w-4 inline-block" />Languages</TabsTrigger>
            </TabsList>

            {/* Experience Tab Content */}
            <TabsContent value="experience">
              <div className="text-right mb-4"><Button onClick={() => handleOpenExperienceModal()} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Add Experience</Button></div>
              {isLoadingExperiences ? <p className="text-center text-muted-foreground">Loading experiences...</p> : experiences.length === 0 ? <p className="text-muted-foreground text-center py-4">No experience entries yet.</p> : (
                <div className="space-y-4">{experiences.map((exp) => (<Card key={exp.id} className="p-4"><div className="flex justify-between items-start gap-4"><div className="flex items-center gap-3 flex-grow min-w-0"><IconPreview url={exp.icon_image_url} alt={exp.job_title} DefaultIcon={Building} className="h-6 w-6 p-0.5" /><div className="flex-grow min-w-0"><h4 className="font-semibold text-md truncate" title={exp.job_title}>{exp.job_title}</h4><p className="text-sm text-muted-foreground truncate" title={`${exp.company_name} (${exp.date_range || ''})`}>{exp.company_name} ({exp.date_range || 'Date N/A'}) <span className="text-xs text-muted-foreground/70">(Sort: {exp.sort_order ?? 0})</span></p></div></div><div className="flex space-x-2 flex-shrink-0"><Button variant="outline" size="sm" onClick={() => handleOpenExperienceModal(exp)}><Edit className="mr-1 h-3 w-3" />Edit</Button><Button variant="destructive" size="sm" onClick={() => triggerExperienceDeleteConfirmation(exp)}><Trash2 className="mr-1 h-3 w-3" />Delete</Button></div></div></Card>))}</div>)}
            </TabsContent>
            
            {/* Education Tab Content */}
            <TabsContent value="education">
              <div className="text-right mb-4"><Button onClick={() => handleOpenEducationModal()} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Add Education</Button></div>
              {isLoadingEducation ? <p className="text-center text-muted-foreground">Loading education...</p> : educationItems.length === 0 ? <p className="text-muted-foreground text-center py-4">No education entries yet.</p> : (
                <div className="space-y-4">{educationItems.map((edu) => (<Card key={edu.id} className="p-4"><div className="flex justify-between items-start gap-4"><div className="flex items-center gap-3 flex-grow min-w-0"><IconPreview url={edu.icon_image_url} alt={edu.degree_or_certification} DefaultIcon={GraduationCap} className="h-6 w-6 p-0.5"/><div className="flex-grow min-w-0"><h4 className="font-semibold text-md truncate" title={edu.degree_or_certification}>{edu.degree_or_certification}</h4><p className="text-sm text-muted-foreground truncate" title={`${edu.institution_name} (${edu.date_range || ''})`}>{edu.institution_name} ({edu.date_range || 'Date N/A'}) <span className="text-xs text-muted-foreground/70">(Sort: {edu.sort_order ?? 0})</span></p></div></div><div className="flex space-x-2 flex-shrink-0"><Button variant="outline" size="sm" onClick={() => handleOpenEducationModal(edu)}><Edit className="mr-1 h-3 w-3" />Edit</Button><Button variant="destructive" size="sm" onClick={() => triggerEducationDeleteConfirmation(edu)}><Trash2 className="mr-1 h-3 w-3" />Delete</Button></div></div></Card>))}</div>)}
            </TabsContent>

            {/* Key Skills Tab Content */}
            <TabsContent value="skills">
                <div className="text-right mb-4"><Button onClick={() => handleOpenSkillCategoryModal()} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Add Skill Category</Button></div>
                {isLoadingKeySkillCategories ? <p className="text-center text-muted-foreground">Loading skill categories...</p> : keySkillCategories.length === 0 ? <p className="text-muted-foreground text-center py-4">No skill categories yet.</p> : (
                <Accordion type="single" collapsible className="w-full">
                    {keySkillCategories.map((category) => (
                    <AccordionItem value={category.id} key={category.id}>
                         <AccordionPrimitive.Header className="flex items-center justify-between py-2 px-4 group border-b hover:bg-muted/50 transition-colors">
                            <ShadCNAccordionTrigger asChild className="flex-grow cursor-pointer py-2 hover:no-underline">
                                <div className="flex items-center gap-3"><IconPreview url={category.icon_image_url} alt={category.category_name} DefaultIcon={TypeIcon} className="h-5 w-5 p-0" /><span className="font-medium text-lg">{category.category_name}</span><Badge variant="outline" className="ml-2">{category.skills?.length || 0} skills</Badge><ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180 ml-auto text-muted-foreground group-hover:text-foreground" /></div>
                            </ShadCNAccordionTrigger>
                            <div className="flex space-x-1.5 shrink-0 ml-3 pl-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleOpenSkillCategoryModal(category);}}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={(e) => { e.stopPropagation(); triggerSkillCategoryDeleteConfirmation(category);}}><Trash2 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={(e) => { e.stopPropagation(); handleOpenSkillModal(category.id);}}><PlusCircle className="h-4 w-4"/></Button></div>
                        </AccordionPrimitive.Header>
                        <AccordionContent className="bg-muted/20 p-4 rounded-b-md">
                            {category.skills && category.skills.length > 0 ? (<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">{category.skills.map(skill => (<Card key={skill.id} className="p-3 shadow-sm hover:shadow-md transition-shadow"><div className="flex items-center justify-between"><span className="text-sm font-medium">{skill.skill_name}</span><div className="flex space-x-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenSkillModal(category.id, skill)}><Edit className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => triggerSkillDeleteConfirmation(skill)}><Trash2 className="h-3.5 w-3.5" /></Button></div></div></Card>))}</div>) : (<p className="text-sm text-muted-foreground text-center py-4">No skills in this category. <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => handleOpenSkillModal(category.id)}>Add one?</Button></p>)}
                        </AccordionContent>
                    </AccordionItem>
                    ))}
                </Accordion>
                )}
            </TabsContent>

            {/* Languages Tab Content */}
            <TabsContent value="languages">
                <div className="text-right mb-4"><Button onClick={() => handleOpenLanguageModal()} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Add Language</Button></div>
                {isLoadingLanguages ? <p className="text-center text-muted-foreground">Loading languages...</p> : languages.length === 0 ? <p className="text-muted-foreground text-center py-4">No language entries yet.</p> : (
                <div className="space-y-4">{languages.map((lang) => (<Card key={lang.id} className="p-4"><div className="flex justify-between items-start gap-4"><div className="flex items-center gap-3 flex-grow min-w-0"><IconPreview url={lang.icon_image_url} alt={lang.language_name} DefaultIcon={LanguagesIcon} className="h-6 w-6 p-0.5" /><div className="flex-grow min-w-0"><h4 className="font-semibold text-md truncate" title={lang.language_name}>{lang.language_name}</h4><p className="text-sm text-muted-foreground truncate" title={lang.proficiency || ''}>{lang.proficiency || 'Proficiency N/A'} <span className="text-xs text-muted-foreground/70">(Sort: {lang.sort_order ?? 0})</span></p></div></div><div className="flex space-x-2 flex-shrink-0"><Button variant="outline" size="sm" onClick={() => handleOpenLanguageModal(lang)}><Edit className="mr-1 h-3 w-3" />Edit</Button><Button variant="destructive" size="sm" onClick={() => triggerLanguageDeleteConfirmation(lang)}><Trash2 className="mr-1 h-3 w-3" />Delete</Button></div></div></Card>))}</div>)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modals & Dialogs */}
      {/* Experience Modal & Delete Dialog */}
      <Dialog open={isExperienceModalOpen} onOpenChange={(isOpen) => { setIsExperienceModalOpen(isOpen); if (!isOpen) setCurrentExperience(null); }}>
        <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{currentExperience ? 'Edit Experience' : 'Add New Experience'}</DialogTitle></DialogHeader>
          <form onSubmit={experienceForm.handleSubmit(onExperienceSubmit)} className="grid gap-4 py-4">
            <ScrollArea className="max-h-[70vh] p-1 pr-2"><div className="grid gap-4 p-3">
              <div className="space-y-1.5"><Label htmlFor="job_title">Job Title</Label><Input id="job_title" {...experienceForm.register("job_title")} />{experienceForm.formState.errors.job_title && <p className="text-destructive text-sm mt-1">{experienceForm.formState.errors.job_title.message}</p>}</div>
              <div className="space-y-1.5"><Label htmlFor="company_name">Company Name</Label><Input id="company_name" {...experienceForm.register("company_name")} />{experienceForm.formState.errors.company_name && <p className="text-destructive text-sm mt-1">{experienceForm.formState.errors.company_name.message}</p>}</div>
              <div className="space-y-1.5"><Label htmlFor="exp_date_range">Date Range</Label><Input id="exp_date_range" {...experienceForm.register("date_range")} /></div>
              <div className="space-y-1.5"><Label htmlFor="description_points">Description (one point per line)</Label><Textarea id="description_points" {...experienceForm.register("description_points")} rows={5} /></div>
              <div className="space-y-1.5"><Label htmlFor="exp_icon_image_url">Icon Image URL (Optional)</Label><Input id="exp_icon_image_url" {...experienceForm.register("icon_image_url")} placeholder="https://..." />{experienceForm.formState.errors.icon_image_url && <p className="text-destructive text-sm mt-1">{experienceForm.formState.errors.icon_image_url.message}</p>}{watchedExperienceIconUrl && (<div className="mt-2 flex items-center gap-2"><span className="text-xs">Preview:</span><IconPreview url={watchedExperienceIconUrl} DefaultIcon={Building} className="h-5 w-5 p-0"/></div>)}</div>
              <div className="space-y-1.5"><Label htmlFor="exp_sort_order">Sort Order</Label><Input id="exp_sort_order" type="number" {...experienceForm.register("sort_order")} /></div>
            </div></ScrollArea>
            <DialogFooter className="pt-4 border-t"><DialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button></DialogClose><Button type="submit" className="w-full sm:w-auto">{currentExperience ? 'Save Changes' : 'Add Experience'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={showExperienceDeleteConfirm} onOpenChange={setShowExperienceDeleteConfirm}><AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground"><AlertDialogPrimitiveHeader><AlertDialogPrimitiveTitle className="text-destructive-foreground">Delete Experience: {experienceToDelete?.job_title}?</AlertDialogPrimitiveTitle><AlertDialogDescription className="text-destructive-foreground/90">This cannot be undone.</AlertDialogDescription></AlertDialogPrimitiveHeader><AlertDialogPrimitiveFooter><AlertDialogCancel onClick={() => { setExperienceToDelete(null); setShowExperienceDeleteConfirm(false); }} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteExperience} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90")}>Delete</AlertDialogAction></AlertDialogPrimitiveFooter></AlertDialogContent></AlertDialog>

      {/* Education Modal & Delete Dialog */}
      <Dialog open={isEducationModalOpen} onOpenChange={(isOpen) => { setIsEducationModalOpen(isOpen); if (!isOpen) setCurrentEducation(null); }}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{currentEducation ? 'Edit Education' : 'Add New Education'}</DialogTitle></DialogHeader><form onSubmit={educationForm.handleSubmit(onEducationSubmit)} className="grid gap-4 py-4"><ScrollArea className="max-h-[70vh] p-1 pr-2"><div className="grid gap-4 p-3"><div className="space-y-1.5"><Label htmlFor="degree_or_certification">Degree/Certification</Label><Input id="degree_or_certification" {...educationForm.register("degree_or_certification")} />{educationForm.formState.errors.degree_or_certification && <p className="text-destructive text-sm mt-1">{educationForm.formState.errors.degree_or_certification.message}</p>}</div><div className="space-y-1.5"><Label htmlFor="institution_name">Institution Name</Label><Input id="institution_name" {...educationForm.register("institution_name")} />{educationForm.formState.errors.institution_name && <p className="text-destructive text-sm mt-1">{educationForm.formState.errors.institution_name.message}</p>}</div><div className="space-y-1.5"><Label htmlFor="edu_date_range">Date Range</Label><Input id="edu_date_range" {...educationForm.register("date_range")} /></div><div className="space-y-1.5"><Label htmlFor="edu_description">Description (Optional)</Label><Textarea id="edu_description" {...educationForm.register("description")} rows={3} /></div><div className="space-y-1.5"><Label htmlFor="edu_icon_image_url">Icon Image URL (Optional)</Label><Input id="edu_icon_image_url" {...educationForm.register("icon_image_url")} placeholder="https://..." />{educationForm.formState.errors.icon_image_url && <p className="text-destructive text-sm mt-1">{educationForm.formState.errors.icon_image_url.message}</p>}{watchedEducationIconUrl && (<div className="mt-2 flex items-center gap-2"><span className="text-xs">Preview:</span><IconPreview url={watchedEducationIconUrl} DefaultIcon={GraduationCap} className="h-5 w-5 p-0"/></div>)}</div><div className="space-y-1.5"><Label htmlFor="edu_sort_order">Sort Order</Label><Input id="edu_sort_order" type="number" {...educationForm.register("sort_order")} /></div></div></ScrollArea><DialogFooter className="pt-4 border-t"><DialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button></DialogClose><Button type="submit" className="w-full sm:w-auto">{currentEducation ? 'Save Changes' : 'Add Education'}</Button></DialogFooter></form></DialogContent></Dialog>
      <AlertDialog open={showEducationDeleteConfirm} onOpenChange={setShowEducationDeleteConfirm}><AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground"><AlertDialogPrimitiveHeader><AlertDialogPrimitiveTitle className="text-destructive-foreground">Delete Education: {educationToDelete?.degree_or_certification}?</AlertDialogPrimitiveTitle><AlertDialogDescription className="text-destructive-foreground/90">This cannot be undone.</AlertDialogDescription></AlertDialogPrimitiveHeader><AlertDialogPrimitiveFooter><AlertDialogCancel onClick={() => { setEducationToDelete(null); setShowEducationDeleteConfirm(false);}} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteEducation} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90")}>Delete</AlertDialogAction></AlertDialogPrimitiveFooter></AlertDialogContent></AlertDialog>

      {/* Skill Category Modal & Delete Dialog */}
      <Dialog open={isSkillCategoryModalOpen} onOpenChange={(isOpen) => { setIsSkillCategoryModalOpen(isOpen); if (!isOpen) setCurrentSkillCategory(null); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{currentSkillCategory ? 'Edit Skill Category' : 'Add Skill Category'}</DialogTitle></DialogHeader><form onSubmit={skillCategoryForm.handleSubmit(onSkillCategorySubmit)} className="grid gap-4 py-4"><ScrollArea className="max-h-[70vh] p-1 pr-2"><div className="grid gap-4 p-3"><div className="space-y-1.5"><Label htmlFor="category_name">Category Name</Label><Input id="category_name" {...skillCategoryForm.register("category_name")} />{skillCategoryForm.formState.errors.category_name && <p className="text-destructive text-sm mt-1">{skillCategoryForm.formState.errors.category_name.message}</p>}</div><div className="space-y-1.5"><Label htmlFor="cat_icon_image_url">Icon Image URL (Optional)</Label><Input id="cat_icon_image_url" {...skillCategoryForm.register("icon_image_url")} placeholder="https://..." />{skillCategoryForm.formState.errors.icon_image_url && <p className="text-destructive text-sm mt-1">{skillCategoryForm.formState.errors.icon_image_url.message}</p>}{watchedSkillCategoryIconUrl && (<div className="mt-2 flex items-center gap-2"><span className="text-xs">Preview:</span><IconPreview url={watchedSkillCategoryIconUrl} DefaultIcon={TypeIcon} className="h-5 w-5 p-0"/></div>)}</div><div className="space-y-1.5"><Label htmlFor="cat_sort_order">Sort Order</Label><Input id="cat_sort_order" type="number" {...skillCategoryForm.register("sort_order")} /></div></div></ScrollArea><DialogFooter className="pt-4 border-t"><DialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button></DialogClose><Button type="submit" className="w-full sm:w-auto">{currentSkillCategory ? 'Save Changes' : 'Add Category'}</Button></DialogFooter></form></DialogContent></Dialog>
      <AlertDialog open={showSkillCategoryDeleteConfirm} onOpenChange={setShowSkillCategoryDeleteConfirm}><AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground"><AlertDialogPrimitiveHeader><AlertDialogPrimitiveTitle className="text-destructive-foreground">Delete Category: {skillCategoryToDelete?.category_name}?</AlertDialogPrimitiveTitle><AlertDialogDescription className="text-destructive-foreground/90">This will delete the category and all skills within it (due to database cascade). This action cannot be undone.</AlertDialogDescription></AlertDialogPrimitiveHeader><AlertDialogPrimitiveFooter><AlertDialogCancel onClick={() => { setSkillCategoryToDelete(null); setShowSkillCategoryDeleteConfirm(false);}} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteSkillCategory} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90")}>Delete Category</AlertDialogAction></AlertDialogPrimitiveFooter></AlertDialogContent></AlertDialog>
      
      {/* Skill Modal & Delete Dialog */}
      <Dialog open={isSkillModalOpen} onOpenChange={(isOpen) => { setIsSkillModalOpen(isOpen); if (!isOpen) { setCurrentSkill(null); setParentKeySkillCategoryId(null); } }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{currentSkill ? 'Edit Skill' : 'Add New Skill'}</DialogTitle></DialogHeader><form onSubmit={skillForm.handleSubmit(onSkillSubmit)} className="grid gap-4 py-4"><ScrollArea className="max-h-[70vh] p-1 pr-2"><div className="grid gap-4 p-3"><Input type="hidden" {...skillForm.register("category_id")} /><div className="space-y-1.5"><Label htmlFor="skill_name">Skill Name</Label><Input id="skill_name" {...skillForm.register("skill_name")} />{skillForm.formState.errors.skill_name && <p className="text-destructive text-sm mt-1">{skillForm.formState.errors.skill_name.message}</p>}</div></div></ScrollArea><DialogFooter className="pt-4 border-t"><DialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button></DialogClose><Button type="submit" className="w-full sm:w-auto">{currentSkill ? 'Save Changes' : 'Add Skill'}</Button></DialogFooter></form></DialogContent></Dialog>
      <AlertDialog open={showSkillDeleteConfirm} onOpenChange={setShowSkillDeleteConfirm}><AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground"><AlertDialogPrimitiveHeader><AlertDialogPrimitiveTitle className="text-destructive-foreground">Delete Skill: {skillToDelete?.skill_name}?</AlertDialogPrimitiveTitle><AlertDialogDescription className="text-destructive-foreground/90">This action cannot be undone.</AlertDialogDescription></AlertDialogPrimitiveHeader><AlertDialogPrimitiveFooter><AlertDialogCancel onClick={() => { setSkillToDelete(null); setShowSkillDeleteConfirm(false);}} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteSkill} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90")}>Delete Skill</AlertDialogAction></AlertDialogPrimitiveFooter></AlertDialogContent></AlertDialog>

      {/* Language Modal & Delete Dialog */}
      <Dialog open={isLanguageModalOpen} onOpenChange={(isOpen) => { setIsLanguageModalOpen(isOpen); if (!isOpen) setCurrentLanguage(null); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{currentLanguage ? 'Edit Language' : 'Add New Language'}</DialogTitle></DialogHeader><form onSubmit={languageForm.handleSubmit(onLanguageSubmit)} className="grid gap-4 py-4"><ScrollArea className="max-h-[70vh] p-1 pr-2"><div className="grid gap-4 p-3"><div className="space-y-1.5"><Label htmlFor="language_name">Language Name</Label><Input id="language_name" {...languageForm.register("language_name")} />{languageForm.formState.errors.language_name && <p className="text-destructive text-sm mt-1">{languageForm.formState.errors.language_name.message}</p>}</div><div className="space-y-1.5"><Label htmlFor="proficiency">Proficiency (e.g., Native, Fluent, Conversational)</Label><Input id="proficiency" {...languageForm.register("proficiency")} /></div><div className="space-y-1.5"><Label htmlFor="lang_icon_image_url">Icon Image URL (Optional)</Label><Input id="lang_icon_image_url" {...languageForm.register("icon_image_url")} placeholder="https://..." />{languageForm.formState.errors.icon_image_url && <p className="text-destructive text-sm mt-1">{languageForm.formState.errors.icon_image_url.message}</p>}{watchedLanguageIconUrl && (<div className="mt-2 flex items-center gap-2"><span className="text-xs">Preview:</span><IconPreview url={watchedLanguageIconUrl} DefaultIcon={LanguagesIcon} className="h-5 w-5 p-0"/></div>)}</div><div className="space-y-1.5"><Label htmlFor="lang_sort_order">Sort Order</Label><Input id="lang_sort_order" type="number" {...languageForm.register("sort_order")} /></div></div></ScrollArea><DialogFooter className="pt-4 border-t"><DialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button></DialogClose><Button type="submit" className="w-full sm:w-auto">{currentLanguage ? 'Save Changes' : 'Add Language'}</Button></DialogFooter></form></DialogContent></Dialog>
      <AlertDialog open={showLanguageDeleteConfirm} onOpenChange={setShowLanguageDeleteConfirm}><AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground"><AlertDialogPrimitiveHeader><AlertDialogPrimitiveTitle className="text-destructive-foreground">Delete Language: {languageToDelete?.language_name}?</AlertDialogPrimitiveTitle><AlertDialogDescription className="text-destructive-foreground/90">This action cannot be undone.</AlertDialogDescription></AlertDialogPrimitiveHeader><AlertDialogPrimitiveFooter><AlertDialogCancel onClick={() => { setLanguageToDelete(null); setShowLanguageDeleteConfirm(false);}} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteLanguage} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90")}>Delete Language</AlertDialogAction></AlertDialogPrimitiveFooter></AlertDialogContent></AlertDialog>
    </>
  );
}

    

    