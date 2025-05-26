
"use client";

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Duration of the zoomInOutNumber CSS animation for EACH number
const PRELOADER_ANIMATION_DURATION_MS = 300; 
// How long each number is considered "on screen" before triggering the next
const NUMBER_VISIBLE_DURATION_MS = PRELOADER_ANIMATION_DURATION_MS; // For seamless transition

// Fallback to hide preloader if anything goes wrong
const TOTAL_SEQUENCE_TIME = NUMBER_VISIBLE_DURATION_MS * 3; // Time for 1, 2, 3
const FALLBACK_BUFFER_MS = 500; // Extra buffer
const ABSOLUTE_FALLBACK_TIMEOUT_MS = TOTAL_SEQUENCE_TIME + FALLBACK_BUFFER_MS;

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true);
  // Start currentNumber as null, so "1" appears with its animation on the first step
  const [currentNumber, setCurrentNumber] = useState<number | null>(null); 

  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // This effect sets up the sequence and the absolute fallback
    // It should only run once, or if isLoading were to change back to true (which it doesn't in this flow)
    if (!isLoading) { 
      return; // If already set to not loading, do nothing
    }

    console.log("[Preloader] Starting sequence setup.");

    // Sequence: 1 -> 2 -> 3 -> Hide
    // A small initial delay before showing "1" can sometimes help ensure
    // the browser is ready for the first animation.
    const initialDelay = 50; 

    const t1 = setTimeout(() => {
      console.log("[Preloader] Displaying 1");
      setCurrentNumber(1);
      const t2 = setTimeout(() => {
        console.log("[Preloader] Displaying 2");
        setCurrentNumber(2);
        const t3 = setTimeout(() => {
          console.log("[Preloader] Displaying 3");
          setCurrentNumber(3);
          const t4 = setTimeout(() => {
            console.log("[Preloader] Sequence 1-2-3 completed. Hiding preloader.");
            setIsLoading(false);
          }, NUMBER_VISIBLE_DURATION_MS); // Time for "3" to display & animate
          timeoutIdsRef.current.push(t4);
        }, NUMBER_VISIBLE_DURATION_MS); // Time for "2" to display & animate
        timeoutIdsRef.current.push(t3);
      }, NUMBER_VISIBLE_DURATION_MS); // Time for "1" to display & animate
      timeoutIdsRef.current.push(t2);
    }, initialDelay);
    timeoutIdsRef.current.push(t1);

    // Absolute fallback timer
    const fallbackTimer = setTimeout(() => {
      if (isLoading) { // Only force hide if it's still loading
        console.warn("[Preloader] Absolute fallback timeout reached. Forcing hide.");
        setIsLoading(false);
      }
    }, ABSOLUTE_FALLBACK_TIMEOUT_MS + initialDelay); // Account for initial delay
    timeoutIdsRef.current.push(fallbackTimer);

    // Cleanup function to clear all timeouts
    return () => {
      console.log("[Preloader] Cleanup: Clearing all timeouts.");
      timeoutIdsRef.current.forEach(clearTimeout);
      timeoutIdsRef.current = [];
    };
  }, []); // Empty dependency array: run once on mount

  // window.onload listener - can be used to potentially speed up hiding if page loads faster than sequence
  // For this strict 1-2-3 requirement, we primarily rely on the sequence timer.
  // However, it's good practice to have it if you want an option to hide sooner.
  const windowLoadFiredRef = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleWindowLoad = () => {
        if (windowLoadFiredRef.current) return;
        windowLoadFiredRef.current = true;
        console.log("[Preloader] Window loaded.");
        // Potentially, if the sequence is long and window loads fast, you could decide to shorten it.
        // For now, we let the 1-2-3 sequence complete as the primary driver for hiding.
    };
    
    if (document.readyState === 'complete') {
        handleWindowLoad();
    } else {
        window.addEventListener('load', handleWindowLoad);
    }
    return () => {
        window.removeEventListener('load', handleWindowLoad);
    };
  }, []);


  if (!isLoading) {
    return null; // Unmount the preloader when not loading
  }

  return (
    <div
      id="preloader-main-overlay"
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white",
      )}
      aria-hidden={!isLoading}
      role="status"
    >
      <div 
        className="text-7xl md:text-8xl lg:text-9xl font-bold text-white"
        // Add min-height/width to prevent layout shift if numbers have different visual widths
        style={{ minHeight: '1.2em', minWidth: '1.2em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {/* Render the current number only if it's between 1 and 3 */}
        {currentNumber !== null && currentNumber >= 1 && currentNumber <= 3 && (
          <span
            key={currentNumber} // This is crucial to re-trigger the animation
            className="inline-block animate-zoomInOutNumber"
            style={{ animationDuration: `${PRELOADER_ANIMATION_DURATION_MS}ms` }}
          >
            {currentNumber}
          </span>
        )}
      </div>
    </div>
  );
}
