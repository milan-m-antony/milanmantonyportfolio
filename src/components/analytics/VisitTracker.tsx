
"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { VisitorLog } from '@/types/supabase';

// Simple device detection based on screen width
const getDeviceType = (): VisitorLog['device_type'] => {
  if (typeof window === 'undefined') return 'Unknown';
  const width = window.innerWidth;
  if (width < 768) return 'Mobile';
  if (width < 1024) return 'Tablet';
  return 'Desktop';
};

const ADMIN_SITE_SETTINGS_ID = 'global_settings'; // Ensure this matches your settings table ID

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    console.log('[VisitTracker] Component mounted. Pathname:', pathname);

    // Only run tracking on the client-side
    if (typeof window === 'undefined') {
      console.log('[VisitTracker] Exiting: Not client-side.');
      return;
    }

    if (pathname.startsWith('/admin') || pathname.startsWith('/maintenance')) {
      console.log('[VisitTracker] Exiting: Admin or maintenance path.');
      return;
    }

    const logVisit = async () => {
      let isTrackingGloballyEnabled = true; // Default to true if setting fetch fails
      try {
        console.log('[VisitTracker] Fetching site settings for analytics tracking status...');
        const { data: settings, error: settingsError } = await supabase
            .from('site_settings')
            .select('is_analytics_tracking_enabled')
            .eq('id', ADMIN_SITE_SETTINGS_ID)
            .maybeSingle();

        if (settingsError) {
            console.warn('[VisitTracker] Error fetching site_settings:', settingsError.message);
            // Proceed with tracking if settings can't be fetched, or decide to disable.
        } else if (settings && settings.is_analytics_tracking_enabled === false) {
            isTrackingGloballyEnabled = false;
            console.log('[VisitTracker] Analytics tracking is globally disabled in site_settings.');
        } else if (settings && settings.is_analytics_tracking_enabled === true) {
            console.log('[VisitTracker] Analytics tracking is globally enabled in site_settings.');
        } else {
            console.log('[VisitTracker] No specific analytics tracking setting found or setting is null, defaulting to enabled.');
        }
      } catch (e: any) {
          console.warn('[VisitTracker] Exception fetching site_settings:', e.message);
          // Proceed with tracking if settings can't be fetched
      }

      if (!isTrackingGloballyEnabled) {
          console.log('[VisitTracker] Exiting: Global analytics tracking is disabled.');
          return;
      }

      const device_type = getDeviceType();
      const path_visited = pathname;
      const user_agent_string = navigator.userAgent;
      
      const visitData: Omit<VisitorLog, 'id' | 'visited_at'> = {
        device_type,
        path_visited,
        user_agent_string,
        // viewer_identifier: 'some_session_id_or_fingerprint', // Optional: for more advanced tracking
      };

      console.log('[VisitTracker] Attempting to log visit with data:', visitData);

      const { data: insertData, error: insertError } = await supabase
        .from('visitor_logs')
        .insert([visitData]);

      if (insertError) {
        console.error('[VisitTracker] Failed to log visit to Supabase:', JSON.stringify(insertError, null, 2));
        // Check for specific RLS violation error
        if (insertError.message.toLowerCase().includes('violates row-level security policy')) {
          console.error('[VisitTracker] RLS VIOLATION: Ensure "Public can insert visitor_logs" policy is active and correct on your visitor_logs table.');
        }
      } else {
        console.log('[VisitTracker] Visit logged successfully to Supabase. Inserted data:', insertData);
      }
    };

    // Log visit once per session for a given path to reduce noise,
    // or use a more sophisticated session tracking.
    const sessionKey = `visit_logged_${pathname}`;
    if (!sessionStorage.getItem(sessionKey)) {
      console.log(`[VisitTracker] No session lock for ${pathname}. Proceeding to log visit.`);
      logVisit();
      sessionStorage.setItem(sessionKey, 'true');
    } else {
      console.log(`[VisitTracker] Visit to ${pathname} already logged this session. Skipping.`);
    }
    
  // Only re-run if pathname changes significantly (not for hash changes)
  }, [pathname]); 

  return null; 
}
