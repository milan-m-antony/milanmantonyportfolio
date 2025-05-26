import NextImage from 'next/image';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Certification } from '@/types/supabase'; 
import { cn } from '@/lib/utils';

interface CertificationCardProps {
  certification: Certification;
  onClick?: () => void;
}

export default function CertificationCard({ certification, onClick }: CertificationCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card",
        onClick && "cursor-pointer group/cert-card transform hover:-translate-y-1 hover:scale-[1.02]"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      aria-label={onClick ? `View details for ${certification.title}` : undefined}
    >
      <div className="relative w-full h-40">
        {certification.imageUrl ? (
          <NextImage
            src={certification.imageUrl}
            alt={certification.title || 'Certification image'}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 group-hover/cert-card:scale-105" // Removed dark mode inversion
            data-ai-hint={certification.title || 'certificate badge'}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted rounded-md">
            <p className="text-muted-foreground">Image not available</p>
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{certification.title}</CardTitle>
        <CardDescription>{certification.issuer} - Issued {certification.date}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pt-0 pb-2">
        {/* Placeholder for potential brief description if added to Certification type later */}
      </CardContent>
      <CardFooter className="mt-auto pt-2 pb-4">
        <p className="text-xs text-muted-foreground text-center w-full group-hover/cert-card:text-primary transition-colors duration-300">
          Click to preview certificate
        </p>
      </CardFooter>
    </Card>
  );
}
