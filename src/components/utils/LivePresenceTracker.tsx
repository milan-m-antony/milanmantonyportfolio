'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

const PRESENCE_CHANNEL_NAME = 'live-visitors';

// Function to get or generate a unique key for the visitor
const getVisitorKey = async (): Promise<string> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch (error) {
    console.warn("[LivePresenceTracker] Error getting session for visitor key:", error);
  }
  // Fallback for anonymous users: generate and store a key in session storage
  let anonymousId = sessionStorage.getItem('visitorAnonymousId');
  if (!anonymousId) {
    anonymousId = `anonymous-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
    sessionStorage.setItem('visitorAnonymousId', anonymousId);
  }
  return anonymousId;
};

const LivePresenceTracker: React.FC = () => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const visitorKeyRef = useRef<string | null>(null); // To store the resolved key

  useEffect(() => {
    let isMounted = true;
    let localChannel: RealtimeChannel | null = null; // Temporary channel variable for setup

    const setupPresence = async () => {
      if (!isMounted) return;

      const key = await getVisitorKey();
      if (!isMounted) return; // Check again after await
      visitorKeyRef.current = key; // Store the key

      // Initialize channel with the resolved key in presence config
      localChannel = supabase.channel(PRESENCE_CHANNEL_NAME, {
        config: {
          presence: {
            key: visitorKeyRef.current, // Use the resolved key
          },
        },
      });
      channelRef.current = localChannel;

      localChannel
        .on('presence', { event: 'sync' }, () => {
          console.log('[LivePresenceTracker] Presence synced for key:', visitorKeyRef.current);
          // Track is implicitly handled by Supabase if key is in config
          // If you need to send extra info with track, do it here or on 'SUBSCRIBED'
        })
        .subscribe((status) => {
          if (!isMounted || channelRef.current !== localChannel) return; // Ensure we are acting on the current channel

          if (status === 'SUBSCRIBED') {
            console.log('[LivePresenceTracker] Subscribed to presence channel with key:', visitorKeyRef.current);
            // You can explicitly track additional info if needed, though presence is active due to config key
            channelRef.current?.track({ online_at: new Date().toISOString(), clientKey: visitorKeyRef.current });
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[LivePresenceTracker] Subscription error on presence channel with key:', visitorKeyRef.current);
          } else if (status === 'TIMED_OUT') {
            console.error('[LivePresenceTracker] Subscription timed out on presence channel with key:', visitorKeyRef.current);
          }
        });
    };

    setupPresence();

    return () => {
      isMounted = false;
      const currentChannel = channelRef.current; // Use the ref's current value
      if (currentChannel) {
        console.log('[LivePresenceTracker] Cleaning up presence channel for key:', visitorKeyRef.current);
        // No need to explicitly untrack if key was in config, unsubscribing handles it.
        supabase.removeChannel(currentChannel)
          .catch(err => console.error('[LivePresenceTracker] Error removing presence channel:', err));
        channelRef.current = null;
      }
    };
  }, []);

  return null; // This component does not render anything
};

export default LivePresenceTracker; 