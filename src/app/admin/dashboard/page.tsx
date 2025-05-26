"use client";

import React, { useEffect, useState, type FormEvent, type ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { 
  ShieldCheck, LogOut, AlertTriangle, LogIn, Home as HomeIcon, Briefcase, 
  Wrench, MapPin as JourneyIcon, Award, FileText as ResumeIcon, Mail as ContactIcon, 
  Settings as SettingsIcon, LayoutDashboard, Gavel as LegalIcon, Loader2, Save, Trash2, User as UserIcon,
  ImageIcon, Link as LinkIcon, ListChecks, Languages, Building, GraduationCap, Tag as TagIcon, History, Filter, Eye, Send, KeyRound, UserCog, Edit
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient'; 
import type { SiteSettings, User as SupabaseUserType } from '@/types/supabase'; // AdminActivityLog might be moved later
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogPrimitiveTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';

// Import Admin Managers
import HeroManager from '@/components/admin/HeroManager';
import AboutManager from '@/components/admin/AboutManager';
import ProjectsManager from '@/components/admin/ProjectsManager';
import SkillsManager from '@/components/admin/SkillsManager';
import TimelineManager from '@/components/admin/TimelineManager';
import CertificationsManager from '@/components/admin/CertificationsManager';
import ResumeManager from '@/components/admin/ResumeManager';
import ContactManager from '@/components/admin/ContactManager';
import LegalManager from '@/components/admin/LegalManager';
import AdminPageLayout, { type AdminNavItem } from '@/components/admin/AdminPageLayout';
import DashboardOverview from '@/components/admin/DashboardOverview'; 
import { ScrollArea } from '@/components/ui/scroll-area';

const ADMIN_SITE_SETTINGS_ID = 'global_settings'; 

const adminNavItems: AdminNavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'hero', label: 'Home Section', icon: HomeIcon },
  { key: 'about', label: 'About Section', icon: UserIcon },
  { key: 'projects', label: 'Projects', icon: Briefcase },
  { key: 'skills', label: 'Skills', icon: Wrench },
  { key: 'journey', label: 'Journey', icon: JourneyIcon },
  { key: 'certifications', label: 'Certifications', icon: Award },
  { key: 'resume', label: 'Resume', icon: ResumeIcon },
  { key: 'contact', label: 'Contact & Submissions', icon: ContactIcon },
  { key: 'legal', label: 'Legal Pages', icon: LegalIcon },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
];

const deletableSectionsConfig = [
    { key: 'hero', label: 'Hero Section Content', tables: ['hero_content'], buckets: [] },
    { key: 'about', label: 'About Section Content', tables: ['about_content'], buckets: ['about-images'] },
    { key: 'projects', label: 'All Projects Data', tables: ['projects'], buckets: ['project-images'] },
    { key: 'project_views_analytics', label: 'Project Views Data (Analytics)', tables: ['project_views'], buckets: [] },
    { key: 'skills', label: 'All Skills & Categories Data', tables: ['skills', 'skill_categories'], buckets: ['category-icons', 'skill-icons'] },
    { key: 'skill_interactions_analytics', label: 'Skill Interactions Data (Analytics)', tables: ['skill_interactions'], buckets: [] },
    { key: 'journey', label: 'Journey/Timeline Events Data', tables: ['timeline_events'], buckets: [] },
    { key: 'certifications', label: 'All Certifications Data', tables: ['certifications'], buckets: ['certification-images'] },
    { key: 'resume', label: 'All Resume Data (Meta, Experience, Education, Skills, Languages)', tables: ['resume_meta', 'resume_experience', 'resume_education', 'resume_key_skills', 'resume_key_skill_categories', 'resume_languages'], buckets: ['resume-pdfs', 'resume-experience-icons', 'resume-education-icons', 'resume-language-icons'] },
    { key: 'resume_downloads_analytics', label: 'Resume Downloads Data (Analytics)', tables: ['resume_downloads'], buckets: [] },
    { key: 'contact_page_content', label: 'Contact Page Details & Page Social Links', tables: ['contact_page_details', 'social_links'], buckets: [] },
    { key: 'contact_submissions', label: 'All Contact Form Submissions', tables: ['contact_submissions'], buckets: [] },
    { key: 'legal_docs', label: 'Legal Documents Content', tables: ['legal_documents'], buckets: [] },
    { key: 'visitor_analytics', label: 'Visitor Analytics Data (Analytics)', tables: ['visitor_logs'], buckets: [] },
    { key: 'activity_log', label: 'Admin Activity Log', tables: ['admin_activity_log'], buckets: [] },
    {
      key: 'social_media_clicks_all',
      label: 'All Social Media Clicks',
      tables: ['social_media_clicks'],
      buckets: [],
      description: "This will permanently delete all records from the 'social_media_clicks' table. This data is used for analytics on social media link performance."
    },
    {
      key: 'quick_notes_user',
      label: 'All My Quick Notes',
      tables: ['quick_notes'],
      buckets: [],
      description: "This will permanently delete all your personal quick notes. This action only affects your notes."
    }
  ] as const; 
  
type DeletableSectionKey = typeof deletableSectionsConfig[number]['key'];


function getPageTitle(sectionKey: string): string {
  const item = adminNavItems.find(navItem => navItem.key === sectionKey);
  return item ? item.label : "Portfolio Admin";
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<SupabaseUserType | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); 

  const [emailInput, setEmailInput] = useState(''); 
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');

  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [maintenanceMessageInput, setMaintenanceMessageInput] = useState('');

  const [selectedSectionsForDeletion, setSelectedSectionsForDeletion] = useState<Record<DeletableSectionKey, boolean>>(
    deletableSectionsConfig.reduce((acc, section) => ({ ...acc, [section.key]: false }), {} as Record<DeletableSectionKey, boolean>)
  );
  const [showDeleteDataPasswordModal, setShowDeleteDataPasswordModal] = useState(false);
  const [showDeleteDataConfirmModal, setShowDeleteDataConfirmModal] = useState(false);
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('');
  const [deleteCountdown, setDeleteCountdown] = useState(5);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [isProcessingFinalDeletion, setIsProcessingFinalDeletion] = useState(false);
  const deleteCountdownIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  // const [authListener, setAuthListener] = useState<any>(null); // Removed: This state was causing infinite loop

  useEffect(() => {
    setIsMounted(true);
    console.log("[AdminDashboardPage] Component mounted. Setting up auth listener.");

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AdminDashboardPage] Auth state changed:", event, "Session user:", session?.user?.email);
      const user = session?.user ?? null;
      setCurrentUser(user);
      
      if (user) {
        window.dispatchEvent(new CustomEvent('authChange', { detail: { isAdminAuthenticated: true, username: user.email } }));
      } else {
        window.dispatchEvent(new CustomEvent('authChange', { detail: { isAdminAuthenticated: false, username: null } }));
      }
      
      setIsLoadingAuth(false); 

      if (event === 'SIGNED_OUT') {
        setEmailInput(''); 
        setPasswordInput('');   
        setError('');      
        setActiveSection('dashboard'); 
        router.replace('/admin/dashboard'); 
      } else if (event === 'SIGNED_IN' && session?.user) {
         if (activeSection === 'settings') { 
             fetchSiteSettings();
         }
      } else if (event === 'USER_UPDATED' && session?.user) {
        setCurrentUser(session.user);
      }
    });
    // setAuthListener(subscription); // Removed this line

    const getInitialSession = async () => {
        console.log("[AdminDashboardPage] Checking initial session on mount.");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
            console.error("[AdminDashboardPage] Error getting initial session:", sessionError);
        }
        console.log("[AdminDashboardPage] Initial session on mount:", session?.user?.email);
        const user = session?.user ?? null;
        if (user) {
            setCurrentUser(user);
            window.dispatchEvent(new CustomEvent('authChange', { detail: { isAdminAuthenticated: true, username: user.email } }));
            if (activeSection === 'settings') {
                fetchSiteSettings();
            }
        } else {
            window.dispatchEvent(new CustomEvent('authChange', { detail: { isAdminAuthenticated: false, username: null } }));
        }
        setIsLoadingAuth(false);
    };
    getInitialSession();

    return () => {
      console.log("[AdminDashboardPage] Unmounting, unsubscribing auth listener.");
      subscription?.unsubscribe(); // Use subscription directly from closure
      if (deleteCountdownIntervalRef.current) {
        clearInterval(deleteCountdownIntervalRef.current);
      }
    };
  }, [activeSection, router]); // Removed authListener from dependency array


  const fetchSiteSettings = async () => {
    if (!currentUser) return; 
    console.log("[AdminDashboardPage] Fetching site settings...");
    setIsLoadingSettings(true);
    const { data, error: fetchError } = await supabase
      .from('site_settings')
      .select('is_maintenance_mode_enabled, maintenance_message')
      .eq('id', ADMIN_SITE_SETTINGS_ID)
      .maybeSingle();

    if (fetchError) {
      console.error("[AdminDashboardPage] Error fetching site settings:", fetchError);
      toast({ title: "Error", description: "Could not load site settings.", variant: "destructive" });
    } else if (data) {
      console.log("[AdminDashboardPage] Site settings fetched:", data);
      setIsMaintenanceMode(data.is_maintenance_mode_enabled);
      setMaintenanceMessageInput(data.maintenance_message || '');
    }
    setIsLoadingSettings(false);
  };

  useEffect(() => {
    if (currentUser && activeSection === 'settings') {
      fetchSiteSettings();
    }
  }, [currentUser, activeSection]);


  const handleToggleMaintenanceMode = async (checked: boolean) => {
    if (!currentUser) {
        toast({ title: "Auth Error", description: "Please log in to change settings.", variant: "destructive"});
        return;
    }
    setIsLoadingSettings(true);
    const { error: updateError } = await supabase
      .from('site_settings')
      .update({ is_maintenance_mode_enabled: checked, updated_at: new Date().toISOString() })
      .eq('id', ADMIN_SITE_SETTINGS_ID);

    if (updateError) {
      console.error("Error updating maintenance mode:", updateError);
      toast({ title: "Error", description: `Failed to update maintenance mode: ${updateError.message}`, variant: "destructive" });
    } else {
      setIsMaintenanceMode(checked);
      toast({ title: "Success", description: `Maintenance mode ${checked ? 'enabled' : 'disabled'}.` });
      try {
        await supabase.from('admin_activity_log').insert({
            action_type: checked ? 'MAINTENANCE_MODE_ENABLED' : 'MAINTENANCE_MODE_DISABLED',
            description: `Admin ${checked ? 'enabled' : 'disabled'} site maintenance mode.`,
            user_identifier: currentUser.id 
        });
      } catch (logError) {
          console.error("Error logging maintenance mode toggle:", logError);
      }
    }
    setIsLoadingSettings(false);
  };
  
  const handleSaveMaintenanceMessage = async () => {
    if (!currentUser) {
        toast({ title: "Auth Error", description: "Please log in to save settings.", variant: "destructive"});
        return;
    }
    setIsLoadingSettings(true);
    const { error: updateError } = await supabase
      .from('site_settings')
      .update({ maintenance_message: maintenanceMessageInput, updated_at: new Date().toISOString() })
      .eq('id', ADMIN_SITE_SETTINGS_ID);

    if (updateError) {
      console.error("Error saving maintenance message:", updateError);
      toast({ title: "Error", description: `Failed to save maintenance message: ${updateError.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Maintenance message saved." });
       try {
        await supabase.from('admin_activity_log').insert({
            action_type: 'MAINTENANCE_MESSAGE_UPDATED',
            description: `Admin updated the site maintenance message.`,
            user_identifier: currentUser.id
        });
      } catch (logError) {
          console.error("Error logging maintenance message update:", logError);
      }
    }
    setIsLoadingSettings(false);
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoadingAuth(true);
    
    const trimmedEmail = emailInput.trim();
    const trimmedPassword = passwordInput; 

    console.log("[AdminDashboardPage] Attempting Supabase login for email:", trimmedEmail);
    
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: trimmedPassword, 
    });

    setIsLoadingAuth(false);

    if (signInError) {
      console.error("[AdminDashboardPage] Supabase Sign In Error:", signInError.message, signInError);
      setError(signInError.message || "Invalid login credentials.");
      toast({ title: "Login Failed", description: signInError.message || "Invalid login credentials.", variant: "destructive" });
    } else if (data.user) {
      console.log("[AdminDashboardPage] Supabase Login successful for user:", data.user.email);
      toast({ title: "Login Successful", description: "Welcome to the admin dashboard." });
      try {
        await supabase.from('admin_activity_log').insert({ 
            action_type: 'ADMIN_LOGIN_SUCCESS', 
            description: `Admin "${data.user.email}" logged in successfully.`,
            user_identifier: data.user.id 
          });
      } catch (logError) {
        console.error("Error logging admin login:", logError);
      }
      // No longer need to set localStorage as Supabase session is now used.
      // router.replace('/admin/dashboard'); // This can cause issues if already on the page; onAuthStateChange handles UI update
    } else {
        setError("An unexpected error occurred during login. No user data returned.");
        toast({ title: "Login Error", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    if (!currentUser) return;
    const userIdForLog = currentUser.id; 
    const userEmailForLog = currentUser.email || "Admin"; 
    console.log(`[AdminDashboardPage] Attempting Supabase logout for user: ${userEmailForLog}`);
    
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
        console.error("[AdminDashboardPage] Error signing out:", signOutError);
        toast({ title: "Logout Error", description: signOutError.message, variant: "destructive"});
    } else {
        console.log("[AdminDashboardPage] Supabase Logout successful.");
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
        try {
          await supabase.from('admin_activity_log').insert({ 
              action_type: 'ADMIN_LOGOUT', 
              description: `Admin "${userEmailForLog}" logged out.`,
              user_identifier: userIdForLog 
            });
        } catch (logError) {
          console.error("Error logging admin logout:", logError);
        }
    }
  };

  const handleToggleSectionForDeletion = (sectionKey: DeletableSectionKey, checked: boolean) => {
    setSelectedSectionsForDeletion(prev => ({ ...prev, [sectionKey]: checked }));
  };

  const getSelectedSectionsForDeletion = () => {
    return deletableSectionsConfig.filter(section => selectedSectionsForDeletion[section.key]);
  };

  const handleInitiateDeleteData = () => {
    if (!currentUser) {
        toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive"});
        return;
    }
    const selected = getSelectedSectionsForDeletion();
    if (selected.length === 0) {
        toast({ title: "No Sections Selected", description: "Please select at least one data group to delete.", variant: "default"});
        return;
    }
    setAdminPasswordConfirm('');
    setShowDeleteDataPasswordModal(true);
  };

  const handlePasswordConfirmForDelete = async () => {
    if (!currentUser || !currentUser.email) {
      toast({ title: "Authentication Error", description: "Cannot verify password. User email not found.", variant: "destructive"});
      return;
    }
    
    setIsDeletingData(true); // Start "deleting" state when password modal is submitted

    const { data: reauthData, error: signInForReauthError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: adminPasswordConfirm,
    });

    if (signInForReauthError || !reauthData.user) {
        console.error("[AdminDashboardPage] Re-authentication for delete failed:", signInForReauthError);
        toast({ title: "Password Incorrect", description: "The admin password entered is incorrect.", variant: "destructive"});
        setIsDeletingData(false); // Stop "deleting" state if password fails
        return;
    }

    setShowDeleteDataPasswordModal(false);
    setAdminPasswordConfirm(''); 
    setShowDeleteDataConfirmModal(true);
    setDeleteCountdown(5); 
    if (deleteCountdownIntervalRef.current) clearInterval(deleteCountdownIntervalRef.current);
    deleteCountdownIntervalRef.current = setInterval(() => {
      setDeleteCountdown(prev => {
        if (prev <= 1) {
          if (deleteCountdownIntervalRef.current) clearInterval(deleteCountdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleFinalDeleteAllData = async () => {
    if (!currentUser) {
        toast({ title: "Authentication Error", description: "Action aborted. User not authenticated.", variant: "destructive"});
        if (isDeletingData) setIsDeletingData(false);
        // if (isProcessingFinalDeletion) setIsProcessingFinalDeletion(false); // Should not be true here typically
        return;
    }
    if (deleteCountdown > 0) {
      toast({ title: "Cannot Delete Yet", description: "Please wait for the countdown.", variant: "default"});
      return;
    }
    const selectedSectionKeys = Object.entries(selectedSectionsForDeletion)
                                   .filter(([key, value]) => value)
                                   .map(([key]) => key as DeletableSectionKey);

    if (selectedSectionKeys.length === 0) {
        toast({ title: "No Sections Selected", description: "Deletion aborted. No data groups were selected.", variant: "default" });
        setShowDeleteDataConfirmModal(false);
        setIsDeletingData(false); 
        // setIsProcessingFinalDeletion(false); // Should be false here already
        return;
    }

    setIsProcessingFinalDeletion(true); // Set processing state for the final button
    toast({ title: "Processing Deletion", description: `Attempting to delete selected data groups and associated files...`});

    try {
      console.log('[AdminDashboardPage] Invoking danger-delete-all-data Edge Function with sections:', selectedSectionKeys);
      
      const payload: { sections_to_delete: DeletableSectionKey[]; user_id_for_quick_notes?: string } = {
        sections_to_delete: selectedSectionKeys
      };

      if (selectedSectionKeys.includes('quick_notes_user')) {
        payload.user_id_for_quick_notes = currentUser.id;
      }

      const { data: functionData, error: functionError } = await supabase.functions.invoke('danger-delete-all-data', {
        body: payload 
      });

      if (functionError) {
        console.error("[AdminDashboardPage] Error invoking Edge Function (raw):", JSON.stringify(functionError, null, 2));
        let detailedMessage = "Function invocation failed. Check Edge Function logs.";
        if (functionError.message?.includes("Function not found")) {
            detailedMessage = "The 'danger-delete-all-data' Edge Function could not be found. Ensure it's deployed.";
        } else if (functionError.name === 'FunctionsHttpError' || functionError.name === 'FunctionsRelayError' || functionError.name === 'FunctionsFetchError') {
             const context = (functionError as any).context;
             if (!context || Object.keys(context).length === 0 || (context.message && context.message.includes("Failed to fetch"))) {
                 detailedMessage = "Edge Function call failed or returned an error. Check Supabase Edge Function logs for details (e.g., missing secrets, code errors, CORS, or network issues).";
             } else if (context.message) {
                 detailedMessage = `Edge Function Error: ${context.message}`;
             }
        }
        throw new Error(detailedMessage);
      }
      
      if (functionData && functionData.error) {
         console.error("[AdminDashboardPage] Error returned from Edge Function logic:", JSON.stringify(functionData.error, null, 2));
         throw new Error(typeof functionData.error === 'string' ? functionData.error : "An error occurred in the Edge Function's data deletion logic.");
      }

      toast({ title: "Success", description: functionData?.message || "Selected data groups deletion process initiated successfully.", duration: 7000 });
      await supabase.from('admin_activity_log').insert({
        action_type: 'DATA_DELETION_INITIATED_SELECTIVE',
        description: `Admin initiated deletion for data groups: ${selectedSectionKeys.join(', ')}.`,
        user_identifier: currentUser.id,
        details: { deleted_sections: selectedSectionKeys }
      });
      setSelectedSectionsForDeletion(deletableSectionsConfig.reduce((acc, section) => ({ ...acc, [section.key]: false }), {} as Record<DeletableSectionKey, boolean>));
      router.refresh(); 
    } catch (err: any) {
      console.error("[AdminDashboardPage] Caught error after trying to invoke Edge Function:", err);
      toast({ title: "Deletion Failed", description: err.message || "Failed to initiate data deletion. Check Edge Function & browser console logs.", variant: "destructive", duration: 9000 });
    } finally {
      setIsProcessingFinalDeletion(false); // Reset processing state for the final button
      setIsDeletingData(false); 
      setShowDeleteDataConfirmModal(false);
    }
  };


  if (!isMounted || isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading authentication state...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary rounded-full inline-block">
              <ShieldCheck className="h-10 w-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold">Admin Access</CardTitle>
            <CardDescription>Please log in to manage portfolio content.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="your.email@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="••••••••" required />
              </div>
              {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Login Failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
              <Button type="submit" className="w-full text-lg py-3" disabled={isLoadingAuth}><LogIn className="mr-2 h-5 w-5" /> {isLoadingAuth ? 'Logging in...' : 'Log In'}</Button>
            </form>
          </CardContent>
           <CardFooter className="mt-6 flex flex-col items-center space-y-2">
             <Link href="/" className={cn(buttonVariants({ variant: "link" }), "text-muted-foreground hover:text-primary p-0 h-auto")}>
                <HomeIcon className="mr-2 h-4 w-4 inline-block" />Back to Portfolio
             </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const selectedSectionLabels = getSelectedSectionsForDeletion().map(s => s.label).join(', ');

  return (
    <AdminPageLayout
      navItems={adminNavItems}
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      onLogout={handleLogout} 
      username={currentUser.email || "Admin"}
      pageTitle={getPageTitle(activeSection)}
    >
      {activeSection === 'dashboard' && <DashboardOverview />}
      {activeSection === 'hero' && <HeroManager />}
      {activeSection === 'about' && <AboutManager />}
      {activeSection === 'projects' && <ProjectsManager />}
      {activeSection === 'skills' && <SkillsManager />}
      {activeSection === 'journey' && <TimelineManager />}
      {activeSection === 'certifications' && <CertificationsManager />}
      {activeSection === 'resume' && <ResumeManager />}
      {activeSection === 'contact' && <ContactManager />}
      {activeSection === 'legal' && <LegalManager />} 
      {activeSection === 'settings' && (
        <div className="space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Site Settings</CardTitle>
                <CardDescription>Manage global site settings and configurations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl">Site Availability</CardTitle>
                    <CardDescription>Control whether your site is live or in maintenance mode.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg shadow-sm bg-card-foreground/5 dark:bg-card-foreground/10">
                      <div>
                        <Label htmlFor="maintenance-mode-switch" className="font-semibold text-lg cursor-pointer">
                          Maintenance Mode
                        </Label>
                        <p className="text-sm text-muted-foreground max-w-md">
                          When enabled, visitors will see a maintenance page.
                          You can still access the admin dashboard.
                        </p>
                      </div>
                      {isLoadingSettings ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <Switch
                          id="maintenance-mode-switch"
                          checked={isMaintenanceMode}
                          onCheckedChange={handleToggleMaintenanceMode}
                          aria-label="Toggle maintenance mode"
                          className="data-[state=checked]:bg-destructive data-[state=unchecked]:bg-muted"
                        />
                      )}
                    </div>
                     <p className="text-xs text-muted-foreground mt-3">
                      {isMaintenanceMode 
                        ? "Site is currently IN MAINTENANCE MODE. Only admins may see full content." 
                        : "Site is currently LIVE and accessible to all visitors."}
                    </p>
                    <div className="mt-6 pt-6 border-t">
                        <Label htmlFor="maintenanceMessage" className="font-semibold text-lg block mb-2">Maintenance Page Message</Label>
                        <Textarea 
                            id="maintenanceMessage"
                            value={maintenanceMessageInput}
                            onChange={(e) => setMaintenanceMessageInput(e.target.value)}
                            placeholder="Our site is currently undergoing scheduled maintenance. We expect to be back online shortly. Thank you for your patience!"
                            rows={4}
                            className="mb-2"
                            disabled={isLoadingSettings}
                        />
                        <Button onClick={handleSaveMaintenanceMessage} disabled={isLoadingSettings} size="sm">
                            {isLoadingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
                            Save Message
                        </Button>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <Card className="border-destructive shadow-lg">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="h-6 w-6"/>Danger Zone</CardTitle>
                    <CardDescription className="text-destructive/80">These actions are irreversible and can lead to data loss from your database and associated storage files.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg text-destructive">Select Data Groups for Deletion</h4>
                        <p className="text-sm text-destructive/80 mb-3">
                            Toggle switches for data groups you wish to permanently delete. This includes database records AND associated files in Supabase Storage. 
                            This action does **not** delete your admin profile or core site settings (like maintenance mode status itself).
                        </p>
                        <ScrollArea className="h-[300px] w-full p-4 border rounded-md bg-destructive/5">
                            <div className="space-y-3">
                            {deletableSectionsConfig.map((section) => (
                                <div key={section.key} className="flex items-center justify-between p-3 border border-destructive/20 rounded-md hover:bg-destructive/10 transition-colors">
                                <div className="flex-grow pr-2">
                                  <Label htmlFor={`delete-switch-${section.key}`} className="text-sm font-medium text-destructive/90 cursor-pointer">
                                      {section.label}
                                  </Label>
                                  {('description' in section ? section.description : undefined) && (
                                    <p className="text-xs text-destructive/70 mt-0.5">
                                      {/* @ts-expect-error: description may not exist on all section types */}
                                      {section.description}
                                    </p>
                                  )}
                                </div>
                                <Switch
                                    id={`delete-switch-${section.key}`}
                                    checked={selectedSectionsForDeletion[section.key]}
                                    onCheckedChange={(checked) => handleToggleSectionForDeletion(section.key, checked)}
                                    className="data-[state=checked]:bg-destructive data-[state=unchecked]:bg-muted"
                                />
                                </div>
                            ))}
                            </div>
                        </ScrollArea>
                        
                        <Button 
                            variant="destructive" 
                            onClick={handleInitiateDeleteData} 
                            disabled={isDeletingData || !currentUser || getSelectedSectionsForDeletion().length === 0}
                            className="w-full sm:w-auto"
                        >
                            {isDeletingData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Delete Selected Data Groups & Files
                        </Button>
                         {getSelectedSectionsForDeletion().length > 0 && (
                            <p className="text-xs text-destructive/70 mt-1">
                                You have selected: <span className="font-medium">{selectedSectionLabels || 'None'}</span> for deletion.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      )}

      <AlertDialog open={showDeleteDataPasswordModal} onOpenChange={setShowDeleteDataPasswordModal}>
        <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
          <AlertDialogHeader>
            <AlertDialogPrimitiveTitle className="text-destructive-foreground">Confirm Admin Password</AlertDialogPrimitiveTitle>
            <AlertDialogDescription className="text-destructive-foreground/90">
              To proceed with deleting data for the selected sections and their associated storage files, please re-enter your admin password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="adminPasswordConfirmDelete" className="text-destructive-foreground/90">Admin Password</Label>
            <Input 
              id="adminPasswordConfirmDelete" 
              type="password" 
              value={adminPasswordConfirm}
              onChange={(e) => setAdminPasswordConfirm(e.target.value)}
              className="bg-destructive-foreground/10 border-destructive-foreground/30 text-destructive-foreground placeholder:text-destructive-foreground/50 focus:ring-destructive-foreground"
              placeholder="Enter your admin password"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setShowDeleteDataPasswordModal(false)}
              className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground", "hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}
            >Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handlePasswordConfirmForDelete}
              className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive", "hover:bg-destructive-foreground/90")}
            >Proceed</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDataConfirmModal} onOpenChange={setShowDeleteDataConfirmModal}>
        <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
          <AlertDialogHeader>
            <AlertDialogPrimitiveTitle className="text-destructive-foreground">FINAL CONFIRMATION: DELETE SELECTED DATA & FILES?</AlertDialogPrimitiveTitle>
            <AlertDialogDescription className="text-destructive-foreground/90">
              You are about to permanently delete all data for the following groups: <strong className="text-destructive-foreground">{selectedSectionLabels || 'None Selected (Error - should not happen)'}</strong>. 
              This includes database records AND associated files from Supabase Storage. This action is **IRREVERSIBLE**.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 text-center">
            <p className="text-lg text-destructive-foreground/90">
              Button will be enabled in <span className="font-bold text-xl">{deleteCountdown}</span> second{deleteCountdown !== 1 ? 's' : ''}.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteDataConfirmModal(false);
                if (deleteCountdownIntervalRef.current) clearInterval(deleteCountdownIntervalRef.current);
                setIsDeletingData(false); // Stop "deleting" state if user cancels final step
              }}
              className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground", "hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}
            >Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleFinalDeleteAllData} 
              disabled={deleteCountdown > 0 || isProcessingFinalDeletion}
              className={cn(
                buttonVariants({ variant: "default" }), 
                "bg-destructive-foreground text-destructive", 
                "hover:bg-destructive-foreground/90",
                (deleteCountdown > 0 || isProcessingFinalDeletion) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isProcessingFinalDeletion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Deletion of Selected Data Groups
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageLayout>
  );
}

