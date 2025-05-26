"use client";

import Link from 'next/link';
import NextImage from 'next/image';
import { Button, buttonVariants } from '@/components/ui/button';
import { 
  Sheet, SheetContent, SheetHeader as SheetPrimitiveHeader, SheetTrigger,
  SheetTitle as SheetPrimitiveTitle,
  SheetDescription, SheetFooter
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter as DialogPrimitiveFooter, 
  DialogHeader as DialogPrimitiveHeader, DialogTitle as DialogPrimitiveDialogTitle, DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader, // Added AlertDialogHeader here
  AlertDialogTitle as AlertDialogPrimitiveAlertDialogTitle, 
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabaseClient';
import type { AdminActivityLog, AdminProfile, User as SupabaseUser } from '@/types/supabase';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader as CardPrimitiveHeader, CardTitle as CardPrimitiveCardTitle } from '@/components/ui/card';
import {
  Menu, X, Sun, Moon,
  LogOut as LogoutIcon, Bell as BellIcon, UserCircle, Settings as SettingsIcon,
  UploadCloud, Trash2, History, ChevronRight, ChevronLeft, KeyRound, Mail as MailIcon, UserCog,
  FileText as QuickNotesIcon
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import React, { useState, useEffect, type ChangeEvent, type ReactNode, useCallback } from 'react';
import { format, parseISO, isValid as isValidDate } from 'date-fns';
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import QuickNotes from "@/components/ui/QuickNotes";
import LiveVisitorCount from '@/components/utils/LiveVisitorCount';


const ADMIN_PROFILE_ID = '00000000-0000-0000-0000-00000000000A'; 

// Helper function to format activity details
const formatActivityDetails = (action_type: string, details: any): ReactNode | null => {
  if (!details) return null;

  let parsedDetails = details;
  if (typeof details === 'string') {
    try {
      parsedDetails = JSON.parse(details);
    } catch (e) {
      console.warn("Could not parse activity details string:", details, e);
      return <pre className="mt-1 text-xs bg-muted p-1.5 rounded-md overflow-x-auto">{details}</pre>; // fallback for unparsable string
    }
  }
  if (typeof parsedDetails !== 'object' || parsedDetails === null) {
    return <pre className="mt-1 text-xs bg-muted p-1.5 rounded-md overflow-x-auto">{JSON.stringify(parsedDetails, null, 2)}</pre>; // fallback for non-object
  }

  const renderDetailLine = (label: string, value: any) => (
    <div key={label} className="text-xs"><span className="font-semibold">{label}:</span> {String(value)}</div>
  );

  switch (action_type) {
    case 'PROJECT_CREATED':
    case 'PROJECT_UPDATED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.projectId && renderDetailLine('Project ID', parsedDetails.projectId)}
        </div>
      );
    case 'PROJECT_DELETED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.deletedTitle && renderDetailLine('Deleted Project', parsedDetails.deletedTitle)}
          {parsedDetails.projectId && renderDetailLine('Project ID', parsedDetails.projectId)}
        </div>
      );
    case 'SKILL_CATEGORY_CREATED':
    case 'SKILL_CATEGORY_UPDATED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.categoryId && renderDetailLine('Category ID', parsedDetails.categoryId)}
        </div>
      );
    case 'SKILL_CATEGORY_DELETED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.deletedName && renderDetailLine('Deleted Category', parsedDetails.deletedName)}
          {parsedDetails.categoryId && renderDetailLine('Category ID', parsedDetails.categoryId)}
        </div>
      );
    case 'SKILL_CREATED':
    case 'SKILL_UPDATED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.skillId && renderDetailLine('Skill ID', parsedDetails.skillId)}
          {parsedDetails.categoryId && renderDetailLine('Parent Category ID', parsedDetails.categoryId)}
        </div>
      );
    case 'SKILL_DELETED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.deletedName && renderDetailLine('Deleted Skill', parsedDetails.deletedName)}
          {parsedDetails.skillId && renderDetailLine('Skill ID', parsedDetails.skillId)}
          {parsedDetails.categoryId && renderDetailLine('Parent Category ID', parsedDetails.categoryId)}
        </div>
      );
    case 'MAINTENANCE_MODE_ENABLED':
    case 'MAINTENANCE_MODE_DISABLED':
      return <div className="mt-1 text-xs italic">Site setting changed.</div>;
    case 'SITE_SETTINGS_UPDATED': // General settings update
      return <div className="mt-1 text-xs italic">Site settings were updated.</div>;
    case 'MAINTENANCE_MESSAGE_UPDATED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.message && renderDetailLine('New Message', parsedDetails.message.length > 50 ? parsedDetails.message.substring(0, 47) + '...' : parsedDetails.message)}
          {!parsedDetails.message && <div className="text-xs italic">Message cleared.</div>}
        </div>
      );
    case 'PORTFOLIO_DATA_DELETED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.deleted_sections_labels && parsedDetails.deleted_sections_labels.length > 0 &&
            renderDetailLine('Deleted Sections', parsedDetails.deleted_sections_labels.join(', '))}
          {(!parsedDetails.deleted_sections_labels || parsedDetails.deleted_sections_labels.length === 0) &&
            <div className="text-xs italic">No specific sections detailed.</div>}
        </div>
      );
    case 'ADMIN_LOGIN_SUCCESS':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.email && renderDetailLine('User Email', parsedDetails.email)}
        </div>
      );
    case 'ADMIN_LOGIN_FAILURE':
      if (details && typeof details === 'object') {
        const email = 'attempt_email' in details ? String(details.attempt_email) : 'N/A';
        const reason = 'error' in details ? String(details.error) : 'N/A';
        return (
          <>
            <p className="font-medium">Login Attempt Details:</p>
            <p>Attempted Email: {email}</p>
            <p>Failure Reason: {reason}</p>
          </>
        );
      }
      return <p className="text-xs italic">No further details for failed login.</p>;
    case 'ADMIN_LOGOUT_SUCCESS':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.email && renderDetailLine('User Email', parsedDetails.email)}
        </div>
      );
    case 'HERO_CONTENT_UPDATED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.main_name && renderDetailLine('Main Name', parsedDetails.main_name)}
          {typeof parsedDetails.subtitles_count === 'number' && renderDetailLine('Subtitles', parsedDetails.subtitles_count)}
          {typeof parsedDetails.social_links_count === 'number' && renderDetailLine('Social Links', parsedDetails.social_links_count)}
        </div>
      );
    case 'ABOUT_CONTENT_UPDATED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.headline && renderDetailLine('Headline', parsedDetails.headline)}
          {parsedDetails.image_action && renderDetailLine('Image', parsedDetails.image_action.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()))}
        </div>
      );
    case 'TIMELINE_EVENT_CREATED':
    case 'TIMELINE_EVENT_UPDATED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.title && renderDetailLine('Event Title', parsedDetails.title)}
          {parsedDetails.event_id && renderDetailLine('Event ID', parsedDetails.event_id)}
          {parsedDetails.type && renderDetailLine('Type', parsedDetails.type)}
        </div>
      );
    case 'TIMELINE_EVENT_DELETED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.deleted_title && renderDetailLine('Deleted Event', parsedDetails.deleted_title)}
          {parsedDetails.event_id && renderDetailLine('Event ID', parsedDetails.event_id)}
          {parsedDetails.type && renderDetailLine('Type', parsedDetails.type)}
        </div>
      );
    case 'CERTIFICATION_CREATED':
    case 'CERTIFICATION_UPDATED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.title && renderDetailLine('Certification Title', parsedDetails.title)}
          {parsedDetails.issuer && renderDetailLine('Issuer', parsedDetails.issuer)}
          {parsedDetails.certification_id && renderDetailLine('Cert ID', parsedDetails.certification_id)}
          {action_type === 'CERTIFICATION_UPDATED' && typeof parsedDetails.image_changed === 'boolean' && 
            renderDetailLine('Image Status', parsedDetails.image_changed ? 'Changed' : 'Unchanged')}
        </div>
      );
    case 'CERTIFICATION_DELETED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.deleted_title && renderDetailLine('Deleted Cert', parsedDetails.deleted_title)}
          {parsedDetails.issuer && renderDetailLine('Issuer', parsedDetails.issuer)}
          {parsedDetails.certification_id && renderDetailLine('Cert ID', parsedDetails.certification_id)}
        </div>
      );
    case 'RESUME_META_UPDATED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.pdf_changed && <div className="text-xs italic">PDF updated.</div>}
          {parsedDetails.description_updated && <div className="text-xs italic">Description updated.</div>}
          {(!parsedDetails.pdf_changed && !parsedDetails.description_updated) && <div className="text-xs italic">Meta data saved (no specific changes logged).</div>}
        </div>
      );
    case 'RESUME_EXPERIENCE_CREATED':
    case 'RESUME_EXPERIENCE_UPDATED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.job_title && renderDetailLine('Job Title', parsedDetails.job_title)}
          {parsedDetails.company && renderDetailLine('Company', parsedDetails.company)}
          {parsedDetails.experience_id && renderDetailLine('Experience ID', parsedDetails.experience_id)}
        </div>
      );
    case 'RESUME_EXPERIENCE_DELETED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.deleted_title && renderDetailLine('Deleted Job', parsedDetails.deleted_title)}
          {parsedDetails.deleted_id && renderDetailLine('Experience ID', parsedDetails.deleted_id)}
        </div>
      );
    case 'RESUME_EDUCATION_CREATED':
    case 'RESUME_EDUCATION_UPDATED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.degree && renderDetailLine('Degree/Cert', parsedDetails.degree)}
          {parsedDetails.education_id && renderDetailLine('Education ID', parsedDetails.education_id)}
        </div>
      );
    case 'RESUME_EDUCATION_DELETED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.deleted_degree && renderDetailLine('Deleted Degree/Cert', parsedDetails.deleted_degree)}
          {parsedDetails.education_id && renderDetailLine('Education ID', parsedDetails.education_id)}
        </div>
      );
    case 'RESUME_SKILL_CATEGORY_CREATED':
    case 'RESUME_SKILL_CATEGORY_UPDATED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.name && renderDetailLine('Category Name', parsedDetails.name)}
          {parsedDetails.category_id && renderDetailLine('Category ID', parsedDetails.category_id)}
        </div>
      );
    case 'RESUME_SKILL_CATEGORY_DELETED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.deleted_name && renderDetailLine('Deleted Category', parsedDetails.deleted_name)}
          {parsedDetails.deleted_id && renderDetailLine('Category ID', parsedDetails.deleted_id)}
        </div>
      );
    case 'RESUME_SKILL_CREATED':
    case 'RESUME_SKILL_UPDATED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.name && renderDetailLine('Skill Name', parsedDetails.name)}
          {parsedDetails.skill_id && renderDetailLine('Skill ID', parsedDetails.skill_id)}
          {parsedDetails.category_id && renderDetailLine('Parent Category ID', parsedDetails.category_id)}
        </div>
      );
    case 'RESUME_SKILL_DELETED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.deleted_name && renderDetailLine('Deleted Skill', parsedDetails.deleted_name)}
          {parsedDetails.deleted_id && renderDetailLine('Skill ID', parsedDetails.deleted_id)}
          {parsedDetails.category_id && renderDetailLine('Parent Category ID', parsedDetails.category_id)}
        </div>
      );
    case 'RESUME_LANGUAGE_CREATED':
    case 'RESUME_LANGUAGE_UPDATED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.name && renderDetailLine('Language', parsedDetails.name)}
          {parsedDetails.language_id && renderDetailLine('Language ID', parsedDetails.language_id)}
        </div>
      );
    case 'RESUME_LANGUAGE_DELETED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.deleted_name && renderDetailLine('Deleted Language', parsedDetails.deleted_name)}
          {parsedDetails.deleted_id && renderDetailLine('Language ID', parsedDetails.deleted_id)}
        </div>
      );
    case 'CONTACT_DETAILS_UPDATED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.updated_fields && Array.isArray(parsedDetails.updated_fields) && parsedDetails.updated_fields.length > 0 &&
            renderDetailLine('Updated Fields', parsedDetails.updated_fields.join(', '))}
          {(!parsedDetails.updated_fields || parsedDetails.updated_fields.length === 0) &&
            <div className="text-xs italic">No specific fields detailed for update.</div>}
        </div>
      );
    case 'SOCIAL_LINK_CREATED':
    case 'SOCIAL_LINK_UPDATED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.label && renderDetailLine('Link Label', parsedDetails.label)}
          {parsedDetails.link_id && renderDetailLine('Link ID', parsedDetails.link_id)}
        </div>
      );
    case 'SOCIAL_LINK_DELETED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.deleted_label && renderDetailLine('Deleted Label', parsedDetails.deleted_label)}
          {parsedDetails.deleted_id && renderDetailLine('Link ID', parsedDetails.deleted_id)}
        </div>
      );
    case 'SUBMISSION_STATUS_UPDATED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.submission_id && renderDetailLine('Submission ID', parsedDetails.submission_id.substring(0,8) + '...')}
          {parsedDetails.new_status && renderDetailLine('New Status', parsedDetails.new_status)}
        </div>
      );
    case 'SUBMISSION_STAR_TOGGLED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.submission_id && renderDetailLine('Submission ID', parsedDetails.submission_id.substring(0,8) + '...')}
          {typeof parsedDetails.new_star_state === 'boolean' && renderDetailLine('Starred', parsedDetails.new_star_state ? 'Yes' : 'No')}
        </div>
      );
    case 'SUBMISSION_DELETED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.deleted_from_email && renderDetailLine('From Email', parsedDetails.deleted_from_email)}
          {parsedDetails.deleted_id && renderDetailLine('Submission ID', parsedDetails.deleted_id.substring(0,8) + '...')}
        </div>
      );
    case 'SUBMISSION_REPLY_SENT':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.recipient_email && renderDetailLine('To Email', parsedDetails.recipient_email)}
          {parsedDetails.submission_id && renderDetailLine('Submission ID', parsedDetails.submission_id.substring(0,8) + '...')}
        </div>
      );
    case 'LEGAL_DOC_UPDATED':
      return (
        <div className="mt-1 space-y-0.5">
          {parsedDetails.title && renderDetailLine('Document Title', parsedDetails.title)}
          {parsedDetails.documentId && renderDetailLine('Document ID', parsedDetails.documentId)}
        </div>
      );
    // Cases for Data Deletion
    case 'DATA_DELETION_SUCCESS':
    case 'DATA_DELETION_PARTIAL_FAILURE':
    case 'DATA_DELETION_ATTEMPT_DISABLED':
      if (details && typeof details === 'object') {
        const requestedKeys = (details.requested_section_keys || details.attempted_sections_keys || []) as string[];
        const operationResults = (details.operation_results || []) as Array<{
          sectionKey: string;
          success: boolean;
          message: string;
          details: string[];
        }>;
        
        const getLabel = (key: string) => {
            // Simplified mapping, assuming keys match labels or can be derived
            // In a real app, you might have a shared config or pass labels in details
            return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        };

        let title = "Data Deletion Processed";
        if (action_type === 'DATA_DELETION_ATTEMPT_DISABLED') title = "Data Deletion Attempt (Feature Disabled)";
        else if (action_type === 'DATA_DELETION_PARTIAL_FAILURE') title = "Data Deletion Partially Failed";

        return (
          <>
            <p className="font-medium">{title}:</p>
            {requestedKeys.length > 0 && (
              <p>Requested Sections: {requestedKeys.map(getLabel).join(', ')}</p>
            )}
            {operationResults.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="font-normal text-sm">Operation Breakdown:</p>
                {operationResults.map((op, index) => (
                  <div key={index} className="pl-2 border-l-2 ml-1 py-1 text-xs 
                    {op.success ? 'border-green-500' : 'border-red-500'}">
                    <p className="font-semibold">Section: {getLabel(op.sectionKey)} - {op.success ? 'Succeeded' : 'Failed'}</p>
                    <p className="italic text-muted-foreground">{op.message}</p>
                    {op.details && op.details.length > 0 && (
                      <ul className="list-disc list-inside pl-2 mt-0.5">
                        {op.details.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
            {action_type === 'DATA_DELETION_ATTEMPT_DISABLED' && !operationResults.length && (
                 <p className="italic text-xs">No operations were performed as the feature is disabled.</p>
            )}
          </>
        );
      }
      return <p className="text-xs italic">Details for data deletion are unavailable or not in expected format.</p>;
    // Add more cases here for other action_types as needed
    default:
      // Fallback for unhandled action_types, but still try to display known fields nicely
      const genericDetails = Object.entries(parsedDetails).map(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          return renderDetailLine(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value);
        }
        return null;
      }).filter(Boolean);
      if (genericDetails.length > 0) {
        return <div className="mt-1 space-y-0.5">{genericDetails}</div>;
      }
      // Final fallback to raw JSON if no specific fields could be displayed nicely
      return <pre className="mt-1 text-xs bg-muted p-1.5 rounded-md overflow-x-auto">{JSON.stringify(parsedDetails, null, 2)}</pre>;
  }
};

export interface AdminNavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  href?: string; 
}

interface SidebarContentProps {
  isMobile?: boolean;
  isCollapsed?: boolean;
  navItems: AdminNavItem[];
  activeSection: string;
  onSelectSection: (sectionKey: string) => void;
  onCloseMobileSheet?: () => void;
  toggleSidebarCollapse?: () => void;
}

const SidebarContent = ({
  isMobile = false,
  isCollapsed = false,
  navItems,
  activeSection,
  onSelectSection,
  onCloseMobileSheet,
  toggleSidebarCollapse,
}: SidebarContentProps) => {
  return (
    <div className={cn("flex flex-col h-full bg-sidebar text-sidebar-foreground", isMobile ? "w-full" : "")}>
      <div className={cn(
        "border-b border-sidebar-border flex items-center h-16 shrink-0",
        isCollapsed && !isMobile ? "px-2 justify-center" : "px-4 justify-between"
      )}>
        <Link
          href="/admin/dashboard"
          className={cn(
            "flex items-center",
            isCollapsed && !isMobile ? "justify-center w-full" : ""
          )}
          onClick={() => {
            onSelectSection('dashboard');
            if (isMobile && onCloseMobileSheet) onCloseMobileSheet();
          }}
          aria-label="Go to admin dashboard"
        >
           <div className={cn(
            "relative rounded-full overflow-hidden border border-sidebar-accent flex-shrink-0",
            isCollapsed && !isMobile ? "h-8 w-8" : "h-10 w-10"
          )}>
            <NextImage
              src="/logo.png" 
              alt="Portfolio Logo"
              fill
              sizes="40px"
              className="object-contain"
              priority
            />
          </div>
        </Link>
        {!isMobile && toggleSidebarCollapse && (
           <Button variant="ghost" size="icon" onClick={toggleSidebarCollapse} className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground">
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        )}
      </div>

      <ScrollArea className="flex-grow">
        <nav className={cn(
          "space-y-1",
          isCollapsed && !isMobile ? "px-2 py-2" : "px-4 py-2"
        )}>
          {navItems.filter(item => item.key !== 'settings').map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.key;
            return (
              <Button
                key={item.key}
                variant="ghost"
                className={cn(
                  "w-full text-sm rounded-lg group",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isCollapsed && !isMobile
                    ? "justify-center py-2.5 px-0" 
                    : "justify-start py-2.5 px-3"
                )}
                onClick={() => {
                  onSelectSection(item.key);
                  if (isMobile && onCloseMobileSheet) onCloseMobileSheet();
                }}
                title={isCollapsed && !isMobile ? item.label : undefined}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground",
                  isCollapsed && !isMobile ? "mx-auto" : "mr-2" 
                )} />
                {(!isCollapsed || isMobile) && (
                  <span className="overflow-hidden whitespace-nowrap text-ellipsis">{item.label}</span>
                )}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className={cn(
          "mt-auto border-t border-sidebar-border shrink-0",
           isCollapsed && !isMobile ? "px-2 py-2" : "px-4 py-2"
      )}>
        {(() => {
          const settingsItem = navItems.find(item => item.key === 'settings');
          if (!settingsItem) return null;

          const Icon = settingsItem.icon;
          const isActive = activeSection === settingsItem.key;
          return (
            <Button
              variant="ghost"
              className={cn(
                "w-full text-sm rounded-lg group",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isCollapsed && !isMobile
                  ? "justify-center py-2.5 px-0" 
                  : "justify-start py-2.5 px-3"
              )}
              onClick={() => {
                onSelectSection(settingsItem.key);
                if (isMobile && onCloseMobileSheet) onCloseMobileSheet();
              }}
              title={isCollapsed && !isMobile ? settingsItem.label : undefined}
            >
              <Icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground",
                isCollapsed && !isMobile ? "mx-auto" : "mr-2"
              )} />
              {(!isCollapsed || isMobile) && (
                <span className="overflow-hidden whitespace-nowrap text-ellipsis">
                  {settingsItem.label}
                </span>
              )}
            </Button>
          );
        })()}
      </div>
    </div>
  );
};


interface AdminPageLayoutProps {
  navItems: AdminNavItem[];
  activeSection: string;
  onSelectSection: (sectionKey: string) => void;
  onLogout: () => void;
  username: string | null; 
  children: ReactNode;
  pageTitle: string;
}

export default function AdminPageLayout({
  navItems,
  activeSection,
  onSelectSection,
  onLogout,
  username, 
  children,
  pageTitle
}: AdminPageLayoutProps) {
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [headerIsMounted, setHeaderIsMounted] = useState(false);
  const [currentThemeIcon, setCurrentThemeIcon] = useState<ReactNode>(<div className="h-5 w-5" />);

  const [isActivitySheetOpen, setIsActivitySheetOpen] = useState(false);
  const [activities, setActivities] = useState<AdminActivityLog[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [showClearLogConfirm, setShowClearLogConfirm] = useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { toast } = useToast();

  // State for Profile Photo Modal
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [currentDbProfilePhotoUrl, setCurrentDbProfilePhotoUrl] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  // State for Account Settings Modal (Email & Password)
  const [isAccountSettingsModalOpen, setIsAccountSettingsModalOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [confirmNewEmailInput, setConfirmNewEmailInput] = useState('');
  const [emailChangeError, setEmailChangeError] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [currentPasswordForEmailChange, setCurrentPasswordForEmailChange] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPasswordForPasswordChange, setCurrentPasswordForPasswordChange] = useState('');
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [showConfirmDeletePhoto, setShowConfirmDeletePhoto] = useState(false);

  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState<string | null>(null);

  const [isQuickNotesModalOpen, setIsQuickNotesModalOpen] = useState(false);

  const fetchAdminProfile = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
        setProfilePhotoUrl(null); 
        setCurrentDbProfilePhotoUrl(null);
        setProfilePhotoPreview(null);
        return;
    }
    console.log("[AdminPageLayout] Fetching admin profile for fixed ID:", ADMIN_PROFILE_ID);
    const { data, error } = await supabase
      .from('admin_profile')
      .select('profile_photo_url')
      .eq('id', ADMIN_PROFILE_ID) 
      .maybeSingle();

    if (error) {
      console.error("[AdminPageLayout] Error fetching admin profile photo:", JSON.stringify(error, null, 2));
    } else if (data && data.profile_photo_url) {
      setProfilePhotoUrl(data.profile_photo_url);
      setCurrentDbProfilePhotoUrl(data.profile_photo_url);
      setProfilePhotoPreview(data.profile_photo_url); 
    } else {
      setProfilePhotoUrl(null);
      setCurrentDbProfilePhotoUrl(null);
      setProfilePhotoPreview(null);
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    if (!isUserAuthenticated) { 
      setActivities([]); 
      return;
    }
    setIsLoadingActivities(true);
    const { data, error } = await supabase
      .from('admin_activity_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching activities:', error);
      toast({ title: "Error", description: "Could not load recent activity.", variant: "destructive" });
      setActivities([]);
    } else {
      setActivities(data as AdminActivityLog[]);
    }
    setIsLoadingActivities(false);
  }, [isUserAuthenticated, toast]);

  useEffect(() => {
    setHeaderIsMounted(true);
    setCurrentThemeIcon(theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />);
  }, [theme]);

  useEffect(() => {
    const handleAuthChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const authenticated = customEvent.detail.isAdminAuthenticated;
      const usernameDetail = customEvent.detail.username;
      
      setIsUserAuthenticated(authenticated);
      setAdminUsername(usernameDetail || (authenticated ? 'Admin' : null));

      if (authenticated) {
        fetchAdminProfile(); 
        fetchActivities(); 
      } else {
        setActivities([]);
        setProfilePhotoUrl(null);
        setCurrentDbProfilePhotoUrl(null);
        setProfilePhotoPreview(null);
      }
    };
    window.addEventListener('authChange', handleAuthChange);

    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      if (user) {
        setIsUserAuthenticated(true);
        setAdminUsername(user.email || 'Admin');
        fetchAdminProfile(); 
        fetchActivities();
      } else {
        setIsUserAuthenticated(false);
        setAdminUsername(null);
        setActivities([]);
        setProfilePhotoUrl(null);
        setCurrentDbProfilePhotoUrl(null);
        setProfilePhotoPreview(null);
      }
    });
    
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState) {
      setIsSidebarCollapsed(JSON.parse(savedSidebarState));
    }

    const { data: { subscription: userListenerSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'USER_UPDATED' && session?.user) {
        setAdminUsername(session.user.email || 'Admin');
        fetchAdminProfile();
      }
    });

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      userListenerSubscription?.unsubscribe();
    };
  }, [fetchAdminProfile, fetchActivities]);

  useEffect(() => {
    if (headerIsMounted) {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
    }
  }, [isSidebarCollapsed, headerIsMounted]);

  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  useEffect(() => {
    if (headerIsMounted) {
      let effectiveTheme = theme;
      if (theme === 'system' && typeof window !== 'undefined') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      setCurrentThemeIcon(effectiveTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />);
    }
  }, [theme, headerIsMounted]);

  const toggleTheme = () => {
    if (!headerIsMounted) return;
    let currentEffectiveTheme = theme;
    if (theme === 'system' && typeof window !== 'undefined') {
        currentEffectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    const newThemeToSet = currentEffectiveTheme === 'dark' ? 'light' : 'dark';
    setTheme(newThemeToSet);
  };

  useEffect(() => {
    const handleAdminActivityAdded = () => {
      console.log("[AdminPageLayout] Received adminActivityAdded event. Refetching activities.");
      fetchActivities();
    };
    window.addEventListener('adminActivityAdded', handleAdminActivityAdded);

    return () => {
      window.removeEventListener('adminActivityAdded', handleAdminActivityAdded);
    };
  }, [fetchActivities]);

  useEffect(() => {
    if (isActivitySheetOpen) fetchActivities();
  }, [isActivitySheetOpen]);

  const handleClearActivityLog = async () => {
    setIsLoadingActivities(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.id) {
        toast({ title: "Authentication Error", description: "You must be logged in to clear logs.", variant: "destructive" });
        setIsLoadingActivities(false); return;
    }
    const { error } = await supabase.from('admin_activity_log').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
    if (error) {
      console.error("Error clearing activity log:", error);
      toast({ title: "Error", description: `Failed to clear activity log: ${error.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Activity log cleared." });
      setActivities([]); 
      try {
        await supabase.from('admin_activity_log').insert({ 
          action_type: 'ACTIVITY_LOG_CLEARED', 
          description: `Admin "${user.email || 'Unknown User'}" cleared the activity log.`,
          user_identifier: user.id 
        });
      } catch (logError) {
        console.error("Error logging activity log clear:", logError);
      }
      fetchActivities(); 
    }
    setShowClearLogConfirm(false);
    setIsLoadingActivities(false);
  };

  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return "AD"; 
    if (name.includes('@')) { 
        const emailPrefix = name.split('@')[0];
        if (emailPrefix.length >= 2) return emailPrefix.substring(0, 2).toUpperCase();
        if (emailPrefix.length === 1) return emailPrefix.toUpperCase() + "X"; 
        return "AD";
    }
    const parts = name.split(/[\s_]+/); 
    if (parts.length > 0 && parts[0]) {
        if (parts.length > 1 && parts[1] && parts[1].length > 0) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return parts[0].substring(0, 2).toUpperCase();
    }
    return "AD";
  };

  const handleProfilePhotoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setProfilePhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setProfilePhotoFile(null);
      setProfilePhotoPreview(currentDbProfilePhotoUrl);
    }
  };

  const handleSaveProfilePhoto = async () => {
    setIsUploadingPhoto(true);
    let newPhotoUrlToSave = currentDbProfilePhotoUrl;
    const { data: { user: userForDbUpdate } } = await supabase.auth.getUser();

    if (!userForDbUpdate || !userForDbUpdate.id) {
        toast({ title: "Auth Error", description: "Please log in again to update profile photo.", variant: "destructive"});
        setIsUploadingPhoto(false); return;
    }

    let oldImageStoragePathToDelete: string | null = null;
    if (currentDbProfilePhotoUrl) {
        try {
            const url = new URL(currentDbProfilePhotoUrl);
            const pathParts = url.pathname.split(`/admin-profile-photos/`);
            if (pathParts.length > 1 && !pathParts[1].startsWith('http')) {
                oldImageStoragePathToDelete = decodeURIComponent(pathParts[1]);
            }
        } catch(e) {
            console.warn("[AdminPageLayout] Could not parse currentDbProfilePhotoUrl for old path:", currentDbProfilePhotoUrl, e);
        }
    }

    if (profilePhotoFile) {
      const fileExt = profilePhotoFile.name.split('.').pop();
      const fileName = `admin_profile_photo_${ADMIN_PROFILE_ID}_${Date.now()}.${fileExt}`; 
      
      console.log('[AdminPageLayout] Attempting to upload profile photo:', fileName, 'to bucket: admin-profile-photos');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('admin-profile-photos')
        .upload(fileName, profilePhotoFile, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        console.error("[AdminPageLayout] Error uploading profile photo to storage:", JSON.stringify(uploadError, null, 2));
        toast({ title: "Upload Error", description: `Failed to upload photo: ${uploadError.message}`, variant: "destructive" });
        setIsUploadingPhoto(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('admin-profile-photos').getPublicUrl(fileName);
      if (!publicUrlData?.publicUrl) {
         toast({ title: "Error", description: "Failed to get public URL for new photo.", variant: "destructive" });
         setIsUploadingPhoto(false);
         return;
      }
      newPhotoUrlToSave = publicUrlData.publicUrl;
      
      if (oldImageStoragePathToDelete && oldImageStoragePathToDelete !== fileName && newPhotoUrlToSave !== currentDbProfilePhotoUrl) {
          console.log("[AdminPageLayout] New photo uploaded, attempting to delete old photo:", oldImageStoragePathToDelete);
          const { error: storageDeleteError } = await supabase.storage.from('admin-profile-photos').remove([oldImageStoragePathToDelete]);
           if (storageDeleteError) {
                console.warn("[AdminPageLayout] Failed to delete old profile photo from storage:", JSON.stringify(storageDeleteError, null, 2));
           } else {
                console.log("[AdminPageLayout] Old profile photo deleted successfully.");
           }
      }
    }
    
    console.log('[AdminPageLayout] Attempting to update admin_profile with photo URL:', newPhotoUrlToSave, 'for ID:', ADMIN_PROFILE_ID);
    console.log('[AdminPageLayout] Current user for DB update:', userForDbUpdate?.email, 'User ID:', userForDbUpdate?.id);

    const { error: dbError } = await supabase
      .from('admin_profile')
      .update({ profile_photo_url: newPhotoUrlToSave, updated_at: new Date().toISOString() })
      .eq('id', ADMIN_PROFILE_ID);
    
    console.log('[AdminPageLayout] DB update result - error:', dbError ? JSON.stringify(dbError, null, 2) : 'null');

    if (dbError) {
      console.error("[AdminPageLayout] Error updating admin_profile in DB:", JSON.stringify(dbError, null, 2));
      toast({ title: "Database Error", description: `Failed to save profile photo URL: ${dbError.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile photo updated." });
      setProfilePhotoUrl(newPhotoUrlToSave); 
      setCurrentDbProfilePhotoUrl(newPhotoUrlToSave); 
      setProfilePhotoPreview(newPhotoUrlToSave); 
      try {
         await supabase.from('admin_activity_log').insert({ 
            action_type: 'PROFILE_PHOTO_UPDATED', 
            description: `Admin profile photo updated by ${userForDbUpdate.email}.`,
            user_identifier: userForDbUpdate.id
        });
      } catch(logError) {
        console.error("Error logging profile photo update:", logError);
      }
    }
    setProfilePhotoFile(null); 
    setIsUploadingPhoto(false);
    setIsPhotoModalOpen(false);
  };

  const handleDeleteProfilePhoto = async () => {
    if (!currentDbProfilePhotoUrl) {
      toast({ title: "No Photo", description: "No profile photo to delete.", variant: "default" });
      return;
    }
    setIsUploadingPhoto(true); 
    const {data: { user: userForDelete } } = await supabase.auth.getUser();
     if (!userForDelete || !userForDelete.id) {
        toast({ title: "Auth Error", description: "Please log in again to remove profile photo.", variant: "destructive"});
        setIsUploadingPhoto(false); return;
    }

    let imageStoragePathToDelete: string | null = null;
    try {
        const url = new URL(currentDbProfilePhotoUrl);
        const pathParts = url.pathname.split(`/admin-profile-photos/`);
        if (pathParts.length > 1 && !pathParts[1].startsWith('http')) {
            imageStoragePathToDelete = decodeURIComponent(pathParts[1]);
        }
    } catch(e) {
        console.warn("[AdminPageLayout] Could not parse currentDbProfilePhotoUrl for deletion:", currentDbProfilePhotoUrl, e);
    }

    if (imageStoragePathToDelete) {
      console.log("[AdminPageLayout] Attempting to delete profile photo from storage:", imageStoragePathToDelete);
      const { error: storageError } = await supabase.storage.from('admin-profile-photos').remove([imageStoragePathToDelete]);
      if (storageError) {
        console.warn("[AdminPageLayout] Error deleting profile photo from storage:", JSON.stringify(storageError, null, 2));
        toast({ title: "Storage Error", description: `Could not delete image from storage: ${storageError.message}. Database record will still be updated.`, variant: "destructive"});
      } else {
        console.log("[AdminPageLayout] Profile photo deleted from storage successfully.");
      }
    }

    const { error: dbError } = await supabase
      .from('admin_profile')
      .update({ profile_photo_url: null, updated_at: new Date().toISOString() })
      .eq('id', ADMIN_PROFILE_ID);

    if (dbError) {
      toast({ title: "Database Error", description: `Failed to remove profile photo URL from database: ${dbError.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile photo removed." });
      setProfilePhotoUrl(null); 
      setCurrentDbProfilePhotoUrl(null); 
      setProfilePhotoPreview(null);
      setProfilePhotoFile(null); 
      try {
        await supabase.from('admin_activity_log').insert({ 
            action_type: 'PROFILE_PHOTO_REMOVED', 
            description: `Admin profile photo removed by ${userForDelete.email}.`,
            user_identifier: userForDelete.id
        });
      } catch(logError) {
          console.error("Error logging profile photo removal:", logError);
      }
    }
    setIsUploadingPhoto(false);
    setIsPhotoModalOpen(false); 
  };

  const handleChangeEmail = async () => {
    setEmailChangeError('');
    const trimmedNewEmail = newEmailInput.trim();
    const trimmedConfirmEmail = confirmNewEmailInput.trim();

    if (!trimmedNewEmail || !/\S+@\S+\.\S+/.test(trimmedNewEmail)) {
      setEmailChangeError("Please enter a valid new email address.");
      return;
    }
    if (trimmedNewEmail !== trimmedConfirmEmail) {
        setEmailChangeError("New email and confirmation email do not match.");
        return;
    }
    setIsChangingEmail(true);
    const { data: { user: currentUserForEmailChange } } = await supabase.auth.getUser();

    if (!currentUserForEmailChange || !currentUserForEmailChange.id) {
        toast({ title: "Auth Error", description: "User session not found. Please log in again.", variant: "destructive"});
        setIsChangingEmail(false); return;
    }
    
    console.log(`[AdminPageLayout] Invoking 'admin-update-user-email' Edge Function with newEmail: ${trimmedNewEmail} for user ID: ${currentUserForEmailChange.id}`);

    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('admin-update-user-email', {
        body: { newEmail: trimmedNewEmail }, // userId is implicitly taken from the invoking user's JWT
      });

      if (functionError) {
        console.error("[AdminPageLayout] Error invoking 'admin-update-user-email' Edge Function:", JSON.stringify(functionError, null, 2));
        const message = functionError.message || (typeof functionError === 'object' && (functionError as any).details) || "Failed to invoke email update service. Check Edge Function logs.";
        throw new Error(message);
      }

      if (functionData?.error) {
        console.error("[AdminPageLayout] Error response from 'admin-update-user-email' Edge Function:", functionData.error);
        throw new Error(functionData.error || "An error occurred within the email update service.");
      }

      toast({
        title: "Email Change Processed",
        description: functionData?.message || "Email/username change processed successfully. You may need to log out and log back in with the new email.",
        duration: 10000,
      });

      await supabase.from('admin_activity_log').insert({
        action_type: 'ADMIN_EMAIL_CHANGED_VIA_FUNCTION',
        description: `Admin email/username changed from ${username || 'unknown'} to ${trimmedNewEmail} via Edge Function for user ${currentUserForEmailChange.id}.`,
        user_identifier: currentUserForEmailChange.id,
        details: { old_email: username, new_email: trimmedNewEmail }
      });
      
      setNewEmailInput('');
      setConfirmNewEmailInput('');
      // setIsAccountSettingsModalOpen(false); // Consider if modal should close or user explicitly does
    } catch (error: any) {
      const message = error.message || "An unexpected error occurred while changing email.";
      setEmailChangeError(message);
      toast({ title: "Email Change Failed", description: message, variant: "destructive" });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordChangeError('');
    if (newPasswordInput.length < 6) {
      setPasswordChangeError("New password must be at least 6 characters long.");
      return;
    }
    if (newPasswordInput !== confirmNewPasswordInput) {
      setPasswordChangeError("New passwords do not match.");
      return;
    }
    setIsChangingPassword(true);
    const { data: { user: currentUserForPasswordChange } } = await supabase.auth.getUser();
     if (!currentUserForPasswordChange || !currentUserForPasswordChange.id) {
        toast({ title: "Auth Error", description: "Please log in again to change password.", variant: "destructive"});
        setIsChangingPassword(false); return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPasswordInput });
    if (error) {
      setPasswordChangeError(`Failed to change password: ${error.message}`);
      toast({ title: "Password Change Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Password changed successfully. You may need to log in again." });
      setNewPasswordInput(''); setConfirmNewPasswordInput('');
      try {
        await supabase.from('admin_activity_log').insert({ 
            action_type: 'ADMIN_PASSWORD_CHANGED', 
            description: `Admin password changed by ${currentUserForPasswordChange.email}.`, 
            user_identifier: currentUserForPasswordChange.id 
        });
      } catch(logError) {
          console.error("Error logging password change:", logError);
      }
      setIsAccountSettingsModalOpen(false); 
    }
    setIsChangingPassword(false);
  };

  const handleOpenPhotoModal = () => {
    fetchAdminProfile(); 
    setProfilePhotoFile(null); 
    setIsPhotoModalOpen(true);
  };

  const handleOpenAccountSettingsModal = () => {
    setNewEmailInput('');
    setConfirmNewEmailInput('');
    setEmailChangeError('');
    setNewPasswordInput('');
    setConfirmNewPasswordInput('');
    setPasswordChangeError('');
    setIsAccountSettingsModalOpen(true);
  };

  return (
    <>
    <div className={cn("flex h-screen", isMobileMenuOpen ? "" : "bg-sidebar text-sidebar-foreground")}>
      <aside className={cn(
        "hidden md:flex md:flex-shrink-0 transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}>
         <SidebarContent
            isMobile={false}
            isCollapsed={isSidebarCollapsed}
            navItems={navItems}
            activeSection={activeSection}
            onSelectSection={onSelectSection}
            toggleSidebarCollapse={toggleSidebarCollapse}
            onCloseMobileSheet={() => setIsMobileMenuOpen(false)}
         />
      </aside>

       <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild className="md:hidden fixed top-4 left-4 z-50">
          <Button variant="outline" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r border-sidebar-border">
           <SidebarContent
            isMobile
            isCollapsed={false} 
            navItems={navItems}
            activeSection={activeSection}
            onSelectSection={onSelectSection}
            onCloseMobileSheet={() => setIsMobileMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className={cn(
        "flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out min-w-0",
        "bg-background text-foreground" 
      )}>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6 shrink-0">
          <div className="md:hidden"></div> 
          <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <Sheet open={isActivitySheetOpen} onOpenChange={setIsActivitySheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="View Recent Activity" className="hover:text-primary">
                  <BellIcon className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[350px] sm:w-[400px] p-0 flex flex-col">
                <SheetPrimitiveHeader className="p-4 border-b">
                  <SheetPrimitiveTitle className="flex items-center"><History className="mr-2 h-5 w-5"/>Recent Activity</SheetPrimitiveTitle>
                  <SheetDescription>Latest updates and actions in the admin panel.</SheetDescription>
                </SheetPrimitiveHeader>
                <ScrollArea className="flex-grow p-4">
                  {isLoadingActivities ? (
                    <p className="text-muted-foreground text-center py-4">Loading activities...</p>
                  ) : activities.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No recent activity.</p>
                  ) : (
                    <ul className="space-y-3">
                      {activities.map((activity) => (
                        <li key={activity.id} className="text-sm border-b pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
                          <p className="font-medium text-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {isValidDate(parseISO(activity.timestamp)) ? format(parseISO(activity.timestamp), "MMM d, yyyy 'at' h:mm a") : "Invalid Date"}
                            {' by '}
                            <span className="font-medium">{(activity.user_identifier && activity.user_identifier.includes('@')) ? activity.user_identifier.split('@')[0] : (activity.user_identifier || 'System')}</span>
                          </p>
                          {formatActivityDetails(activity.action_type, activity.details)}
                        </li>
                      ))}
                    </ul>
                  )}
                </ScrollArea>
                {activities.length > 0 && !isLoadingActivities && (
                  <SheetFooter className="p-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => setShowClearLogConfirm(true)} disabled={isLoadingActivities}>
                      <Trash2 className="mr-2 h-4 w-4"/> Clear Log
                    </Button>
                  </SheetFooter>
                )}
              </SheetContent>
            </Sheet>

            <LiveVisitorCount />

            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="hover:text-primary" disabled={!headerIsMounted}>
              {currentThemeIcon}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profilePhotoUrl || undefined} alt={username || "Admin"} className="object-cover" />
                    <AvatarFallback>{getUserInitials(username)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none break-all">{username || "Admin"}</p>
                    <p className="text-xs leading-none text-muted-foreground">Administrator</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleOpenPhotoModal}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Change Profile Picture</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsQuickNotesModalOpen(true)}>
                  <QuickNotesIcon className="mr-2 h-4 w-4" />
                  <span>Quick Notes</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenAccountSettingsModal}>
                  <UserCog className="mr-2 h-4 w-4" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogoutIcon className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className={cn("flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 min-w-0", "bg-background text-foreground")}>
          {children}
        </main>
      </div>
    </div>

    {/* Modal for Changing Profile Picture */}
    <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogPrimitiveHeader>
                <DialogPrimitiveDialogTitle>Change Profile Picture</DialogPrimitiveDialogTitle>
                <DialogDescription>
                    Upload a new photo or remove the current one. Image will be circular.
                </DialogDescription>
            </DialogPrimitiveHeader>
            <ScrollArea className="max-h-[70vh] p-1 pr-2">
              <div className="grid gap-6 py-4 px-2">
                  <div className="space-y-2">
                      <Label htmlFor="profile_photo_file">New Profile Photo</Label>
                      <div className="flex items-center gap-3">
                          <Input id="profile_photo_file" type="file" accept="image/*" onChange={handleProfilePhotoFileChange} className="flex-grow" key={profilePhotoFile ? 'file-selected' : 'no-file'} />
                          <UploadCloud className="h-6 w-6 text-muted-foreground"/>
                      </div>
                  </div>
                  {profilePhotoPreview ? (
                      <div className="mt-2 p-2 border rounded-md bg-muted aspect-square relative w-32 h-32 mx-auto overflow-hidden rounded-full">
                          <NextImage src={profilePhotoPreview} alt="Profile photo preview" fill className="object-cover" sizes="128px" />
                      </div>
                  ) : (
                       <div className="mt-2 p-2 border rounded-full bg-muted w-32 h-32 mx-auto flex items-center justify-center">
                          <UserCircle className="h-16 w-16 text-muted-foreground" />
                      </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button type="button" onClick={handleSaveProfilePhoto} disabled={isUploadingPhoto || (!profilePhotoFile && profilePhotoPreview === currentDbProfilePhotoUrl)} size="sm">
                          {isUploadingPhoto && profilePhotoFile ? <><UploadCloud className="mr-2 h-4 w-4 animate-pulse"/>Saving...</> : <><UploadCloud className="mr-2 h-4 w-4"/>Save Photo</>}
                      </Button>
                      {currentDbProfilePhotoUrl && ( 
                          <Button type="button" variant="destructive" onClick={handleDeleteProfilePhoto} disabled={isUploadingPhoto} size="sm">
                              {isUploadingPhoto && !profilePhotoFile ? "Removing..." : <><Trash2 className="mr-2 h-4 w-4"/>Remove Current Photo</>}
                          </Button>
                      )}
                  </div>
              </div>
            </ScrollArea>
            <DialogPrimitiveFooter className="pt-4 border-t"><DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose></DialogPrimitiveFooter>
        </DialogContent>
    </Dialog>

    {/* Modal for Account Settings (Email & Password) */}
    <Dialog open={isAccountSettingsModalOpen} onOpenChange={setIsAccountSettingsModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogPrimitiveHeader>
          <DialogPrimitiveDialogTitle>Account Settings</DialogPrimitiveDialogTitle>
          <DialogDescription>Manage your admin account email/username and password.</DialogDescription>
        </DialogPrimitiveHeader>
        <ScrollArea className="max-h-[70vh] p-1 pr-2">
          <div className="grid gap-6 py-4 px-2">
            <Card>
              <CardPrimitiveHeader>
                <CardPrimitiveCardTitle className="text-lg flex items-center"><MailIcon className="mr-2 h-5 w-5 text-primary"/>Change Email/Username</CardPrimitiveCardTitle>
              </CardPrimitiveHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Email: <span className="font-medium text-foreground">{username}</span></p>
                  <Label htmlFor="newEmail">New Email Address</Label>
                  <Input id="newEmail" type="email" value={newEmailInput} onChange={(e) => setNewEmailInput(e.target.value)} placeholder="Enter new email" className={emailChangeError ? "border-destructive" : ""} />
                </div>
                <div>
                  <Label htmlFor="confirmNewEmail">Confirm New Email Address</Label>
                  <Input id="confirmNewEmail" type="email" value={confirmNewEmailInput} onChange={(e) => setConfirmNewEmailInput(e.target.value)} placeholder="Confirm new email" className={emailChangeError ? "border-destructive" : ""} />
                  {emailChangeError && <p className="text-sm text-destructive mt-1">{emailChangeError}</p>}
                </div>
                <Button type="button" onClick={handleChangeEmail} disabled={isChangingEmail || !newEmailInput.trim()} className="w-full sm:w-auto">
                  {isChangingEmail ? <MailIcon className="mr-2 h-4 w-4 animate-spin"/> : <MailIcon className="mr-2 h-4 w-4"/>}
                  Request Email Change
                </Button>
                 <p className="text-xs text-muted-foreground">
                    Your email/username will be updated by an admin function. You may need to log out and log back in.
                </p>
              </CardContent>
            </Card>

            <Separator />

            <Card>
               <CardPrimitiveHeader>
                <CardPrimitiveCardTitle className="text-lg flex items-center"><KeyRound className="mr-2 h-5 w-5 text-primary"/>Change Password</CardPrimitiveCardTitle>
              </CardPrimitiveHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" value={newPasswordInput} onChange={(e) => setNewPasswordInput(e.target.value)} placeholder="Enter new password (min. 6 characters)" className={passwordChangeError ? "border-destructive" : ""} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" value={confirmNewPasswordInput} onChange={(e) => setConfirmNewPasswordInput(e.target.value)} placeholder="Confirm new password" className={passwordChangeError ? "border-destructive" : ""} />
                </div>
                {passwordChangeError && <p className="text-sm text-destructive">{passwordChangeError}</p>}
                <Button type="button" onClick={handleChangePassword} disabled={isChangingPassword || !newPasswordInput || !confirmNewPasswordInput} className="w-full sm:w-auto">
                    {isChangingPassword ? <KeyRound className="mr-2 h-4 w-4 animate-spin"/> : <KeyRound className="mr-2 h-4 w-4"/>}
                    Change Password
                </Button>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
        <DialogPrimitiveFooter className="pt-4 border-t"><DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose></DialogPrimitiveFooter>
      </DialogContent>
    </Dialog>

    {/* AlertDialog for Clear Log Confirmation */}
    <AlertDialog open={showClearLogConfirm} onOpenChange={setShowClearLogConfirm}>
      <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
        <AlertDialogHeader>
          <AlertDialogPrimitiveAlertDialogTitle className="text-destructive-foreground">Clear Entire Activity Log?</AlertDialogPrimitiveAlertDialogTitle>
          <AlertDialogDescription className="text-destructive-foreground/90">
            This action cannot be undone. All activity log entries will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={() => setShowClearLogConfirm(false)} 
            className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground", "hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}
          >Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleClearActivityLog} 
            disabled={isLoadingActivities}
            className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive", "hover:bg-destructive-foreground/90")}
          >
            {isLoadingActivities ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div> : null}
            {isLoadingActivities ? "Clearing..." : "Clear Log"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Modal for Quick Notes */}
    <Dialog open={isQuickNotesModalOpen} onOpenChange={setIsQuickNotesModalOpen}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
            <DialogPrimitiveHeader>
                <DialogPrimitiveDialogTitle>Quick Notes</DialogPrimitiveDialogTitle>
                <DialogDescription>
                    Jot down your thoughts, ideas, or tasks.
                </DialogDescription>
            </DialogPrimitiveHeader>
            <ScrollArea className="max-h-[70vh] p-1 pr-2">
                 <div className="py-4 px-2">
                    <QuickNotes />
                 </div>
            </ScrollArea>
            <DialogPrimitiveFooter className="pt-4 border-t">
                <DialogClose asChild>
                    <Button type="button" variant="outline">Close</Button>
                </DialogClose>
            </DialogPrimitiveFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}

