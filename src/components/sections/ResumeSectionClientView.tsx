// ResumeSectionClientView.tsx

"use client";

import {
  Download,
  Eye,
  Briefcase as DefaultExperienceIcon,
  GraduationCap as DefaultEducationIcon,
  ListChecks,
  Languages as DefaultLanguagesIcon,
  Type as DefaultCategoryIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import NextImage from "next/image";
import { format, parseISO, isValid } from "date-fns";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

import type {
  ResumeExperience,
  ResumeEducation,
  ResumeKeySkillCategory,
  ResumeKeySkill,
  ResumeLanguage,
  ResumeMeta,
} from "@/types/supabase";

interface ResumeDetailItemProps {
  title: string;
  subtitle?: string;
  date?: string;
  description?: string | string[];
  iconImageUrl?: string | null;
  DefaultIconComponent?: React.ElementType;
}

const ResumeDetailItem: React.FC<ResumeDetailItemProps> = ({
  title,
  subtitle,
  date,
  description,
  iconImageUrl,
  DefaultIconComponent = DefaultCategoryIcon,
}) => {
  const iconContent = iconImageUrl ? (
    <div className="relative h-6 w-6 rounded-sm overflow-hidden border bg-muted flex-shrink-0">
      <NextImage src={iconImageUrl} alt={`${title} icon`} fill className="object-contain" sizes="24px" />
    </div>
  ) : (
    <DefaultIconComponent className="h-6 w-6 text-primary flex-shrink-0" />
  );

  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-start mb-1">
        <div className="mr-3 mt-1">{iconContent}</div>
        <div className="flex-grow">
          <h4 className="text-xl font-semibold text-foreground">{title}</h4>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {date && <p className="text-xs text-muted-foreground mb-2 ml-9">{date}</p>}
      {description && (
        <div className="ml-9 text-sm text-foreground/80">
          {Array.isArray(description) ? (
            <ul className="list-disc list-inside space-y-1">
              {description.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>{description}</p>
          )}
        </div>
      )}
    </div>
  );
};

interface ResumeSectionClientViewProps {
  resumeMetaData: ResumeMeta | null;
  experienceData: ResumeExperience[];
  educationData: ResumeEducation[];
  keySkillsData: ResumeKeySkillCategory[];
  languagesData: ResumeLanguage[];
}

export default function ResumeSectionClientView({
  resumeMetaData,
  experienceData,
  educationData,
  keySkillsData,
  languagesData,
}: ResumeSectionClientViewProps) {
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [formattedLastUpdated, setFormattedLastUpdated] = useState<string | null>(null);
  const { toast } = useToast();

  const resumePdfUrl = resumeMetaData?.resume_pdf_url;

  useEffect(() => {
    if (resumeMetaData?.updated_at) {
      try {
        const date = parseISO(resumeMetaData.updated_at);
        setFormattedLastUpdated(isValid(date) ? format(date, "MMMM d, yyyy 'at' h:mm a") : "Date unavailable");
      } catch (error) {
        setFormattedLastUpdated("Date unavailable");
      }
    } else {
      setFormattedLastUpdated(null);
    }
  }, [resumeMetaData?.updated_at]);

  const handleDownloadClick = async () => {
    if (!resumePdfUrl) {
      toast({
        title: "Download Unavailable",
        description: "No resume PDF is currently available for download.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error: logError } = await supabase.from("resume_downloads").insert([{}]);
      if (logError) {
        toast({
          title: "Logging Issue",
          description: "Could not log download event: " + logError.message,
          variant: "default",
        });
      }
    } catch (e: any) {
      toast({
        title: "Logging Exception",
        description: e.message,
        variant: "default",
      });
    }

    toast({
      title: "Resume Download",
      description: "Your resume PDF is being prepared.",
      variant: "default",
    });

    try {
      const response = await fetch(resumePdfUrl);
      if (!response.ok) throw new Error(`Fetch error: ${response.status}`);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "Milan_Antony_Resume.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* ...no changes needed in the rest, you already pasted fully */}
    </>
  );
}
