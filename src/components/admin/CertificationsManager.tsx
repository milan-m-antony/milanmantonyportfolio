
"use client";

import React, { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, PlusCircle, Edit, Trash2, Award as CertificateIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { Certification } from '@/types/supabase';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  AlertDialogTitle as AlertDialogPrimitiveTitle, // Renamed to avoid conflict
} from "@/components/ui/alert-dialog";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const certificationSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  issuer: z.string().min(2, "Issuer must be at least 2 characters"),
  date: z.string().min(1, "Date is required (e.g., March 2023)"),
  image_url: z.string().url("Must be a valid URL if provided, or will be set by upload.").optional().or(z.literal("")).nullable(),
  verify_url: z.string().url("Must be a valid URL if provided.").optional().or(z.literal("")).nullable(),
});
type CertificationFormData = z.infer<typeof certificationSchema>;

export default function CertificationsManager() {
  const router = useRouter();
  const { toast } = useToast();

  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [isLoadingCertifications, setIsLoadingCertifications] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentCertification, setCurrentCertification] = useState<Certification | null>(null);
  const [currentDbCertificationImageUrl, setCurrentDbCertificationImageUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [certificationToDelete, setCertificationToDelete] = useState<Certification | null>(null);
  
  const [certificationImageFile, setCertificationImageFile] = useState<File | null>(null);
  const [certificationImagePreview, setCertificationImagePreview] = useState<string | null>(null);

  const certificationForm = useForm<CertificationFormData>({
    resolver: zodResolver(certificationSchema),
    defaultValues: { title: '', issuer: '', date: '', image_url: '', verify_url: '' }
  });

  const watchedCertificationImageUrlInForm = certificationForm.watch('image_url');

  useEffect(() => {
    fetchCertifications();
  }, []);

  useEffect(() => {
    if (currentCertification) {
      certificationForm.reset({
        id: currentCertification.id,
        title: currentCertification.title,
        issuer: currentCertification.issuer,
        date: currentCertification.date,
        image_url: currentCertification.imageUrl || '',
        verify_url: currentCertification.verifyUrl || '',
      });
      setCurrentDbCertificationImageUrl(currentCertification.imageUrl || null);
      setCertificationImagePreview(currentCertification.imageUrl || null);
    } else {
      certificationForm.reset({ title: '', issuer: '', date: '', image_url: '', verify_url: '' });
      setCurrentDbCertificationImageUrl(null);
      setCertificationImagePreview(null);
    }
    setCertificationImageFile(null); // Clear any selected file when modal opens/closes or current cert changes
  }, [currentCertification, certificationForm, isModalOpen]); // Added isModalOpen

  useEffect(() => {
    let newPreviewUrl: string | null = null;
    if (certificationImageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCertificationImagePreview(reader.result as string);
      };
      reader.readAsDataURL(certificationImageFile);
      return; 
    } else if (watchedCertificationImageUrlInForm && watchedCertificationImageUrlInForm.trim() !== '') {
      newPreviewUrl = watchedCertificationImageUrlInForm;
    } else if (currentCertification && currentCertification.imageUrl) { // Use currentCertification as a fallback if form field is cleared
      newPreviewUrl = currentCertification.imageUrl;
    } else if (currentDbCertificationImageUrl) { // Fallback to the DB image if everything else is null
        newPreviewUrl = currentDbCertificationImageUrl;
    }
    setCertificationImagePreview(newPreviewUrl);
  }, [certificationImageFile, watchedCertificationImageUrlInForm, currentCertification, currentDbCertificationImageUrl]);


  const fetchCertifications = async () => {
    setIsLoadingCertifications(true);
    const { data, error: fetchError } = await supabase
      .from('certifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching certifications:', JSON.stringify(fetchError, null, 2));
      toast({ title: "Error", description: `Could not fetch certifications: ${fetchError.message}`, variant: "destructive" });
      setCertifications([]);
    } else if (data) {
      const mappedData: Certification[] = data.map(c => ({
        ...c,
        imageUrl: c.image_url,
        verifyUrl: c.verify_url,
      }));
      setCertifications(mappedData);
    } else {
      setCertifications([]);
    }
    setIsLoadingCertifications(false);
  };

  const handleCertificationImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setCertificationImageFile(event.target.files[0]);
      certificationForm.setValue('image_url', ''); 
    } else {
      setCertificationImageFile(null);
      // If file is removed, restore preview from form URL or DB URL
      const formUrl = certificationForm.getValues('image_url');
      setCertificationImagePreview(formUrl || currentDbCertificationImageUrl || null);
    }
  };
  
  const handleDeleteCurrentImage = () => {
    setCertificationImageFile(null);
    setCertificationImagePreview(null);
    certificationForm.setValue('image_url', ''); // Mark for removal on save
    toast({
        title: "Image Marked for Removal",
        description: "The current certificate image will be removed when you save changes.",
        variant: "default"
    });
  };


  const onSubmitCertification: SubmitHandler<CertificationFormData> = async (formData) => {
    setIsSubmitting(true);
    let imageUrlToSaveInDb = formData.image_url; 
    let oldImageStoragePathToDelete: string | null = null;

    // Determine if there was an old image in the DB
    if (currentDbCertificationImageUrl) {
        try {
            const url = new URL(currentDbCertificationImageUrl);
            if (url.pathname.includes('/certification-images/')) {
                const pathParts = url.pathname.split('/certification-images/');
                if (pathParts.length > 1 && !pathParts[1].startsWith('http')) { 
                    oldImageStoragePathToDelete = decodeURIComponent(pathParts[1]);
                }
            }
        } catch (e) {
            console.warn("[CertManager] Could not parse currentDbCertificationImageUrl for old path:", currentDbCertificationImageUrl);
        }
    }
    
    // Handle new file upload
    if (certificationImageFile) {
      const fileExt = certificationImageFile.name.split('.').pop();
      const fileName = `cert_${formData.title.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`; 
      const filePath = `${fileName}`; 

      toast({ title: "Uploading Certificate Image", description: "Please wait..." });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certification-images') 
        .upload(filePath, certificationImageFile, { cacheControl: '3600', upsert: false }); // upsert: false to avoid overwriting unrelated files if names collide early

      if (uploadError) {
        console.error("Error uploading certificate image:", JSON.stringify(uploadError, null, 2));
        let errorMsg = `Failed to upload certificate image: ${uploadError.message}`;
        if ((uploadError as any).statusCode === '403' && uploadError.message.includes('row-level security policy')) {
            errorMsg = "Upload failed: Permission denied by storage security policy. Please check RLS for 'certification-images' bucket.";
        }
        toast({ title: "Upload Error", description: errorMsg, variant: "destructive", duration: 7000 });
        setIsSubmitting(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('certification-images').getPublicUrl(filePath);
      if (!publicUrlData?.publicUrl) {
        toast({ title: "Error", description: "Failed to get public URL for uploaded image.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      imageUrlToSaveInDb = publicUrlData.publicUrl;
    } else if (formData.image_url === '' && currentDbCertificationImageUrl) {
        // Image URL was explicitly cleared, and there was an image in DB
        imageUrlToSaveInDb = null;
    }
    
    const dataForSupabase = {
      title: formData.title,
      issuer: formData.issuer,
      date: formData.date,
      image_url: imageUrlToSaveInDb, // Use the potentially new or cleared URL
      verify_url: formData.verify_url || null,
      updated_at: new Date().toISOString() // Add/update updated_at timestamp
    };
    
    if (formData.id) { // Update existing
      const { error: updateError } = await supabase
        .from('certifications')
        .update(dataForSupabase)
        .eq('id', formData.id);
      if (updateError) {
        console.error("Error updating certification:", JSON.stringify(updateError, null, 2));
        toast({ title: "Error", description: `Failed to update certification: ${updateError.message}`, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Certification updated successfully." });
        // Delete old image from storage if a new one was uploaded OR if the URL was cleared
        if (oldImageStoragePathToDelete && imageUrlToSaveInDb !== currentDbCertificationImageUrl) {
            console.log("[CertManager] Attempting to delete old cert image from storage:", oldImageStoragePathToDelete);
            const { error: storageDeleteError } = await supabase.storage.from('certification-images').remove([oldImageStoragePathToDelete]);
            if (storageDeleteError) {
                console.warn("[CertManager] Failed to delete old cert image from storage:", JSON.stringify(storageDeleteError, null, 2));
                toast({ title: "Storage Warning", description: `Old image deletion failed: ${storageDeleteError.message}. Please check storage bucket permissions.`, variant: "default", duration: 6000 });
            } else {
                console.log("[CertManager] Old certificate image deleted from storage.");
            }
        }
        await supabase.from('admin_activity_log').insert({ action_type: 'CERTIFICATION_UPDATED', description: `Certification "${formData.title}" updated.`, user_identifier: (await supabase.auth.getUser()).data.user?.email });
      }
    } else { // Add new
      const { id, ...insertData } = dataForSupabase; // Supabase generates ID
      const { data: newCert, error: insertError } = await supabase
        .from('certifications')
        .insert(insertData)
        .select()
        .single();
      if (insertError) {
        console.error("Error adding certification:", JSON.stringify(insertError, null, 2));
        toast({ title: "Error", description: `Failed to add certification: ${insertError.message}`, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Certification added successfully." });
        if (newCert) await supabase.from('admin_activity_log').insert({ action_type: 'CERTIFICATION_CREATED', description: `Certification "${newCert.title}" created.`, user_identifier: (await supabase.auth.getUser()).data.user?.email, details: { certificationId: newCert.id } });
      }
    }
    fetchCertifications();
    setIsModalOpen(false);
    // setCertificationImageFile(null); // Already handled in useEffect for isModalOpen
    // certificationForm.reset(); // Already handled by useEffect for currentCertification/isModalOpen
    router.refresh();
    setIsSubmitting(false);
  };
  
  const handleDeleteCertification = async () => {
    if (!certificationToDelete) return;
    setIsSubmitting(true);
    
    // Attempt to delete the image from storage first
    if (certificationToDelete.imageUrl) {
        let imagePathToDelete: string | null = null;
        try {
            const url = new URL(certificationToDelete.imageUrl);
            const pathParts = url.pathname.split('/certification-images/');
            if (pathParts.length > 1 && !pathParts[1].startsWith('http')) {
                imagePathToDelete = decodeURIComponent(pathParts[1]);
            }
        } catch (e) {
            console.warn("[CertManager] Could not parse imageUrl for deletion from storage:", certificationToDelete.imageUrl);
        }

        if (imagePathToDelete) {
            const { error: storageError } = await supabase.storage.from('certification-images').remove([imagePathToDelete]);
            if (storageError) {
                console.warn("[CertManager] Error deleting cert image from storage during full delete, proceeding with DB delete:", JSON.stringify(storageError, null, 2));
                toast({ title: "Storage Warning", description: `Could not delete image from storage: ${storageError.message}. DB record will still be deleted.`, variant: "default", duration: 6000});
            } else {
                 console.log("[CertManager] Certificate image deleted from storage:", imagePathToDelete);
            }
        }
    }
    
    const { error: deleteError } = await supabase
      .from('certifications')
      .delete()
      .eq('id', certificationToDelete.id);

    if (deleteError) {
      console.error("Error deleting certification:", JSON.stringify(deleteError, null, 2));
      toast({ title: "Error", description: `Failed to delete certification: ${deleteError.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Certification deleted successfully." });
      await supabase.from('admin_activity_log').insert({ action_type: 'CERTIFICATION_DELETED', description: `Certification "${certificationToDelete.title}" deleted.`, user_identifier: (await supabase.auth.getUser()).data.user?.email, details: { certificationId: certificationToDelete.id } });
      fetchCertifications();
    }
    setShowDeleteConfirm(false);
    setCertificationToDelete(null);
    router.refresh();
    setIsSubmitting(false);
  };

  const triggerDeleteConfirmation = (certification: Certification) => {
    setCertificationToDelete(certification);
    setShowDeleteConfirm(true);
  };

  const handleOpenModal = (certification?: Certification) => {
    setCurrentCertification(certification || null); // This will trigger useEffect to reset form and previews
    setIsModalOpen(true);
  };

  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Manage Certifications
          <CertificateIcon className="h-6 w-6 text-primary" />
        </CardTitle>
        <CardDescription>Add, edit, or delete your certifications. Upload images for badges or certificates.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 text-right">
          <Button onClick={() => handleOpenModal()} disabled={isSubmitting}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Certification
          </Button>
        </div>

        {isLoadingCertifications ? (
          <p className="text-center text-muted-foreground">Loading certifications...</p>
        ) : certifications.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No certifications found. Add one to get started!</p>
        ) : (
          <ScrollArea className="h-[60vh] pr-3">
            <div className="space-y-4">
              {certifications.map((cert) => (
                <Card key={cert.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:shadow-md transition-shadow">
                  {cert.imageUrl && (
                    <div className="w-24 h-16 relative mr-4 mb-2 sm:mb-0 flex-shrink-0 rounded overflow-hidden border bg-muted">
                      <Image 
                        src={cert.imageUrl} 
                        alt={cert.title || 'Certificate Image'}
                        fill 
                        className="object-contain"
                        sizes="(max-width: 200px) 100vw, 96px"
                      />
                    </div>
                  )}
                  <div className="flex-grow mb-3 sm:mb-0 min-w-0">
                    <h4 className="font-semibold text-lg truncate" title={cert.title}>{cert.title}</h4>
                    <p className="text-sm text-muted-foreground truncate" title={`${cert.issuer} - ${cert.date}`}>{cert.issuer} - {cert.date}</p>
                    {cert.verifyUrl && <a href={cert.verifyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Verify</a>}
                  </div>
                  <div className="flex space-x-2 self-start sm:self-center shrink-0 mt-2 sm:mt-0">
                    <Button variant="outline" size="sm" onClick={() => handleOpenModal(cert)} disabled={isSubmitting}>
                      <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => triggerDeleteConfirmation(cert)} disabled={isSubmitting}>
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { setIsModalOpen(isOpen); if (!isOpen) { setCurrentCertification(null); } }}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{currentCertification?.id ? 'Edit Certification' : 'Add New Certification'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={certificationForm.handleSubmit(onSubmitCertification)} className="grid gap-4">
            <ScrollArea className="max-h-[70vh] p-1 pr-2">
              <div className="grid gap-4 p-3">
                <div><Label htmlFor="certTitle">Title</Label><Input id="certTitle" {...certificationForm.register("title")} />{certificationForm.formState.errors.title && <p className="text-destructive text-sm mt-1">{certificationForm.formState.errors.title.message}</p>}</div>
                <div><Label htmlFor="certIssuer">Issuer</Label><Input id="certIssuer" {...certificationForm.register("issuer")} />{certificationForm.formState.errors.issuer && <p className="text-destructive text-sm mt-1">{certificationForm.formState.errors.issuer.message}</p>}</div>
                <div><Label htmlFor="certDate">Date Issued</Label><Input id="certDate" {...certificationForm.register("date")} placeholder="e.g., March 2023" />{certificationForm.formState.errors.date && <p className="text-destructive text-sm mt-1">{certificationForm.formState.errors.date.message}</p>}</div>
                
                <div className="space-y-2">
                  <Label htmlFor="cert_image_file">Certificate Image File</Label>
                  <div className="flex items-center gap-3">
                    <Input id="cert_image_file" type="file" accept="image/*" onChange={handleCertificationImageFileChange} className="flex-grow" key={certificationImageFile ? 'file-selected' : 'no-file'}/>
                    <UploadCloud className="h-6 w-6 text-muted-foreground"/>
                  </div>
                  {certificationImagePreview && (
                    <div className="mt-2 p-2 border rounded-md bg-muted aspect-video relative w-full max-w-xs mx-auto">
                      <Image 
                        src={certificationImagePreview} 
                        alt="Certificate image preview" 
                        fill 
                        className="rounded object-contain"
                        sizes="(max-width: 480px) 100vw, 33vw"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={handleDeleteCurrentImage}
                        className="absolute top-1 right-1 h-6 w-6 z-10 p-1"
                        aria-label="Delete current image"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="image_url_cert" className="text-xs text-muted-foreground">
                      Or enter Image URL (upload or deleting file will override)
                    </Label>
                    <Input id="image_url_cert" {...certificationForm.register("image_url")} placeholder="https://example.com/certificate.png" />
                    {certificationForm.formState.errors.image_url && <p className="text-destructive text-sm mt-1">{certificationForm.formState.errors.image_url.message}</p>}
                  </div>
                </div>

                <div><Label htmlFor="certVerifyUrl">Verification URL (Optional)</Label><Input id="certVerifyUrl" {...certificationForm.register("verify_url")} placeholder="https://example.com/verify/123" />{certificationForm.formState.errors.verify_url && <p className="text-destructive text-sm mt-1">{certificationForm.formState.errors.verify_url.message}</p>}</div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t">
              <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (currentCertification?.id ? 'Save Changes' : 'Add Certification')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
          <AlertDialogHeader>
            <AlertDialogPrimitiveTitle className="text-destructive-foreground">Delete Certification: {certificationToDelete?.title}?</AlertDialogPrimitiveTitle>
            <AlertDialogDescription className="text-destructive-foreground/90">
              This action cannot be undone. This will permanently delete the certification and its image (if any).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowDeleteConfirm(false); setCertificationToDelete(null); }} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground", "hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")} disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCertification} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive", "hover:bg-destructive-foreground/90")} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete Certification"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
    

    