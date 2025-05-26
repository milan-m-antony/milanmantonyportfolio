"use client";

import React, { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UploadCloud, PlusCircle, Edit, Trash2, Package as DefaultCategoryIcon, Cpu as DefaultSkillIcon, ChevronDown, Tag as TagIcon } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { SkillCategory, Skill as SkillType, User as SupabaseUser } from '@/types/supabase';
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
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
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
import { ScrollArea } from '@/components/ui/scroll-area';


const skillCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Category name must be at least 2 characters"),
  icon_image_url: z.string().url("Must be a valid URL if an image is provided.").optional().or(z.literal("")).nullable(),
  sort_order: z.coerce.number().optional().nullable(),
});
type SkillCategoryFormData = z.infer<typeof skillCategorySchema>;

const skillSchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid("Category ID is required"),
  name: z.string().min(1, "Skill name must be at least 1 character"),
  icon_image_url: z.string().url("Must be a valid URL if an image is provided.").optional().or(z.literal("")).nullable(),
  description: z.string().optional().nullable(),
});
type SkillFormData = z.infer<typeof skillSchema>;

interface MappedSkillCategory extends SkillCategory {
  skills: SkillType[];
}

const IconPreview = ({ url, alt = "Icon Preview", DefaultIcon = TagIcon }: { url?: string | null; alt?: string, DefaultIcon?: React.ElementType }) => {
  if (url && typeof url === 'string' && url.trim() !== '') {
    return (
      <div className="relative h-5 w-5 rounded-sm overflow-hidden border bg-muted flex-shrink-0">
        <Image src={url} alt={alt} fill className="object-contain" sizes="20px" />
      </div>
    );
  }
  return <DefaultIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />;
};


export default function SkillsManager() {
  const router = useRouter();
  const { toast } = useToast();

  const [skillCategories, setSkillCategories] = useState<MappedSkillCategory[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<MappedSkillCategory | null>(null);
  const [currentDbCategoryIconUrl, setCurrentDbCategoryIconUrl] = useState<string | null>(null);
  const [showCategoryDeleteConfirm, setShowCategoryDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<MappedSkillCategory | null>(null);
  const [categoryIconFile, setCategoryIconFile] = useState<File | null>(null);
  const [categoryIconPreview, setCategoryIconPreview] = useState<string | null>(null);

  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [currentSkill, setCurrentSkill] = useState<SkillType | null>(null);
  const [currentDbSkillIconUrl, setCurrentDbSkillIconUrl] = useState<string | null>(null);
  const [parentCategoryIdForNewSkill, setParentCategoryIdForNewSkill] = useState<string | null>(null);
  const [showSkillDeleteConfirm, setShowSkillDeleteConfirm] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<SkillType | null>(null);
  const [skillIconFile, setSkillIconFile] = useState<File | null>(null);
  const [skillIconPreview, setSkillIconPreview] = useState<string | null>(null);

  const categoryForm = useForm<SkillCategoryFormData>({
    resolver: zodResolver(skillCategorySchema),
    defaultValues: { name: '', icon_image_url: '', sort_order: 0 }
  });
  const skillForm = useForm<SkillFormData>({
    resolver: zodResolver(skillSchema),
    defaultValues: { category_id: '', name: '', icon_image_url: '', description: '' }
  });

  const currentCategoryIconUrlForForm = categoryForm.watch('icon_image_url');
  const currentSkillIconUrlForForm = skillForm.watch('icon_image_url');

  useEffect(() => { 
    fetchSkillCategories(); 
    const authListener = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setCurrentUser(session?.user ?? null);
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });
    return () => {
      authListener.data.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => { let newPreviewUrl: string | null = null; if (categoryIconFile) { const reader = new FileReader(); reader.onloadend = () => setCategoryIconPreview(reader.result as string); reader.readAsDataURL(categoryIconFile); return; } else if (currentCategoryIconUrlForForm && currentCategoryIconUrlForForm.trim() !== '') { newPreviewUrl = currentCategoryIconUrlForForm; } else if (currentDbCategoryIconUrl) { newPreviewUrl = currentDbCategoryIconUrl; } setCategoryIconPreview(newPreviewUrl); }, [categoryIconFile, currentCategoryIconUrlForForm, currentDbCategoryIconUrl]);
  useEffect(() => { let newPreviewUrl: string | null = null; if (skillIconFile) { const reader = new FileReader(); reader.onloadend = () => setSkillIconPreview(reader.result as string); reader.readAsDataURL(skillIconFile); return; } else if (currentSkillIconUrlForForm && currentSkillIconUrlForForm.trim() !== '') { newPreviewUrl = currentSkillIconUrlForForm; } else if (currentDbSkillIconUrl) { newPreviewUrl = currentDbSkillIconUrl; } setSkillIconPreview(newPreviewUrl); }, [skillIconFile, currentSkillIconUrlForForm, currentDbSkillIconUrl]);


  const fetchSkillCategories = async () => {
    setIsLoadingSkills(true);
    const { data, error: fetchError } = await supabase
      .from('skill_categories')
      .select(` id, name, icon_image_url, sort_order, created_at, skills (id, name, icon_image_url, description, category_id) `)
      .order('sort_order', { ascending: true })
      .order('name', { foreignTable: 'skills', ascending: true }); // Order skills within categories

    if (fetchError) {
      toast({ title: "Error", description: `Could not fetch skills: ${fetchError.message}`, variant: "destructive" });
      setSkillCategories([]);
    } else if (data) {
      const mappedData: MappedSkillCategory[] = data.map(cat => ({
        id: cat.id, name: cat.name, iconImageUrl: cat.icon_image_url, sort_order: cat.sort_order,
        skills: (cat.skills || []).map((s: any) => ({ id: s.id, name: s.name, iconImageUrl: s.icon_image_url, description: s.description, categoryId: s.category_id, })),
      }));
      setSkillCategories(mappedData);
    }
    setIsLoadingSkills(false);
  };

  const handleCategoryIconFileChange = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files?.[0]) { setCategoryIconFile(event.target.files[0]); categoryForm.setValue('icon_image_url', ''); } else { setCategoryIconFile(null); const formUrl = categoryForm.getValues('icon_image_url'); setCategoryIconPreview(formUrl && formUrl.trim() !== '' ? formUrl : currentDbCategoryIconUrl || null);}};
  const handleSkillIconFileChange = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files?.[0]) { setSkillIconFile(event.target.files[0]); skillForm.setValue('icon_image_url', ''); } else { setSkillIconFile(null); const formUrl = skillForm.getValues('icon_image_url'); setSkillIconPreview(formUrl && formUrl.trim() !== '' ? formUrl : currentDbSkillIconUrl || null);}};

  const onCategorySubmit: SubmitHandler<SkillCategoryFormData> = async (formData) => {
    let iconUrlToSave = formData.icon_image_url; 
    let oldImageStoragePathToDelete: string | null = null;
    const existingCategoryIconUrl = currentCategory?.iconImageUrl;

    if (existingCategoryIconUrl) { try { const url = new URL(existingCategoryIconUrl); if (url.pathname.includes('/category-icons/')) { const pathParts = url.pathname.split('/category-icons/'); if (pathParts.length > 1 && !pathParts[1].startsWith('http')) { oldImageStoragePathToDelete = pathParts[1]; } } } catch (e) { console.warn("Could not parse existingCategoryIconUrl:", existingCategoryIconUrl);}}
    
    if (categoryIconFile) {
      const fileExt = categoryIconFile.name.split('.').pop(); const fileName = `category_${Date.now()}.${fileExt}`; const filePath = `${fileName}`;
      toast({ title: "Uploading Category Icon", description: "Please wait..." });
      const { error: uploadError } = await supabase.storage.from('category-icons').upload(filePath, categoryIconFile, { cacheControl: '3600', upsert: false });
      if (uploadError) { toast({ title: "Upload Error", description: `Failed to upload category icon: ${uploadError.message}`, variant: "destructive" }); return; }
      const { data: publicUrlData } = supabase.storage.from('category-icons').getPublicUrl(filePath);
      if (!publicUrlData?.publicUrl) { toast({ title: "Error", description: "Failed to get public URL for category icon.", variant: "destructive" }); return; }
      iconUrlToSave = publicUrlData.publicUrl;
    } else if (formData.icon_image_url === '' && existingCategoryIconUrl) { iconUrlToSave = null; }

    const categoryDataToSave = { name: formData.name, icon_image_url: iconUrlToSave || null, sort_order: formData.sort_order === null || formData.sort_order === undefined ? 0 : Number(formData.sort_order), };
    
    if (formData.id) {
      const { error: updateError, data: updateData } = await supabase.from('skill_categories').update(categoryDataToSave).eq('id', formData.id).select().single();
      if (updateError) { toast({ title: "Error updating category", description: updateError.message, variant: "destructive" }); } 
      else { 
        toast({ title: "Success", description: "Category updated." }); 
        if (currentUser && updateData) {
          await supabase.from('admin_activity_log').insert({
            action_type: 'SKILL_CATEGORY_UPDATED',
            description: `Skill category "${updateData.name}" was updated.`,
            user_identifier: currentUser.id,
            details: { categoryId: updateData.id }
          });
          window.dispatchEvent(new CustomEvent('adminActivityAdded'));
        }
        if (oldImageStoragePathToDelete && iconUrlToSave !== existingCategoryIconUrl) { const { error: storageDeleteError } = await supabase.storage.from('category-icons').remove([oldImageStoragePathToDelete]); if (storageDeleteError) console.warn("Error deleting old category icon from storage:", storageDeleteError);}
      }
    } else {
      const { error: insertError, data: insertData } = await supabase.from('skill_categories').insert(categoryDataToSave).select().single();
      if (insertError) { toast({ title: "Error adding category", description: insertError.message, variant: "destructive" }); } 
      else { 
        toast({ title: "Success", description: "Category added." }); 
        if (currentUser && insertData) {
          await supabase.from('admin_activity_log').insert({
            action_type: 'SKILL_CATEGORY_CREATED',
            description: `Skill category "${insertData.name}" was created.`,
            user_identifier: currentUser.id,
            details: { categoryId: insertData.id }
          });
          window.dispatchEvent(new CustomEvent('adminActivityAdded'));
        }
      }
    }
    fetchSkillCategories(); setIsCategoryModalOpen(false); setCategoryIconFile(null);
  };

  const onSkillSubmit: SubmitHandler<SkillFormData> = async (formData) => {
    let iconUrlToSave = formData.icon_image_url;
    let oldImageStoragePathToDelete: string | null = null;
    const existingSkillIconUrl = currentSkill?.iconImageUrl;

    if(existingSkillIconUrl) { try { const url = new URL(existingSkillIconUrl); if (url.pathname.includes('/skill-icons/')) { const pathParts = url.pathname.split('/skill-icons/'); if (pathParts.length > 1 && !pathParts[1].startsWith('http')) { oldImageStoragePathToDelete = pathParts[1]; } } } catch (e) { console.warn("Could not parse existingSkillIconUrl:", existingSkillIconUrl); }}

    if (skillIconFile) {
      const fileExt = skillIconFile.name.split('.').pop(); const fileName = `skill_${Date.now()}.${fileExt}`; const filePath = `${fileName}`;
      toast({ title: "Uploading Skill Icon", description: "Please wait..." });
      const { error: uploadError } = await supabase.storage.from('skill-icons').upload(filePath, skillIconFile, { cacheControl: '3600', upsert: false });
      if (uploadError) { toast({ title: "Upload Error", description: `Failed to upload skill icon: ${uploadError.message}`, variant: "destructive" }); return; }
      const { data: publicUrlData } = supabase.storage.from('skill-icons').getPublicUrl(filePath);
      if (!publicUrlData?.publicUrl) { toast({ title: "Error", description: "Failed to get public URL for skill icon.", variant: "destructive" }); return; }
      iconUrlToSave = publicUrlData.publicUrl;
    } else if (formData.icon_image_url === '' && existingSkillIconUrl) { iconUrlToSave = null; }
    
    const skillDataToSave = { category_id: formData.category_id, name: formData.name, icon_image_url: iconUrlToSave || null, description: formData.description || null, };

    if (formData.id) {
      const { error: updateError, data: updateData } = await supabase.from('skills').update(skillDataToSave).eq('id', formData.id).select().single();
      if (updateError) { toast({ title: "Error updating skill", description: updateError.message, variant: "destructive" }); } 
      else { 
        toast({ title: "Success", description: "Skill updated." }); 
        if (currentUser && updateData) {
          await supabase.from('admin_activity_log').insert({
            action_type: 'SKILL_UPDATED',
            description: `Skill "${updateData.name}" (in category ID: ${updateData.category_id}) was updated.`,
            user_identifier: currentUser.id,
            details: { skillId: updateData.id, categoryId: updateData.category_id }
          });
          window.dispatchEvent(new CustomEvent('adminActivityAdded'));
        }
        if (oldImageStoragePathToDelete && iconUrlToSave !== existingSkillIconUrl) { const { error: storageDeleteError } = await supabase.storage.from('skill-icons').remove([oldImageStoragePathToDelete]); if (storageDeleteError) console.warn("Error deleting old skill icon from storage:", storageDeleteError);}}
    } else {
      const { error: insertError, data: insertData } = await supabase.from('skills').insert(skillDataToSave).select().single();
      if (insertError) { toast({ title: "Error adding skill", description: insertError.message, variant: "destructive" }); } 
      else { 
        toast({ title: "Success", description: "Skill added." }); 
        if (currentUser && insertData) {
          await supabase.from('admin_activity_log').insert({
            action_type: 'SKILL_CREATED',
            description: `Skill "${insertData.name}" (in category ID: ${insertData.category_id}) was created.`,
            user_identifier: currentUser.id,
            details: { skillId: insertData.id, categoryId: insertData.category_id }
          });
          window.dispatchEvent(new CustomEvent('adminActivityAdded'));
        }
      }
    }
    fetchSkillCategories(); setIsSkillModalOpen(false); setSkillIconFile(null);
  };

  const performDeleteCategory = async (categoryId: string) => {
    const category = skillCategories.find(cat => cat.id === categoryId);
    if (category && category.skills && category.skills.length > 0) { toast({ title: "Action Denied", description: "Cannot delete category with skills. Delete skills first.", variant: "destructive" }); setShowCategoryDeleteConfirm(false); setCategoryToDelete(null); return; }
    const categoryName = category?.name || 'Unknown Category';
    if (category?.iconImageUrl) { try {const url = new URL(category.iconImageUrl); const imagePath = url.pathname.split('/category-icons/')[1]; if (imagePath && !imagePath.startsWith('http')) { const {error: storageError} = await supabase.storage.from('category-icons').remove([imagePath]); if (storageError) console.warn("Error deleting category icon from storage:", storageError);}} catch(e){console.warn("Error parsing category icon URL for deletion", category.iconImageUrl)}}
    const { error } = await supabase.from('skill_categories').delete().eq('id', categoryId);
    if (error) { toast({ title: "Error deleting category", description: error.message, variant: "destructive" }); } 
    else { 
      toast({ title: "Success", description: "Category deleted." }); 
      if (currentUser) {
        await supabase.from('admin_activity_log').insert({
          action_type: 'SKILL_CATEGORY_DELETED',
          description: `Skill category "${categoryName}" (ID: ${categoryId}) was deleted.`,
          user_identifier: currentUser.id,
          details: { categoryId: categoryId, deletedName: categoryName }
        });
        window.dispatchEvent(new CustomEvent('adminActivityAdded'));
      }
      fetchSkillCategories();
    }
    setShowCategoryDeleteConfirm(false); setCategoryToDelete(null);
  };

  const performDeleteSkill = async (skillId: string) => {
    const skillToDeleteData = skillCategories.flatMap(cat => cat.skills).find(s => s.id === skillId);
    const skillName = skillToDeleteData?.name || 'Unknown Skill';
    const categoryId = skillToDeleteData?.categoryId || 'Unknown Category ID';

    if (skillToDeleteData?.iconImageUrl) { try {const url = new URL(skillToDeleteData.iconImageUrl); const imagePath = url.pathname.split('/skill-icons/')[1]; if (imagePath && !imagePath.startsWith('http')) { const {error: storageError} = await supabase.storage.from('skill-icons').remove([imagePath]); if (storageError) console.warn("Error deleting skill icon from storage:", storageError);}} catch(e){console.warn("Error parsing skill icon URL for deletion", skillToDeleteData.iconImageUrl)}}
    const { error } = await supabase.from('skills').delete().eq('id', skillId);
    if (error) { toast({ title: "Error deleting skill", description: error.message, variant: "destructive" }); } 
    else { 
      toast({ title: "Success", description: "Skill deleted." }); 
      if (currentUser) {
        await supabase.from('admin_activity_log').insert({
          action_type: 'SKILL_DELETED',
          description: `Skill "${skillName}" (ID: ${skillId}) from category ID ${categoryId} was deleted.`,
          user_identifier: currentUser.id,
          details: { skillId: skillId, categoryId: categoryId, deletedName: skillName }
        });
        window.dispatchEvent(new CustomEvent('adminActivityAdded'));
      }
      fetchSkillCategories();
    } 
    setShowSkillDeleteConfirm(false); setSkillToDelete(null);
  };

  const handleOpenCategoryModal = (category?: MappedSkillCategory) => { setCurrentCategory(category || null); setCurrentDbCategoryIconUrl(category?.iconImageUrl || null); categoryForm.reset(category ? { id: category.id, name: category.name, icon_image_url: category.iconImageUrl || '', sort_order: category.sort_order === null || category.sort_order === undefined ? 0 : Number(category.sort_order), } : { name: '', icon_image_url: '', sort_order: 0 }); setCategoryIconFile(null); setCategoryIconPreview(category?.iconImageUrl || null); setIsCategoryModalOpen(true); };
  const triggerCategoryDeleteConfirmation = (category: MappedSkillCategory) => { setCategoryToDelete(category); setShowCategoryDeleteConfirm(true); };
  const handleOpenSkillModal = (category_id: string, skill?: SkillType) => { setParentCategoryIdForNewSkill(category_id); setCurrentSkill(skill || null); setCurrentDbSkillIconUrl(skill?.iconImageUrl || null); skillForm.reset(skill ? { ...skill, category_id: skill.categoryId || category_id, icon_image_url: skill.iconImageUrl || '' } : { category_id: category_id, name: '', icon_image_url: '', description: ''}); setSkillIconFile(null); setSkillIconPreview(skill?.iconImageUrl || null); setIsSkillModalOpen(true); };
  const triggerSkillDeleteConfirmation = (skill: SkillType) => { setSkillToDelete(skill); setShowSkillDeleteConfirm(true); };

  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Manage Skills
        </CardTitle>
        <CardDescription>Organize your skills by categories and add individual skills with details.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 text-right">
            <Button onClick={() => handleOpenCategoryModal()}><PlusCircle className="mr-2 h-4 w-4" /> Add Category</Button>
        </div>
        {isLoadingSkills ? <p className="text-center text-muted-foreground">Loading skills & categories...</p> : skillCategories.length === 0 ? (<p className="text-center text-muted-foreground py-8">No skill categories found. Add one to get started.</p>) : (
          <Accordion type="single" collapsible className="w-full">
            {skillCategories.map((category) => (
              <AccordionItem value={category.id} key={category.id}>
                <AccordionPrimitive.Header className="flex items-center justify-between py-2 px-4 group border-b hover:bg-muted/50 transition-colors">
                    <AccordionPrimitive.Trigger asChild className="flex-grow cursor-pointer py-2 min-w-0">
                       <div className="flex items-center gap-3 min-w-0">
                           <IconPreview url={category.iconImageUrl} alt={category.name} DefaultIcon={DefaultCategoryIcon}/>
                           <span className="font-medium text-lg truncate">{category.name}</span>
                           <Badge variant="outline">{category.skills?.length || 0} skills</Badge>
                           <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180 ml-auto text-muted-foreground group-hover:text-foreground" />
                       </div>
                    </AccordionPrimitive.Trigger>
                    <div className="flex items-center ml-2 space-x-1 sm:space-x-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={(e) => { e.stopPropagation(); handleOpenCategoryModal(category);}}>
                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 hover:text-destructive" onClick={(e) => { e.stopPropagation(); triggerCategoryDeleteConfirmation(category);}}>
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 hover:text-primary" onClick={(e) => { e.stopPropagation(); handleOpenSkillModal(category.id);}}>
                            <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4"/>
                        </Button>
                    </div>
                  </AccordionPrimitive.Header>
                <AccordionContent className="bg-muted/20 p-4 rounded-b-md">
                  <div className="mb-4 flex justify-between items-center">
                    <h4 className="font-semibold text-lg">Skills in {category.name}</h4>
                    <Button variant="outline" size="sm" onClick={() => handleOpenSkillModal(category.id)}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Skill
                    </Button>
                  </div>
                  {category.skills && category.skills.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {category.skills.map(skill => (
                        <Card key={skill.id} className="p-3 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><IconPreview url={skill.iconImageUrl} alt={skill.name} DefaultIcon={DefaultSkillIcon} /><span className="text-sm font-medium">{skill.name}</span></div>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenSkillModal(category.id, skill)}><Edit className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => triggerSkillDeleteConfirmation(skill)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                          {skill.description && <p className="text-xs text-muted-foreground mt-1.5 pl-7">{skill.description}</p>}
                        </Card>
                      ))}
                    </div>
                  ) : (<p className="text-sm text-muted-foreground text-center py-4">No skills in this category yet. <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => handleOpenSkillModal(category.id)}>Add one?</Button></p>)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>

      {/* Category Modal */}
      <Dialog 
        open={isCategoryModalOpen} 
        onOpenChange={(isOpen: boolean) => {
          setIsCategoryModalOpen(isOpen);
          if (!isOpen) { 
            setCurrentCategory(null); 
            setCategoryIconFile(null); 
            categoryForm.reset(); 
            setCurrentDbCategoryIconUrl(null); 
          }
        }}
      >
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader><DialogTitle>{currentCategory?.id ? 'Edit Skill Category' : 'Add New Skill Category'}</DialogTitle></DialogHeader>
          <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="grid gap-4 py-4">
            <ScrollArea className="max-h-[70vh] p-1"><div className="grid gap-4 p-3">
                <div><Label htmlFor="categoryName">Name</Label><Input id="categoryName" {...categoryForm.register("name")} />{categoryForm.formState.errors.name && <p className="text-destructive text-sm mt-1">{categoryForm.formState.errors.name.message}</p>}</div>
                <div className="space-y-2">
                  <Label htmlFor="category_icon_file">Category Icon File (Optional)</Label>
                  <div className="flex items-center gap-3"><Input id="category_icon_file" type="file" accept="image/*" onChange={handleCategoryIconFileChange} className="flex-grow" /><UploadCloud className="h-6 w-6 text-muted-foreground" /></div>
                  {categoryIconPreview && (<div className="mt-2 p-2 border rounded-md bg-muted aspect-square relative w-24 h-24 mx-auto"><Image src={categoryIconPreview} alt="Icon preview" fill className="object-contain rounded"/></div>)}
                  <div><Label htmlFor="icon_image_url_category" className="text-xs text-muted-foreground">Or enter Icon Image URL (upload will override).</Label><Input id="icon_image_url_category" {...categoryForm.register("icon_image_url")} placeholder="https://example.com/icon.png" />{categoryForm.formState.errors.icon_image_url && <p className="text-destructive text-sm mt-1">{categoryForm.formState.errors.icon_image_url.message}</p>}</div>
                </div>
                <div><Label htmlFor="categorySortOrder">Sort Order</Label><Input id="categorySortOrder" type="number" {...categoryForm.register("sort_order")} /></div>
            </div></ScrollArea>
            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <DialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button></DialogClose>
                <Button type="submit" className="w-full sm:w-auto">{currentCategory?.id ? 'Save Changes' : 'Add Category'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Skill Modal */}
      <Dialog 
        open={isSkillModalOpen} 
        onOpenChange={(isOpen: boolean) => {
          setIsSkillModalOpen(isOpen);
          if (!isOpen) { 
            setCurrentSkill(null); 
            setParentCategoryIdForNewSkill(null); 
            setSkillIconFile(null); 
            skillForm.reset(); 
            setCurrentDbSkillIconUrl(null); 
          }
        }}
      >
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader><DialogTitle>{currentSkill?.id ? 'Edit Skill' : 'Add New Skill'}</DialogTitle></DialogHeader>
          <form onSubmit={skillForm.handleSubmit(onSkillSubmit)} className="grid gap-4 py-4">
            <ScrollArea className="max-h-[70vh] p-1"><div className="grid gap-4 p-3">
                <Input type="hidden" {...skillForm.register("category_id")} />
                <div><Label htmlFor="skillName">Name</Label><Input id="skillName" {...skillForm.register("name")} />{skillForm.formState.errors.name && <p className="text-destructive text-sm mt-1">{skillForm.formState.errors.name.message}</p>}</div>
                <div className="space-y-2">
                  <Label htmlFor="skill_icon_file">Skill Icon File (Optional)</Label>
                  <div className="flex items-center gap-3"><Input id="skill_icon_file" type="file" accept="image/*" onChange={handleSkillIconFileChange} className="flex-grow" /><UploadCloud className="h-6 w-6 text-muted-foreground"/></div>
                  {skillIconPreview && (<div className="mt-2 p-2 border rounded-md bg-muted aspect-square relative w-24 h-24 mx-auto"><Image src={skillIconPreview} alt="Icon preview" fill className="object-contain rounded"/></div>)}
                  <div><Label htmlFor="icon_image_url_skill" className="text-xs text-muted-foreground">Or enter Icon Image URL (upload will override).</Label><Input id="icon_image_url_skill" {...skillForm.register("icon_image_url")} placeholder="https://example.com/icon.png"/>{skillForm.formState.errors.icon_image_url && <p className="text-destructive text-sm mt-1">{skillForm.formState.errors.icon_image_url.message}</p>}</div>
                </div>
                <div><Label htmlFor="skillDescription">Description (Optional)</Label><Textarea id="skillDescription" {...skillForm.register("description")} /></div>
            </div></ScrollArea>
            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <DialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button></DialogClose>
                <Button type="submit" className="w-full sm:w-auto">{currentSkill?.id ? 'Save Changes' : 'Add Skill'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={showCategoryDeleteConfirm} onOpenChange={setShowCategoryDeleteConfirm}>
        <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
          <AlertDialogHeader><AlertDialogTitle className="text-destructive-foreground">Delete Category: {categoryToDelete?.name}?</AlertDialogTitle><AlertDialogDescription className="text-destructive-foreground/90">This will delete the category. Ensure all skills within are moved or deleted first (or DB cascade will delete them).</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowCategoryDeleteConfirm(false); setCategoryToDelete(null);}} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground", "hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => categoryToDelete && performDeleteCategory(categoryToDelete.id)} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive", "hover:bg-destructive-foreground/90")}>Delete Category</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Skill Confirmation */}
      <AlertDialog open={showSkillDeleteConfirm} onOpenChange={setShowSkillDeleteConfirm}>
        <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
          <AlertDialogHeader><AlertDialogTitle className="text-destructive-foreground">Delete Skill: {skillToDelete?.name}?</AlertDialogTitle><AlertDialogDescription className="text-destructive-foreground/90">This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowSkillDeleteConfirm(false); setSkillToDelete(null);}} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground", "hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => skillToDelete && performDeleteSkill(skillToDelete.id)} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive", "hover:bg-destructive-foreground/90")}>Delete Skill</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

