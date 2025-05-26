
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import type { LegalDocument } from '@/types/supabase';
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Save } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const TERMS_DOC_ID = 'terms-and-conditions';
const PRIVACY_DOC_ID = 'privacy-policy';

const legalDocumentSchema = z.object({
  id: z.string(), 
  title: z.string().min(3, "Title must be at least 3 characters."),
  content: z.string().min(20, "Content must be at least 20 characters.").nullable(),
});
type LegalDocumentFormData = z.infer<typeof legalDocumentSchema>;

interface DocumentEditorProps {
  documentId: string;
  initialTitle: string;
  sectionTitle: string;
  sectionDescription: string;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ documentId, initialTitle, sectionTitle, sectionDescription }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LegalDocumentFormData>({
    resolver: zodResolver(legalDocumentSchema),
    defaultValues: {
      id: documentId,
      title: initialTitle,
      content: '',
    },
  });

  useEffect(() => {
    const fetchDocumentContent = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('legal_documents')
        .select('title, content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        toast({ title: "Error", description: `Failed to fetch ${sectionTitle}: ${error.message}`, variant: "destructive" });
      } else if (data) {
        form.reset({
          id: documentId,
          title: data.title || initialTitle,
          content: data.content || '',
        });
      } else {
         form.reset({
          id: documentId,
          title: initialTitle, 
          content: '',
        });
      }
      setIsLoading(false);
    };
    fetchDocumentContent();
  }, [documentId, initialTitle, sectionTitle, form, toast]);

  const onSubmit: SubmitHandler<LegalDocumentFormData> = async (formData) => {
    setIsLoading(true);
    const dataToUpsert = {
      ...formData,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('legal_documents')
      .upsert(dataToUpsert, { onConflict: 'id' });

    if (error) {
      toast({ title: "Error", description: `Failed to save ${sectionTitle}: ${error.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `${sectionTitle} saved successfully.` });
       await supabase.from('admin_activity_log').insert({
            action_type: 'LEGAL_DOC_UPDATED',
            description: `Admin updated the "${formData.title}" document.`,
            user_identifier: process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin',
            details: { documentId: formData.id }
        });
      router.refresh(); 
    }
    setIsLoading(false);
  };

  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader>
        <CardTitle>{sectionTitle}</CardTitle>
        <CardDescription>{sectionDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading content...</p>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor={`${documentId}-title`}>Title</Label>
              <Input
                id={`${documentId}-title`}
                {...form.register("title")}
                className={form.formState.errors.title ? "border-destructive" : ""}
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor={`${documentId}-content`}>Content (Markdown or HTML)</Label>
              <Textarea
                id={`${documentId}-content`}
                {...form.register("content")}
                rows={15}
                className={form.formState.errors.content ? "border-destructive" : ""}
                placeholder={`Enter your ${sectionTitle.toLowerCase()} here...`}
              />
              {form.formState.errors.content && (
                <p className="mt-1 text-sm text-destructive">{form.formState.errors.content.message}</p>
              )}
            </div>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" /> {isLoading ? 'Saving...' : `Save ${sectionTitle}`}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};


export default function LegalManager() {
  return (
    <ScrollArea className="h-[calc(100vh-10rem)]"> {/* Adjust height as needed */}
      <div className="space-y-8 p-1 pr-3"> {/* Added padding for scrollbar */}
        <DocumentEditor
          documentId={TERMS_DOC_ID}
          initialTitle="Terms & Conditions"
          sectionTitle="Terms & Conditions"
          sectionDescription="Manage the content for your Terms & Conditions page."
        />
        <DocumentEditor
          documentId={PRIVACY_DOC_ID}
          initialTitle="Privacy Policy"
          sectionTitle="Privacy Policy"
          sectionDescription="Manage the content for your Privacy Policy page."
        />
      </div>
    </ScrollArea>
  );
}
