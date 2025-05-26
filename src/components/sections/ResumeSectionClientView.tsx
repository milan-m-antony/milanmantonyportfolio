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
      <div className="text-center space-y-6 max-w-3xl mx-auto mb-12">
        {resumeMetaData?.description && (
          <p className="text-muted-foreground text-lg leading-relaxed">{resumeMetaData.description}</p>
        )}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          {resumePdfUrl && (
            <Button onClick={() => setIsPdfPreviewOpen(true)} size="lg">
              <Eye className="mr-2 h-5 w-5" /> Preview PDF
            </Button>
          )}
          <Button size="lg" onClick={handleDownloadClick} disabled={!resumePdfUrl}>
            <Download className="mr-2 h-5 w-5" /> Download PDF
          </Button>
        </div>
        {!resumePdfUrl && (
          <p className="text-xs text-muted-foreground mt-2">
            (Resume PDF not available. Please upload one via the admin panel.)
          </p>
        )}
        {formattedLastUpdated && (
          <p className="text-xs text-muted-foreground mt-4">Last Updated: {formattedLastUpdated}</p>
        )}
      </div>

      {resumePdfUrl && (
        <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
          <DialogContent className="max-w-4xl w-[95vw] md:w-[90vw] h-[90vh] p-0 flex flex-col overflow-hidden">
            <DialogHeader className="p-4 border-b">
              <DialogTitle>Resume Preview</DialogTitle>
              <DialogDescription>
                Viewing PDF. You can also download it using the "Download PDF" button.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow p-0 m-0 overflow-hidden">
              <iframe src={resumePdfUrl} title="Resume PDF Preview" className="w-full h-full border-0" />
            </div>
            <DialogClose asChild>
              <Button variant="outline" className="m-4 mt-2 self-end">Close Preview</Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      )}

      <Tabs defaultValue="experience" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
          <TabsTrigger value="experience"><DefaultExperienceIcon className="mr-2 h-4 w-4" />Experience</TabsTrigger>
          <TabsTrigger value="education"><DefaultEducationIcon className="mr-2 h-4 w-4" />Education</TabsTrigger>
          <TabsTrigger value="skills"><ListChecks className="mr-2 h-4 w-4" />Key Skills</TabsTrigger>
          <TabsTrigger value="languages"><DefaultLanguagesIcon className="mr-2 h-4 w-4" />Languages</TabsTrigger>
        </TabsList>

        <TabsContent value="experience">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><DefaultExperienceIcon className="mr-3 h-6 w-6 text-primary" /> Professional Experience</CardTitle>
            </CardHeader>
            <CardContent>
              {experienceData.length > 0 ? experienceData.map((exp) => (
                <ResumeDetailItem
                  key={exp.id}
                  title={exp.job_title}
                  subtitle={exp.company_name}
                  date={exp.date_range ?? undefined}
                  description={exp.description_points || []}
                  iconImageUrl={exp.icon_image_url}
                  DefaultIconComponent={DefaultExperienceIcon}
                />
              )) : (
                <p className="text-muted-foreground text-center py-4">No professional experience entries yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><DefaultEducationIcon className="mr-3 h-6 w-6 text-primary" /> Education</CardTitle>
            </CardHeader>
            <CardContent>
              {educationData.length > 0 ? educationData.map((edu) => (
                <ResumeDetailItem
                  key={edu.id}
                  title={edu.degree_title}
                  subtitle={edu.institution_name}
                  date={edu.date_range}
                  description={edu.description}
                  iconImageUrl={edu.icon_image_url}
                  DefaultIconComponent={DefaultEducationIcon}
                />
              )) : (
                <p className="text-muted-foreground text-center py-4">No education entries yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><ListChecks className="mr-3 h-6 w-6 text-primary" /> Key Skills</CardTitle>
            </CardHeader>
            <CardContent>
              {keySkillsData.length > 0 ? keySkillsData.map((category) => (
                <div key={category.id} className="mb-6">
                  <h4 className="text-lg font-semibold mb-2">{category.category_title}</h4>
                  <div className="flex flex-wrap gap-2">
                    {category.skills?.map((skill: ResumeKeySkill) => (
                      <Badge key={skill.id} variant="secondary" className="px-3 py-1 text-sm">{skill.skill_name}</Badge>
                    ))}
                  </div>
                </div>
              )) : (
                <p className="text-muted-foreground text-center py-4">No key skills listed yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><DefaultLanguagesIcon className="mr-3 h-6 w-6 text-primary" /> Languages</CardTitle>
            </CardHeader>
            <CardContent>
              {languagesData.length > 0 ? (
                <ul className="space-y-2">
                  {languagesData.map((lang) => (
                    <li key={lang.id} className="flex justify-between border-b pb-1">
                      <span>{lang.language_name}</span>
                      <span className="text-sm text-muted-foreground">{lang.proficiency_level}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">No languages listed yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
