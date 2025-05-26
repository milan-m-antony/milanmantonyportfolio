import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SectionTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  className?: string;
  subtitle?: string;
}

export default function SectionTitle({ children, className, subtitle, ...props }: SectionTitleProps) {
  return (
    <div className="mb-12 text-center"> {/* Reverted from mb-10 to mb-12 */}
      <h2
        className={cn('text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-foreground', className)}
        {...props}
      >
        {children}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto"> {/* Reverted from mt-3 to mt-4 */}
          {subtitle}
        </p>
      )}
    </div>
  );
}
