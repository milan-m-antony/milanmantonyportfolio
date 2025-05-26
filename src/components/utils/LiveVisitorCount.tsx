'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
// import { Users } from 'lucide-react'; // Icon for styling

const PRESENCE_CHANNEL_NAME = 'live-visitors';

const LiveVisitorCount: React.FC = () => {
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window === 'undefined') {
      return;
    }

    const channel = supabase.channel(PRESENCE_CHANNEL_NAME, {
      // This component is only observing, so it doesn't need to set its own presence key
      // config: {
      //   presence: {
      //     key: 'observer-' + Math.random().toString(36).substring(2, 9), // Optional: give observer a unique key if needed for debugging
      //   },
      // },
    });
    channelRef.current = channel;

    const handleSync = () => {
      if (channelRef.current) {
        const presenceState: RealtimePresenceState = channelRef.current.presenceState();
        const count = Object.keys(presenceState).length;
        setVisitorCount(count);
        console.log('[LiveVisitorCount] Presence sync. Current state:', presenceState, 'Count:', count);
      }
    };

    channel
      .on('presence', { event: 'sync' }, handleSync)
      .on('presence', { event: 'join' }, (payload) => {
        console.log('[LiveVisitorCount] Presence join:', payload);
        // handleSync(); // Re-sync to get accurate count after join
         setVisitorCount(prevCount => prevCount + 1); // Optimistic update for join
      })
      .on('presence', { event: 'leave' }, (payload) => {
        console.log('[LiveVisitorCount] Presence leave:', payload);
        // handleSync(); // Re-sync to get accurate count after leave
        setVisitorCount(prevCount => Math.max(0, prevCount - 1)); // Optimistic update for leave
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[LiveVisitorCount] Subscribed to presence channel. Performing initial sync.');
          setIsConnected(true);
          // Perform initial sync once subscribed
          handleSync(); 
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[LiveVisitorCount] Subscription error on presence channel.');
          setIsConnected(false);
        } else if (status === 'TIMED_OUT') {
          console.error('[LiveVisitorCount] Subscription timed out on presence channel.');
          setIsConnected(false);
        } else {
          console.log('[LiveVisitorCount] Presence channel status:', status);
          setIsConnected(false);
        }
      });

    return () => {
      if (channelRef.current) {
        console.log('[LiveVisitorCount] Cleaning up presence channel.');
        supabase.removeChannel(channelRef.current)
          .catch(err => console.error('[LiveVisitorCount] Error removing presence channel:', err));
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, []);

  // If visitorCount is 0, render nothing
  if (visitorCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center text-sm text-foreground" title={`${visitorCount} live visitor${visitorCount === 1 ? '' : 's'}`}>
      {/* <Users className="h-4 w-4 mr-2 text-primary" /> */}
      <span>{visitorCount}</span>
    </div>
  );
};

export default LiveVisitorCount; 