
"use client";

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Download, Coffee } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { AboutContent } from '@/types/supabase'; // For prop type

// Typewriter component (remains the same)
const Typewriter = ({ text, speed = 100, onComplete, className }: { text: string, speed?: number, onComplete?: () => void, className?: string }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsCompleted(false);
  }, [text]);

  useEffect(() => {
    if (!isCompleted && currentIndex < text.length) {
      const timeoutId = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeoutId);
    } else if (!isCompleted && currentIndex === text.length && text.length > 0) {
      setIsCompleted(true);
      if (onComplete) {
        onComplete();
      }
    }
  }, [currentIndex, text, speed, onComplete, isCompleted]);

  return <span className={className}>{displayedText || <>&nbsp;</>}</span>;
};

interface AboutSectionClientViewProps {
  content: Omit<AboutContent, 'id' | 'updated_at'>; // Only need the displayable content
}

export default function AboutSectionClientView({ content }: AboutSectionClientViewProps) {
  const [typingStage, setTypingStage] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const handleScroll = () => {
    if (typeof window !== 'undefined') {
      setOffsetY(window.pageYOffset);
    }
  };

  useEffect(() => {
    const startTimer = setTimeout(() => setTypingStage(1), 500);
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll);
    }
    return () => {
      clearTimeout(startTimer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);
  
  const headlineMain = content.headline_main ?? "";
  const headlineCodeKeyword = content.headline_code_keyword ?? "";
  const headlineConnector = content.headline_connector ?? "";
  const headlineCreativityKeyword = content.headline_creativity_keyword ?? "";
  
  // Changed fallbacks to null for paragraphs
  const paragraph1 = content.paragraph1 ?? null;
  const paragraph2 = content.paragraph2 ?? null;
  const paragraph3 = content.paragraph3 ?? null;
  
  const imageUrl = content.imageUrl ?? null; // Default to null if not provided, allows conditional rendering
  const imageTagline = content.image_tagline ?? null;

  const parallaxStyleContainer = (factor: number) => ({
    transform: `translateY(${offsetY * factor}px)`,
    transition: 'transform 0.2s ease-out'
  });

  const parallaxStyle = (factor: number) => ({
    transform: `translateY(${offsetY * factor}px)`,
    transition: 'transform 0.1s ease-out'
  });

  return (
    <div style={parallaxStyleContainer(0.05)}>
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 animate-fadeIn md:order-1" style={{animationDelay: '0.3s', ...parallaxStyle(0.15)}}>
          <h3 className="text-3xl font-semibold text-foreground leading-tight min-h-[2.5em]">
            {typingStage === 0 && <span className="invisible">{headlineMain}{headlineCodeKeyword}{headlineConnector}{headlineCreativityKeyword}</span>}
            {typingStage >= 1 && <Typewriter text={headlineMain} speed={70} onComplete={() => setTypingStage(s => Math.max(s, 2))} />}
            {typingStage >= 2 && <Typewriter text={headlineCodeKeyword} speed={120} className="text-primary" onComplete={() => setTypingStage(s => Math.max(s, 3))} />}
            {typingStage >= 3 && <Typewriter text={headlineConnector} speed={70} onComplete={() => setTypingStage(s => Math.max(s, 4))} />}
            {typingStage >= 4 && <Typewriter text={headlineCreativityKeyword} speed={120} className="text-accent" />}
          </h3>
          
          {paragraph1 && (
            <p className="text-muted-foreground text-lg">
              {paragraph1}
            </p>
          )}
          {paragraph2 && (
            <p className="text-muted-foreground">
              {paragraph2}
            </p>
          )}
          {paragraph3 && (
            <p className="text-muted-foreground">
              {paragraph3}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button asChild size="lg">
              <Link href="#contact">
                Let's Talk <Coffee className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#resume"> 
                My Resume <Download className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
        {imageUrl && ( // Conditionally render the image section if imageUrl exists
          <div 
            className="relative h-96 md:h-[450px] rounded-lg overflow-hidden shadow-xl group animate-fadeIn hidden md:block md:order-2" 
            style={{animationDelay: '0.4s', ...parallaxStyle(0.2)}}
          >
            <Image
              src={imageUrl}
              alt="Milan working on a project" 
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-500 group-hover:scale-105"
              data-ai-hint="developer working"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            {imageTagline && (
              <div className="absolute bottom-4 left-4 text-white bg-black/40 p-3 rounded-md shadow-md">
                <p className="text-sm font-medium">{imageTagline}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
