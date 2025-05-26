
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { submitContactForm, type SubmitContactFormState } from "@/lib/actions";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  subject: z.string().min(2, "Subject must be at least 2 characters."),
  message: z.string().min(10, "Message must be at least 10 characters."),
  phoneNumber: z.string().optional().or(z.literal("").transform(() => undefined)), // Handle empty string as undefined
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const initialState: SubmitContactFormState = {
  success: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Send Message
    </Button>
  );
}

export default function ContactForm() {
  const [state, formAction] = useActionState(submitContactForm, initialState);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
  });

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: "Success!",
          description: state.message,
          variant: "default",
        });
        reset(); // Reset form on successful submission
      } else {
        toast({
          title: "Error",
          description: state.message,
          variant: "destructive",
        });
      }
    }
  }, [state, toast, reset]);


  return (
    <form action={formAction} className="space-y-6">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          {...register("name")}
          className={errors.name || state.errors?.name ? "border-destructive" : ""}
          aria-invalid={errors.name || state.errors?.name ? "true" : "false"}
        />
        {(errors.name || state.errors?.name) && (
          <p className="mt-1 text-sm text-destructive">
            {errors.name?.message || state.errors?.name?.[0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          className={errors.email || state.errors?.email ? "border-destructive" : ""}
          aria-invalid={errors.email || state.errors?.email ? "true" : "false"}
        />
         {(errors.email || state.errors?.email) && (
          <p className="mt-1 text-sm text-destructive">
            {errors.email?.message || state.errors?.email?.[0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          type="text"
          {...register("subject")}
          className={errors.subject || state.errors?.subject ? "border-destructive" : ""}
          aria-invalid={errors.subject || state.errors?.subject ? "true" : "false"}
        />
         {(errors.subject || state.errors?.subject) && (
          <p className="mt-1 text-sm text-destructive">
            {errors.subject?.message || state.errors?.subject?.[0]}
          </p>
        )}
      </div>
      
      <div>
        <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
        <Input
          id="phoneNumber"
          type="tel"
          {...register("phoneNumber")}
          className={errors.phoneNumber || state.errors?.phoneNumber ? "border-destructive" : ""}
          aria-invalid={errors.phoneNumber || state.errors?.phoneNumber ? "true" : "false"}
        />
         {(errors.phoneNumber || state.errors?.phoneNumber) && (
          <p className="mt-1 text-sm text-destructive">
            {errors.phoneNumber?.message || state.errors?.phoneNumber?.[0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="message">Your Message</Label>
        <Textarea
          id="message"
          rows={5}
          {...register("message")}
          className={errors.message || state.errors?.message ? "border-destructive" : ""}
          aria-invalid={errors.message || state.errors?.message ? "true" : "false"}
        />
         {(errors.message || state.errors?.message) && (
          <p className="mt-1 text-sm text-destructive">
            {errors.message?.message || state.errors?.message?.[0]}
          </p>
        )}
      </div>
      
      <SubmitButton />
    </form>
  );
}
