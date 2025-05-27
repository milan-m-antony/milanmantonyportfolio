// src/components/admin/DashboardOverview.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, Brain, Download, Mail, BarChart3, Clock, TrendingUp, AlertCircle, 
  Loader2, RefreshCw, Users, Settings2, Smartphone, Tablet, Monitor, HardDrive, Database as DatabaseIcon,
  Share2, Wifi
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend as RechartsLegend, Cell, Dot } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import { subDays, format, isValid as isValidDate, formatDistanceToNow, parseISO } from 'date-fns';
import type { SiteSettings, ProjectView, SkillInteraction, ResumeDownload, ContactSubmission, Project, Skill, VisitorLog } from '@/types/supabase';
import SocialMediaClicksChart from './SocialMediaClicksChart';
import DatabaseSizeStatCard from './DatabaseSizeStatCard';
import BucketStorageStatCard from './BucketStorageStatCard';
import type { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
import { motion, useMotionValue, useTransform, animate, MotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';

const ADMIN_SITE_SETTINGS_ID = 'global_settings';
const AUTO_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const LIVE_VISITORS_CHANNEL_NAME = 'live-visitors';

interface MostViewedProjectData {
  title: string | null;
  views: number | null;
}

interface MostInteractedSkillData {
  name: string | null;
  interactions: number | null;
}

interface DeviceTypeData {
    name: VisitorLog['device_type'] | 'Other' | 'Unknown';
    visitors: number;
    color: string;
    icon: React.ElementType;
}

const StatCard = ({ title, value, icon: Icon, description, isLoading, valueClassName, descriptionClassName }: { title: string; value?: string | number | null; icon: React.ElementType; description: string, isLoading?: boolean, valueClassName?: string, descriptionClassName?: string }) => {
  const isNumeric = typeof value === 'number';
  const count = useMotionValue(0);

  useEffect(() => {
    if (isNumeric) {
      const controls = animate(count, value as number, {
        duration: 0.7,
        ease: "easeOut",
      });
      return controls.stop;
    } 
    // No need for an else to set count for non-numeric, as we'll render `value` directly then.
  }, [value, isNumeric, count]);

  // For display, round the animated numeric value.
  const roundedNumericValue = useTransform(count, latest => Math.round(latest));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <Card className="shadow-md hover:shadow-lg transition-shadow h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-2xl font-bold">...</div>
          ) : (value !== undefined && value !== null && value !== "N/A" && value !== "Error") ? (
            isNumeric ? 
              <motion.span className={`text-2xl font-bold ${valueClassName || ''}`}>{roundedNumericValue}</motion.span> 
              : <div className={`text-2xl font-bold ${valueClassName || ''}`}>{value}</div> // Display non-numeric values directly
          ) : (
            <div className="text-2xl font-bold text-muted-foreground/70">{value === "Error" ? "Error" : (value === "N/A" ? "N/A" : "0")}</div>
          )}
          <p className={cn("text-xs text-muted-foreground mt-1", descriptionClassName)}>{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function DashboardOverview() {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const liveVisitorsChannelRef = useRef<RealtimeChannel | null>(null);

  const [isAnalyticsTrackingEnabled, setIsAnalyticsTrackingEnabled] = useState(true);
  const [isLoadingAppSettings, setIsLoadingAppSettings] = useState(true);

  const [totalProjectViews, setTotalProjectViews] = useState<number | null>(null);
  const [isLoadingTotalProjectViews, setIsLoadingTotalProjectViews] = useState(true);

  const [mostViewedProjectData, setMostViewedProjectData] = useState<MostViewedProjectData>({ title: null, views: null });
  const [isLoadingMostViewedProject, setIsLoadingMostViewedProject] = useState(true);
  
  const [mostInteractedSkillData, setMostInteractedSkillData] = useState<MostInteractedSkillData>({ name: null, interactions: null });
  const [isLoadingMostInteractedSkill, setIsLoadingMostInteractedSkill] = useState(true);

  const [totalResumeDownloads, setTotalResumeDownloads] = useState<number | null>(null);
  const [isLoadingResumeDownloads, setIsLoadingResumeDownloads] = useState(true);

  const [recentSubmissionsCount, setRecentSubmissionsCount] = useState<number | null>(null);
  const [isLoadingRecentSubmissions, setIsLoadingRecentSubmissions] = useState(true);

  const [deviceTypeData, setDeviceTypeData] = useState<DeviceTypeData[]>([]);
  const [isLoadingDeviceTypeData, setIsLoadingDeviceTypeData] = useState(true);

  const [databaseSize, setDatabaseSize] = useState<string | null>(null);
  const [isLoadingDbSize, setIsLoadingDbSize] = useState(true);
  const [bucketStorageUsed, setBucketStorageUsed] = useState<string | null>(null);
  const [bucketStorageUsedBytes, setBucketStorageUsedBytes] = useState<number | null>(null);
  const [maxBucketStorageMB, setMaxBucketStorageMB] = useState<number | null>(null);
  const [isLoadingBucketStorage, setIsLoadingBucketStorage] = useState(true);
  const [maxDatabaseSizeMB, setMaxDatabaseSizeMB] = useState<number | null>(null);

  const [liveVisitorsCount, setLiveVisitorsCount] = useState<number>(0);
  const [isLoadingLiveVisitors, setIsLoadingLiveVisitors] = useState<boolean>(true);

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh && isRefreshing) return; 
    if (isManualRefresh) setIsRefreshing(true);
    
    console.log("[DashboardOverview] Fetching all dashboard data...");

    setIsLoadingAppSettings(true);
    setIsLoadingTotalProjectViews(true);
    setIsLoadingMostViewedProject(true);
    setIsLoadingMostInteractedSkill(true);
    setIsLoadingResumeDownloads(true);
    setIsLoadingRecentSubmissions(true);
    setIsLoadingDeviceTypeData(true);
    setIsLoadingDbSize(true);
    setIsLoadingBucketStorage(true);

    try {
      // Site Settings (Tracking Toggle)
      const { data: settingsData, error: settingsError } = await supabase
        .from('site_settings')
        .select('is_analytics_tracking_enabled')
        .eq('id', ADMIN_SITE_SETTINGS_ID)
        .maybeSingle();
      if (settingsError) {
        console.error("[DashboardOverview] Error fetching site settings:", JSON.stringify(settingsError, null, 2));
        // Default to true in case of error fetching settings, to be safe (or false if you prefer tracking off by default on error)
        setIsAnalyticsTrackingEnabled(true); 
      } else if (settingsData) {
        // Explicitly check the type
        if (typeof settingsData.is_analytics_tracking_enabled === 'boolean') {
          setIsAnalyticsTrackingEnabled(settingsData.is_analytics_tracking_enabled);
        } else {
          // If it's null or not a boolean, default to true
          setIsAnalyticsTrackingEnabled(true); 
          console.warn('[DashboardOverview] is_analytics_tracking_enabled was not a boolean or was null, defaulting to true.');
        }
      } else {
        // No settings data found for the ID, default to true
        setIsAnalyticsTrackingEnabled(true);
        console.warn('[DashboardOverview] No site_settings found for ID, defaulting to true.');
      }
      setIsLoadingAppSettings(false);

      // Total Project Views
      const { count: viewsCount, error: viewsError } = await supabase.from('project_views').select('*', { count: 'exact', head: true });
      if (viewsError) { console.error("[DashboardOverview] Error fetching total project views:", JSON.stringify(viewsError, null, 2)); setTotalProjectViews(0); }
      else setTotalProjectViews(viewsCount ?? 0);
      setIsLoadingTotalProjectViews(false);

      // Most Viewed Project
      const { data: allProjectViews, error: allProjectViewsError } = await supabase.from('project_views').select('project_id');
      if (allProjectViewsError) {
        console.error("[DashboardOverview] Error fetching project views for aggregation:", JSON.stringify(allProjectViewsError, null, 2));
        setMostViewedProjectData({ title: 'Error', views: 0 });
      } else if (allProjectViews && allProjectViews.length > 0) {
        const viewCounts: Record<string, number> = {};
        allProjectViews.forEach(view => { if (view.project_id) viewCounts[view.project_id] = (viewCounts[view.project_id] || 0) + 1; });
        let maxViews = 0; let mostViewedId: string | null = null;
        for (const projectId in viewCounts) { if (viewCounts[projectId] > maxViews) { maxViews = viewCounts[projectId]; mostViewedId = projectId; }}
        if (mostViewedId) {
          const { data: projectData, error: projectError } = await supabase.from('projects').select('title').eq('id', mostViewedId).maybeSingle();
          setMostViewedProjectData({ title: projectError ? 'DB Error' : (projectData?.title || 'Unknown Project'), views: maxViews });
        } else { setMostViewedProjectData({ title: 'N/A (No Views)', views: 0 }); }
      } else { setMostViewedProjectData({ title: 'N/A (No Views)', views: 0 }); }
      setIsLoadingMostViewedProject(false);
      
      // Most Interacted Skill
      const { data: allInteractions, error: allInteractionsError } = await supabase.from('skill_interactions').select('skill_id');
      if (allInteractionsError) {
        console.error("[DashboardOverview] Error fetching skill interactions:", JSON.stringify(allInteractionsError, null, 2));
        let specificMessage = `Could not fetch skill interactions: ${allInteractionsError.message}.`;
        if (allInteractionsError.message?.includes("relation") && allInteractionsError.message.includes("does not exist")) {
            specificMessage = "The 'skill_interactions' table does not exist. Please ensure it's created as per the SQL schema.";
        } else if ((allInteractionsError as any).code === '42P01' || allInteractionsError.message?.includes('42P01') ) { 
            specificMessage = "Database error: The 'skill_interactions' table seems to be missing. Please create it.";
        }
        setMostInteractedSkillData({ name: 'Error', interactions: 0 });
      } else if (allInteractions && allInteractions.length > 0) {
        const interactionCounts: Record<string, number> = {};
        allInteractions.forEach(interaction => { if(interaction.skill_id) interactionCounts[interaction.skill_id] = (interactionCounts[interaction.skill_id] || 0) + 1; });
        let maxInteractions = 0; let mostInteractedSkillId: string | null = null;
        for (const skillId in interactionCounts) { if (interactionCounts[skillId] > maxInteractions) { maxInteractions = interactionCounts[skillId]; mostInteractedSkillId = skillId; }}
        if (mostInteractedSkillId) {
          const { data: skillData, error: skillError } = await supabase.from('skills').select('name').eq('id', mostInteractedSkillId).maybeSingle();
          setMostInteractedSkillData({ name: skillError ? 'DB Error' : (skillData?.name || 'Unknown Skill'), interactions: maxInteractions });
        } else { setMostInteractedSkillData({ name: 'N/A', interactions: 0 }); }
      } else { setMostInteractedSkillData({ name: 'N/A', interactions: 0 }); }
      setIsLoadingMostInteractedSkill(false);

      // Total Resume Downloads
      const { count: resumeDownloadsCount, error: resumeError } = await supabase.from('resume_downloads').select('*', { count: 'exact', head: true });
      if (resumeError) { console.error("[DashboardOverview] Error fetching resume downloads:", JSON.stringify(resumeError, null, 2)); setTotalResumeDownloads(0); }
      else setTotalResumeDownloads(resumeDownloadsCount ?? 0);
      setIsLoadingResumeDownloads(false);

      // Recent Contact Submissions
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { count: submissionsCount, error: submissionsError } = await supabase.from('contact_submissions').select('*', { count: 'exact', head: true }).gte('submitted_at', sevenDaysAgo);
      if (submissionsError) { console.error("[DashboardOverview] Error fetching recent submissions:", JSON.stringify(submissionsError, null, 2)); setRecentSubmissionsCount(0); }
      else setRecentSubmissionsCount(submissionsCount ?? 0);
      setIsLoadingRecentSubmissions(false);

      // Visitor Device Types
      const { data: rawDeviceData, error: deviceCountsError } = await supabase
        .from('visitor_logs')
        .select('device_type');
      if (deviceCountsError) {
        console.error("[DashboardOverview] Error fetching device type counts:", JSON.stringify(deviceCountsError, null, 2));
        setDeviceTypeData([]);
      } else if (rawDeviceData) {
        const counts: Record<string, number> = rawDeviceData.reduce((acc, log) => {
          const device = log.device_type || 'Unknown';
          acc[device] = (acc[device] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const formattedDeviceData: DeviceTypeData[] = Object.entries(counts).map(([name, visitors]) => {
            let iconComponent: React.ElementType = Users; let barColor = 'hsl(var(--chart-5))';
            if (name === 'Desktop') { iconComponent = Monitor; barColor = 'hsl(var(--chart-1))'; }
            else if (name === 'Mobile') { iconComponent = Smartphone; barColor = 'hsl(var(--chart-2))'; }
            else if (name === 'Tablet') { iconComponent = Tablet; barColor = 'hsl(var(--chart-4))'; }
            else if (name === 'Unknown') { iconComponent = AlertCircle; barColor = 'hsl(var(--muted))'}
            return { name: name as VisitorLog['device_type'] | 'Other' | 'Unknown', visitors, color: barColor, icon: iconComponent };
        }).sort((a, b) => b.visitors - a.visitors);
        setDeviceTypeData(formattedDeviceData);
      } else { setDeviceTypeData([]); }
      setIsLoadingDeviceTypeData(false);

      // Supabase Storage & DB Metrics from Edge Function
      console.log("[DashboardOverview] Invoking 'get-storage-metrics' Edge Function...");
      const { data: storageMetrics, error: storageMetricsError } = await supabase.functions.invoke('get-storage-metrics');
      
      if (storageMetricsError) {
        console.error("[DashboardOverview] Error invoking 'get-storage-metrics' Edge Function:", JSON.stringify(storageMetricsError, null, 2));
        toast({ title: "Metrics Error", description: "Could not load Supabase storage/DB size from Edge Function.", variant: "destructive" });
        setDatabaseSize("Invoke Error");
        setBucketStorageUsed("Invoke Error");
        setBucketStorageUsedBytes(null);
        setMaxBucketStorageMB(10240);
      } else if (storageMetrics) {
        console.log("[DashboardOverview] Received storage metrics from Edge Function (RAW):", JSON.stringify(storageMetrics, null, 2));
        
        setDatabaseSize(storageMetrics.databaseSize || "N/A");
        setMaxDatabaseSizeMB(storageMetrics.maxDatabaseSizeMB || 1024);
        
        setBucketStorageUsed(storageMetrics.bucketStorageUsed || "N/A (See Dashboard)");
        
        const rawBucketBytes = storageMetrics.bucketStorageUsedBytes;
        console.log("[DashboardOverview] Raw bucketStorageUsedBytes from metrics:", rawBucketBytes);

        setBucketStorageUsedBytes(rawBucketBytes === -1 ? null : (typeof rawBucketBytes === 'number' ? rawBucketBytes : null)); 
        setMaxBucketStorageMB(storageMetrics.maxBucketStorageMB || 10240); 
      } else {
        console.warn("[DashboardOverview] 'get-storage-metrics' Edge Function returned no data or unexpected structure.");
        setDatabaseSize("N/A - No Data");
        setMaxDatabaseSizeMB(1024);
        setBucketStorageUsed("N/A - No Data");
        setBucketStorageUsedBytes(null);
        setMaxBucketStorageMB(10240);
      }
      setIsLoadingDbSize(false);
      setIsLoadingBucketStorage(false);

      // NOTE: SocialMediaClicksChart fetches its own data internally for now.
      // If we needed to coordinate its loading with the main refresh, we'd add state and fetch calls here.

      setLastRefreshed(new Date());
      if (isManualRefresh) toast({ title: "Success", description: "Dashboard data updated ✅" });

    } catch (error: any) {
      console.error("[DashboardOverview] General error fetching dashboard data:", error);
      toast({ title: "Error", description: `Could not refresh all dashboard data: ${error.message}`, variant: "destructive"});
      // Set all loading states to false and error indicators if a general catch occurs
      setIsLoadingAppSettings(false); setIsLoadingTotalProjectViews(false); setIsLoadingMostViewedProject(false);
      setIsLoadingMostInteractedSkill(false); setIsLoadingResumeDownloads(false); setIsLoadingRecentSubmissions(false);
      setIsLoadingDeviceTypeData(false); setIsLoadingDbSize(false); setIsLoadingBucketStorage(false);
      setDatabaseSize("Fetch Error"); setMaxDatabaseSizeMB(1024);
      setBucketStorageUsed("Fetch Error"); setBucketStorageUsedBytes(null); setMaxBucketStorageMB(10240);
    } finally {
      if (isManualRefresh) setIsRefreshing(false);
      console.log("[DashboardOverview] Finished fetching all dashboard data.");
    }
  }, [toast, isRefreshing]); 

  useEffect(() => {
    fetchDashboardData(); 
    if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    autoRefreshTimerRef.current = setInterval(() => {
      console.log("[DashboardOverview] Auto-refreshing data...");
      fetchDashboardData(false);
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => { if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current); };
  }, [fetchDashboardData]); 

  const handleManualRefresh = () => { if (!isRefreshing) fetchDashboardData(true); };

  const handleToggleAnalyticsTracking = async (checked: boolean) => {
    setIsLoadingAppSettings(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { 
        toast({ title: "Auth Error", description: "Please log in again to change settings.", variant: "destructive"}); 
        setIsLoadingAppSettings(false); 
        setIsAnalyticsTrackingEnabled(!checked); 
        return; 
    }

    console.log(`[DashboardOverview] Attempting to update site_settings for id: ${ADMIN_SITE_SETTINGS_ID} to is_analytics_tracking_enabled: ${checked}`); // Log attempt

    const { data: updateData, error: updateError } = await supabase // Capture updateData too
      .from('site_settings')
      .update({ is_analytics_tracking_enabled: checked, updated_at: new Date().toISOString() })
      .eq('id', ADMIN_SITE_SETTINGS_ID)
      .select(); // Add .select() to get back the (attempted) updated row

    if (updateError) { 
      console.error("[DashboardOverview] Failed to update tracking setting in DB:", JSON.stringify(updateError, null, 2)); // Detailed log
      toast({ title: "Error", description: `Failed to update tracking setting: ${updateError.message}`, variant: "destructive" }); 
      setIsAnalyticsTrackingEnabled(!checked); 
    } else { 
      console.log("[DashboardOverview] Successfully updated tracking setting. Returned data:", updateData); // Log success and returned data
      // Check if the update actually modified any row
      if (updateData && updateData.length > 0) {
        setIsAnalyticsTrackingEnabled(checked); 
        toast({ title: "Success", description: `Analytics tracking ${checked ? 'enabled' : 'disabled'}.` });
        try { 
          await supabase.from('admin_activity_log').insert({ 
            action_type: checked ? 'ANALYTICS_TRACKING_ENABLED' : 'ANALYTICS_TRACKING_DISABLED', 
            description: `Admin ${checked ? 'enabled' : 'disabled'} site-wide analytics tracking.`, 
            user_identifier: user.id 
          });
        } catch (logError) { 
          console.error("[DashboardOverview] Error logging analytics tracking toggle:", logError); 
        }
      } else {
        console.warn("[DashboardOverview] Update call succeeded but returned no data. This might mean the row with id '${ADMIN_SITE_SETTINGS_ID}' was not found or did not meet update conditions.");
        toast({ title: "Warning", description: "Setting updated, but no confirmation from database. Row might not exist.", variant: "default" });
        // Optionally revert UI or handle as a specific type of error
        // setIsAnalyticsTrackingEnabled(!checked); // Revert UI if no row was confirmed updated
      }
    }
    setIsLoadingAppSettings(false);
  };

  useEffect(() => {
    setIsLoadingLiveVisitors(true);
    const channel = supabase.channel(LIVE_VISITORS_CHANNEL_NAME);
    liveVisitorsChannelRef.current = channel;

    const handlePresenceUpdate = (newState: RealtimePresenceState) => {
      const count = Object.keys(newState).length;
      // console.log('[DashboardOverview] Presence update:', newState, 'Count:', count);
      setLiveVisitorsCount(count);
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        // console.log('[DashboardOverview] Live visitors presence synced.');
        const presenceState = channel.presenceState();
        handlePresenceUpdate(presenceState);
        setIsLoadingLiveVisitors(false); 
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // console.log('[DashboardOverview] User joined:', newPresences);
        // Optimistically update, or rely on next sync/manual presenceState call if needed
        setLiveVisitorsCount(prevCount => prevCount + newPresences.length);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        // console.log('[DashboardOverview] User left:', leftPresences);
        setLiveVisitorsCount(prevCount => Math.max(0, prevCount - leftPresences.length));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // console.log('[DashboardOverview] Successfully subscribed to live visitors channel.');
          // Initial track might be needed if clients are not configured to track immediately on join
          // However, our LivePresenceTracker on client side should handle tracking.
          // Fetch initial state again in case sync was missed or something odd happened before subscribe confirmation
           const currentPresenceState = channel.presenceState();
           handlePresenceUpdate(currentPresenceState);
           setIsLoadingLiveVisitors(false);
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          console.error(`[DashboardOverview] Error subscribing to live visitors channel: ${status}`);
          setIsLoadingLiveVisitors(false);
          setLiveVisitorsCount(0); // Reset on error
        }
      });

    return () => {
      // console.log('[DashboardOverview] Cleaning up live visitors channel.');
      if (liveVisitorsChannelRef.current) {
        supabase.removeChannel(liveVisitorsChannelRef.current)
          .catch(err => console.error('[DashboardOverview] Error removing live visitors channel:', err));
        liveVisitorsChannelRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 sm:gap-8 p-4 sm:p-6 md:p-8">
      {/* Top Controls: Refresh and Settings */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <Card className="shadow-lg">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl md:text-3xl">Dashboard Overview</CardTitle>
                <CardDescription className="mt-1">
                  Key metrics and analytics for your portfolio. 
                  {lastRefreshed && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (Last updated: {formatDistanceToNow(lastRefreshed, { addSuffix: true })})
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3 sm:mt-0">
                <Button variant="outline" size="sm" onClick={handleManualRefresh} disabled={isRefreshing || isLoadingAppSettings}>
                  {isRefreshing && !isLoadingAppSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Refresh Data
                </Button>
                <div className="flex items-center space-x-2 border p-2 rounded-md hover:shadow-md transition-shadow w-full sm:w-auto">
                  {isLoadingAppSettings ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary"/>
                  ) : (
                      <Switch 
                          id="analytics-tracking-toggle" 
                          checked={isAnalyticsTrackingEnabled} 
                          onCheckedChange={handleToggleAnalyticsTracking} 
                      />
                  )}
                  <Label htmlFor="analytics-tracking-toggle" className="text-sm">
                      Analytics Tracking {isAnalyticsTrackingEnabled ? 'On' : 'Off'}
                  </Label>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard 
          title="Live Visitors"
          value={liveVisitorsCount}
          icon={Wifi} 
          description="Users currently on your site"
          isLoading={isLoadingLiveVisitors}
          valueClassName="text-green-600 dark:text-green-400"
        />
        <StatCard 
            title="Total Project Views" 
            value={totalProjectViews} 
            icon={Eye} 
            description="All time views across all projects" 
            isLoading={isLoadingTotalProjectViews} 
            valueClassName="text-sky-600 dark:text-sky-400"
        />
        <StatCard
          title="Most Viewed Project"
          value={mostViewedProjectData.title || 'N/A'} 
          icon={Eye}
          description={isLoadingMostViewedProject ? 'Loading...' : `With ${mostViewedProjectData.views ?? 0} views`}
          isLoading={isLoadingMostViewedProject}
          valueClassName={mostViewedProjectData.title === 'Error' || mostViewedProjectData.title === 'N/A (No Views)' || mostViewedProjectData.title === 'DB Error' ? 'text-destructive dark:text-red-400' : 'text-purple-600 dark:text-purple-400'}
          descriptionClassName="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Most Interacted Skill"
          value={mostInteractedSkillData.name || 'N/A'}
          icon={Brain}
          description={isLoadingMostInteractedSkill ? 'Loading...' : `With ${mostInteractedSkillData.interactions ?? 0} interactions`}
          isLoading={isLoadingMostInteractedSkill}
          valueClassName={mostInteractedSkillData.name === 'Error' || mostInteractedSkillData.name === 'N/A' || mostInteractedSkillData.name === 'DB Error' ? 'text-destructive dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}
          descriptionClassName="text-blue-600 dark:text-blue-400"
        />
        <StatCard 
            title="Resume Downloads" 
            value={totalResumeDownloads} 
            icon={Download} 
            description="Total times resume downloaded" 
            isLoading={isLoadingResumeDownloads} 
            valueClassName="text-rose-600 dark:text-rose-400"
        />
        <StatCard 
            title="Recent Submissions" 
            value={recentSubmissionsCount} 
            icon={Mail} 
            description="Contacts in last 7 days" 
            isLoading={isLoadingRecentSubmissions} 
            valueClassName="text-teal-600 dark:text-teal-400"
        />
        <DatabaseSizeStatCard 
          title="Database Size" 
          currentSizeMB={databaseSize ? parseFloat(databaseSize) : null} 
          maxSizeMB={maxDatabaseSizeMB || 1024}
          description="Estimated size of PostgreSQL DB" 
          isLoading={isLoadingDbSize} 
        />
        <BucketStorageStatCard
          title="Bucket Storage"
          currentSizeMB={bucketStorageUsedBytes !== null ? bucketStorageUsedBytes / (1024 * 1024) : null}
          maxSizeMB={maxBucketStorageMB}
          description="Approx. total for all buckets"
          isLoading={isLoadingBucketStorage}
        />
      </div>

      {/* Visitor Analytics Section - Charts */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeInOut" }}
      >
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl md:text-2xl flex items-center"><BarChart3 className="mr-2 h-5 w-5 md:h-6 md:w-6 text-primary"/> Visitor Analytics</CardTitle>
            <CardDescription className="mt-1">Insights into your website visitors and their interactions.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 pt-2">
            
            {/* Device Type Distribution Chart (Existing) */}
            <Card className="col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1 min-h-[280px] shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-lg flex items-center"><Users className="mr-2 h-4 w-4" />Device Types</CardTitle>
                <CardDescription className="text-xs mt-0.5">Visitor device distribution.</CardDescription>
              </CardHeader>
              <CardContent className="h-[220px] sm:h-[200px] pb-4">
                {isLoadingDeviceTypeData ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : deviceTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deviceTypeData} layout="horizontal" margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={50} interval={0} fontSize={10}/>
                      <YAxis allowDecimals={false}/>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))'}} 
                        labelStyle={{ fontWeight: 'bold' }}
                        formatter={(value: number, name: string, props: any) => [`${value} visitors`, props.payload.name]}
                      />
                      <Bar dataKey="visitors" radius={[4, 4, 0, 0]} animationDuration={1000}>
                        {deviceTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No device data available.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social Media Clicks Chart (New) */}
            <SocialMediaClicksChart refreshTrigger={lastRefreshed} /> 
            
            {/* Placeholder for more charts in this section */}
            {/* <Card className="col-span-1"><CardHeader><CardTitle>Future Chart</CardTitle></CardHeader><CardContent><p>...</p></CardContent></Card> */}

          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
}

    
