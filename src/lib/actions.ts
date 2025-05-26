
"use server";

import { z } from "zod";
import { supabase } from './supabaseClient';
import { revalidatePath } from 'next/cache';

// Schema for contact form submissions (to be saved in DB)
const contactSubmissionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  subject: z.string().min(2, "Subject must be at least 2 characters."),
  message: z.string().min(10, "Message must be at least 10 characters."),
  phoneNumber: z.string().optional().or(z.literal("").transform(() => undefined)),
  // Supabase will add id, submitted_at, status, is_starred automatically
});

export interface SubmitContactFormState {
  success: boolean;
  message: string;
  errors?: {
    name?: string[];
    email?: string[];
    subject?: string[];
    message?: string[];
    phoneNumber?: string[];
  };
}

export async function submitContactForm(
  prevState: SubmitContactFormState,
  formData: FormData
): Promise<SubmitContactFormState> {
  const validatedFields = contactSubmissionSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    phoneNumber: formData.get("phoneNumber"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Validation failed. Please check your input.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // Map to Supabase table columns
  const submissionData = {
    name: validatedFields.data.name,
    email: validatedFields.data.email,
    subject: validatedFields.data.subject,
    message: validatedFields.data.message,
    phone_number: validatedFields.data.phoneNumber, // Supabase uses snake_case
    // status and is_starred will use default values from the table definition
  };

  const { error } = await supabase.from('contact_submissions').insert([submissionData]);

  if (error) {
    console.error('Supabase error inserting contact submission:', JSON.stringify(error, null, 2));
    return { success: false, message: "Failed to submit message. Please try again later." };
  }

  // Optionally revalidate a path if you have a page that lists submissions or counts them.
  // revalidatePath('/admin/contact-submissions'); // Example

  return {
    success: true,
    message: "Thank you for your message! I'll get back to you soon.",
  };
}


// Supabase Project CRUD Actions
const projectActionSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  live_demo_url: z.string().url().optional().or(z.literal('')),
  repo_url: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  status: z.string().optional(),
  progress: z.number().min(0).max(100).optional().nullable(),
});


export async function addProjectAction(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  if (typeof rawData.tags === 'string') {
    rawData.tags = rawData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
  } else {
    rawData.tags = [];
  }
  rawData.progress = rawData.progress ? parseInt(rawData.progress as string, 10) : null;


  const validatedFields = projectActionSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { success: false, message: "Validation failed.", errors: validatedFields.error.flatten().fieldErrors };
  }
  
  const { id, ...dataToInsert } = validatedFields.data;

  const { error } = await supabase.from('projects').insert(dataToInsert);

  if (error) {
    console.error("Supabase add project error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath('/'); 
  revalidatePath('/admin/dashboard'); 
  return { success: true, message: "Project added successfully." };
}

export async function updateProjectAction(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
   if (typeof rawData.tags === 'string') {
    rawData.tags = rawData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
  } else {
    rawData.tags = [];
  }
  rawData.progress = rawData.progress ? parseInt(rawData.progress as string, 10) : null;

  const validatedFields = projectActionSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { success: false, message: "Validation failed.", errors: validatedFields.error.flatten().fieldErrors };
  }
  
  if (!validatedFields.data.id) {
    return { success: false, message: "Project ID is missing for update." };
  }

  const { error } = await supabase
    .from('projects')
    .update(validatedFields.data)
    .eq('id', validatedFields.data.id);

  if (error) {
    console.error("Supabase update project error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath('/');
  revalidatePath('/admin/dashboard');
  return { success: true, message: "Project updated successfully." };
}

export async function deleteProjectAction(projectId: string) {
  if (!projectId) {
    return { success: false, message: "Project ID is required." };
  }
  const { error } = await supabase.from('projects').delete().eq('id', projectId);

  if (error) {
    console.error("Supabase delete project error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath('/');
  revalidatePath('/admin/dashboard');
  return { success: true, message: "Project deleted successfully." };
}
