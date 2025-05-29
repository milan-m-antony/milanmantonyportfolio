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
  subtitle?: string | null;
  date?: string | null;
  description?: string | string[] | null;
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
    <div className="mb-8 last:mb-0">
      <div className="flex items-start mb-1">
        <div className="mr-3 mt-1">{iconContent}</div>
        <div className="flex-grow">
          <h4 className="text-xl font-semibold text-foreground">{title}</h4>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {date && <p className="text-xs text-muted-foreground mb-2 ml-0 sm:ml-9">{date}</p>}
      {description && (
        <div className="ml-0 sm:ml-9 text-sm text-foreground/80">
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

  // Check if all essential data is missing or empty
  const noResumeDataAvailable = 
    !resumeMetaData &&
    experienceData.length === 0 &&
    educationData.length === 0 &&
    keySkillsData.length === 0 &&
    languagesData.length === 0;

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

  // Console log the received props for debugging
  console.log("[ResumeSectionClientView] Received Data:", {
    resumeMetaData,
    experienceData,
    educationData,
    keySkillsData,
    languagesData,
    noResumeDataAvailable
  });

  if (noResumeDataAvailable) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        <p>Resume data is currently unavailable. Please check back later or ensure data is populated in the admin panel.</p>
      </div>
    );
  }

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
      <div className="mb-10 flex flex-col items-center gap-4"> 
        {formattedLastUpdated && (
          <p className="text-xs text-muted-foreground">
            Last updated: {formattedLastUpdated}
          </p>
        )}
        {resumePdfUrl && (
          <div className="flex gap-2 flex-wrap"> 
            <Button onClick={() => setIsPdfPreviewOpen(true)} variant="outline">
              <Eye className="mr-2 h-4 w-4" /> Preview PDF
            </Button>
            <Button onClick={handleDownloadClick}>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="experience" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-10 gap-2">
          <TabsTrigger value="experience" disabled={experienceData.length === 0} className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-colors duration-200">Experience</TabsTrigger>
          <TabsTrigger value="education" disabled={educationData.length === 0} className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-colors duration-200">Education</TabsTrigger>
          <TabsTrigger value="skills" disabled={keySkillsData.length === 0} className="bg-muted hover:bg-muted/90 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-colors duration-200">Key Skills</TabsTrigger>
          <TabsTrigger value="languages" disabled={languagesData.length === 0} className="bg-muted hover:bg-muted/90 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-colors duration-200">Languages</TabsTrigger>
        </TabsList>

        <TabsContent value="experience">
          <Card className="hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 border border-transparent transition-all duration-300 ease-out">
            <CardHeader>
              <CardTitle>Work Experience</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {experienceData.length > 0 ? (
                experienceData.map((exp) => (
                  <ResumeDetailItem
                    key={exp.id}
                    title={exp.job_title}
                    subtitle={exp.company_name}
                    date={exp.date_range ?? undefined}
                    description={exp.description_points ?? undefined}
                    iconImageUrl={exp.icon_image_url}
                    DefaultIconComponent={DefaultExperienceIcon}
                  />
                ))
              ) : (
                <p className="text-muted-foreground">No work experience details available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education">
          <Card className="hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 border border-transparent transition-all duration-300 ease-out">
            <CardHeader>
              <CardTitle>Education & Certifications</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {educationData.length > 0 ? (
                educationData.map((edu) => (
                  <ResumeDetailItem
                    key={edu.id}
                    title={edu.degree_or_certification}
                    subtitle={edu.institution_name}
                    date={edu.date_range ?? undefined}
                    description={edu.description ?? undefined}
                    iconImageUrl={edu.icon_image_url}
                    DefaultIconComponent={DefaultEducationIcon}
                  />
                ))
              ) : (
                <p className="text-muted-foreground">No education details available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Card className="bg-card hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 border border-transparent transition-all duration-300 ease-out">
            <CardHeader>
              <CardTitle>Key Skills</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {keySkillsData.length > 0 ? (
                keySkillsData.map((category) => (
                  <div key={category.id} className="mb-8 last:mb-0">
                    <div className="flex items-center mb-4">
                      {category.icon_image_url ? (
                        <div className="relative h-7 w-7 rounded-sm overflow-hidden border bg-muted mr-3 flex-shrink-0">
                          <NextImage src={category.icon_image_url} alt={`${category.category_name} icon`} fill className="object-contain" sizes="28px"/>
                        </div>
                      ) : (
                         <ListChecks className="h-7 w-7 text-primary mr-3 flex-shrink-0" />
                      )}
                      <h4 className="text-xl font-semibold text-foreground">{category.category_name}</h4>
                    </div>
                    {category.skills && category.skills.length > 0 ? (
                      <div className="ml-4 sm:ml-10 flex flex-wrap gap-3">
                        {category.skills.map((skill: ResumeKeySkill) => (
                          <Badge key={skill.id} variant="secondary" className="text-sm">
                            {skill.skill_name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                       <p className="ml-4 sm:ml-10 text-sm text-muted-foreground">No skills listed in this category.</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No key skills details available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages">
          <Card className="bg-card hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 border border-transparent transition-all duration-300 ease-out">
            <CardHeader>
              <CardTitle>Languages</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {languagesData.length > 0 ? (
                languagesData.map((lang) => (
                  <ResumeDetailItem
                    key={lang.id}
                    title={lang.language_name}
                    subtitle={lang.proficiency ?? undefined}
                    iconImageUrl={lang.icon_image_url}
                    DefaultIconComponent={DefaultLanguagesIcon}
                  />
                ))
              ) : (
                <p className="text-muted-foreground">No language details available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {resumePdfUrl && (
        <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
          <DialogContent className="h-[95vh] w-[95vw] sm:h-[90vh] sm:w-[80vw] md:w-[70vw] lg:w-[60vw] p-2 flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Resume PDF Preview</DialogTitle>
              <DialogDescription asChild>
                <div>
                  Viewing your resume PDF. You can also download it.
                  {formattedLastUpdated && (<div className="text-xs mt-1">Last Updated: {formattedLastUpdated}</div>)}
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow border rounded-md overflow-hidden">
              <iframe
                src={resumePdfUrl}
                className="w-full h-full border-0"
                title="Resume PDF Preview"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t flex-shrink-0">
               <Button onClick={handleDownloadClick}><Download className="mr-2 h-4 w-4" />Download PDF</Button>
               <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
