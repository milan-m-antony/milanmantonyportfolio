
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import SectionTitle from '@/components/ui/SectionTitle';
import CertificationCard from '@/components/ui/CertificationCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Certification } from '@/types/supabase'; // Use Supabase type
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const AUTO_SLIDE_INTERVAL = 5000; // 5 seconds

interface CertificationsClientViewProps {
  initialCertificationsData: Certification[];
}

const getResponsiveVisibleCardsCount = () => {
  if (typeof window === 'undefined') return 1;
  if (window.innerWidth >= 1280) return 3;
  if (window.innerWidth >= 768) return 2;
  return 1;
};

export default function CertificationsClientView({ initialCertificationsData }: CertificationsClientViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [visibleCardsCountOnClient, setVisibleCardsCountOnClient] = useState<number>(1);
  
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalCertifications = initialCertificationsData.length;

  useEffect(() => {
    const calculateAndSetVisibleCards = () => {
      const count = getResponsiveVisibleCardsCount();
      setVisibleCardsCountOnClient(count);
    };

    calculateAndSetVisibleCards();
    window.addEventListener('resize', calculateAndSetVisibleCards);
    return () => window.removeEventListener('resize', calculateAndSetVisibleCards);
  }, []);

  const currentVisibleCards = visibleCardsCountOnClient;

  useEffect(() => {
    if (totalCertifications > 0 && currentVisibleCards > 0) {
      const maxPossibleIndex = Math.max(0, totalCertifications - currentVisibleCards);
      if (currentIndex > maxPossibleIndex) {
        setCurrentIndex(maxPossibleIndex);
      } else if (currentIndex < 0) {
        setCurrentIndex(0);
      }
    }
  }, [currentVisibleCards, totalCertifications, currentIndex]);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (totalCertifications <= currentVisibleCards) return;
    setCurrentIndex((prevIndex) => {
      const nextIndexCandidate = prevIndex + currentVisibleCards;
      if (nextIndexCandidate >= totalCertifications) {
        return 0; // Loop to the beginning
      }
      return Math.min(nextIndexCandidate, totalCertifications - currentVisibleCards);
    });
  }, [totalCertifications, currentVisibleCards]);

  useEffect(() => {
    resetTimeout();
    if (!isPaused && totalCertifications > currentVisibleCards) {
      timeoutRef.current = setTimeout(handleNext, AUTO_SLIDE_INTERVAL);
    }
    return () => {
      resetTimeout();
    };
  }, [currentIndex, isPaused, totalCertifications, currentVisibleCards, resetTimeout, handleNext]);

  const handlePrev = () => {
    if (totalCertifications <= currentVisibleCards) return;
    setCurrentIndex((prevIndex) => {
      const prevIndexCandidate = prevIndex - currentVisibleCards;
      if (prevIndexCandidate < 0) {
        return Math.max(0, totalCertifications - currentVisibleCards); // Loop to the end
      }
      return prevIndexCandidate;
    });
  };

  const handleCertificationClick = (certification: Certification) => {
    setSelectedCertification(certification);
    setIsModalOpen(true);
  };

  if (!initialCertificationsData || totalCertifications === 0) {
    return (
      <>
        <SectionTitle subtitle="A collection of certifications and badges.">
          Certifications & Badges
        </SectionTitle>
        <p className="text-center text-muted-foreground">No certifications to display at the moment. Data will be populated from Supabase.</p>
      </>
    );
  }

  const cardWidthPercentage = currentVisibleCards > 0 ? 100 / currentVisibleCards : 100;

  return (
    <>
      <SectionTitle subtitle="A collection of certifications and badges earned from reputable platforms, validating my expertise.">
        Certifications & Badges
      </SectionTitle>

      <div
        className="relative group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div className="overflow-hidden rounded-lg">
          {visibleCardsCountOnClient !== null ? ( // Check if client-side calculation is done
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${(currentIndex * 100) / totalCertifications * (totalCertifications / currentVisibleCards)}%)` }}
              role="list"
            >
              {initialCertificationsData.map((cert, index) => (
                <div
                  key={cert.id}
                  className="flex-shrink-0 p-1 md:p-2 box-border"
                  style={{ width: `${cardWidthPercentage}%` }}
                  role="listitem"
                  aria-hidden={!(index >= currentIndex && index < currentIndex + currentVisibleCards)}
                >
                  <CertificationCard 
                    certification={cert} 
                    onClick={() => handleCertificationClick(cert)} 
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center h-80">
               <p className="text-muted-foreground">Loading certifications...</p>
            </div>
          )}
        </div>

        {visibleCardsCountOnClient !== null && totalCertifications > currentVisibleCards && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 ml-1 sm:ml-2 md:ml-4 opacity-70 group-hover:opacity-100 transition-opacity bg-background/50 hover:bg-background/80 focus:opacity-100"
              onClick={handlePrev}
              aria-label="Previous certification"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 mr-1 sm:mr-2 md:mr-4 opacity-70 group-hover:opacity-100 transition-opacity bg-background/50 hover:bg-background/80 focus:opacity-100"
              onClick={handleNext}
              aria-label="Next certification"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>

      {selectedCertification && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-3xl w-full p-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle>{selectedCertification.title}</DialogTitle>
              <DialogDescription>Issued by {selectedCertification.issuer} on {selectedCertification.date}</DialogDescription>
            </DialogHeader>
            <div className="p-4">
              <div className="relative w-full aspect-[3/2] max-h-[70vh]"> 
                {selectedCertification.imageUrl ? (
                  <Image
                    src={selectedCertification.imageUrl}
                    alt={`Certificate for ${selectedCertification.title}`}
                    layout="fill"
                    objectFit="contain" 
                    className="rounded-md"
                    data-ai-hint={`${selectedCertification.imageHint || 'certificate'} preview`}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted rounded-md">
                    <p className="text-muted-foreground">Image not available</p>
                  </div>
                )}
              </div>
              {selectedCertification.verifyUrl && (
                <div className="mt-4 text-center">
                  <Button asChild variant="link">
                    <a href={selectedCertification.verifyUrl} target="_blank" rel="noopener noreferrer">
                      Verify Credential
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
