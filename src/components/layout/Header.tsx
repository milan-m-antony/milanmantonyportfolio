"use client";

import Link from 'next/link';
import NextImage from 'next/image'; // Ensure NextImage is imported
import { useState, useEffect, type ReactNode, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, Sun, Moon, Home, User, Briefcase, Wrench, Map as MapIcon, Award, FileText, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';

const publicNavItems = [
  { href: '#hero', label: 'Home', icon: Home },
  { href: '#about', label: 'About', icon: User },
  { href: '#projects', label: 'Projects', icon: Briefcase },
  { href: '#skills', label: 'Skills', icon: Wrench },
  { href: '#timeline', label: 'Journey', icon: MapIcon },
  { href: '#certifications', label: 'Certifications', icon: Award },
  { href: '#resume', label: 'Resume', icon: FileText },
  { href: '#contact', label: 'Contact', icon: Mail },
];

const NavLinks = ({ onClick, activeHref }: { onClick?: () => void; activeHref: string; }) => (
  <>
    {publicNavItems.map((item) => {
      const IconComponent = item.icon;
      const isActive = item.href === activeHref;
      return (
        <Link
          key={item.label}
          href={item.href}
          onClick={() => {
            if (onClick) onClick();
          }}
          className={cn(
            "relative text-sm font-medium text-foreground/80 px-3 py-2 rounded-md flex items-center transition-colors duration-150 ease-in-out",
            isActive ? "text-primary font-semibold" : "group overflow-hidden hover:text-primary"
          )}
          aria-current={isActive ? "page" : undefined}
        >
          {isActive ? (
            <>
              <IconComponent className="h-5 w-5 mr-2 text-primary" />
              <span>{item.label}</span>
            </>
          ) : (
            <>
              <span className="inline-block transition-all duration-300 ease-in-out group-hover:translate-x-full group-hover:opacity-0">
                {item.label}
              </span>
              <IconComponent
                className="absolute left-3 top-1/2 transform -translate-y-1/2
                           inline-block transition-all duration-300 ease-in-out
                           translate-x-[-120%] group-hover:translate-x-0
                           text-primary opacity-0 group-hover:opacity-100 h-5 w-5"
              />
            </>
          )}
        </Link>
      );
    })}
  </>
);

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { theme, setTheme } = useTheme();
  const [activeLink, setActiveLink] = useState('');
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsClient(true); // Set to true once component mounts on client
  }, []);

  const determineActiveLink = useCallback(() => {
    if (typeof window === 'undefined' || !headerRef.current) {
      // Default to first link on initial server render or if headerRef not available yet
      // setActiveLink(navLinks.length > 0 ? navLinks[0].href : ''); 
      return;
    }

    const headerHeight = headerRef.current.offsetHeight;
    // fromTop is the imaginary line just below the header, against which sections are checked
    const fromTop = window.scrollY + headerHeight + 20; 

    let candidateHref = '';

    // Main loop: Check if 'fromTop' is INSIDE any section
    for (const link of publicNavItems) {
      const sectionId = link.href.substring(1);
      const section = document.getElementById(sectionId);

      if (section) {
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;

        // If 'fromTop' is within this section's bounds
        if (fromTop >= sectionTop && fromTop < sectionBottom) {
          candidateHref = link.href;
          break; // Found the section 'fromTop' is currently in
        }
      }
    }

    // If 'fromTop' is not strictly within any section (e.g., in padding, above first, or below last)
    if (!candidateHref) {
      // Find the last section whose top 'fromTop' has passed.
      // This means this section was the one active before entering padding.
      let lastPassedSectionHref = '';
      for (const link of publicNavItems) {
        const sectionId = link.href.substring(1);
        const section = document.getElementById(sectionId);
        if (section) {
          const sectionTop = section.offsetTop;
          if (sectionTop <= fromTop) { // If section's top is at or above 'fromTop'
            lastPassedSectionHref = link.href; // This section is a candidate
          } else {
            // If sectionTop is below fromTop, then previous (lastPassedSectionHref) was the one.
            // No need to check further down sections.
            break;
          }
        }
      }
      if (lastPassedSectionHref) {
        candidateHref = lastPassedSectionHref;
      }
    }
    
    // Override 1: At the very top of the page?
    // Use a small threshold for scrollY. headerHeight * 0.8 might be too large if header is tall.
    if (window.scrollY < 50) { 
      if (publicNavItems.length > 0) {
        const homeLink = publicNavItems.find(l => l.href === '#hero'); // Prefer explicit #hero
        candidateHref = homeLink ? homeLink.href : publicNavItems[0].href;
      }
    }

    // Override 2: At the very bottom of the page?
    const totalPageHeight = document.body.scrollHeight;
    // Check if bottom of viewport is at or past bottom of document
    const scrolledToBottom = (window.innerHeight + window.scrollY) >= (totalPageHeight - 5); // Small tolerance

    if (scrolledToBottom && publicNavItems.length > 0) {
      candidateHref = publicNavItems[publicNavItems.length - 1].href; // Activate the last link
    }
    
    // Final Safety Net: If no candidateHref is determined after all checks, and navLinks exist
    if (!candidateHref && publicNavItems.length > 0) {
      candidateHref = publicNavItems[0].href;
    }

    setActiveLink(candidateHref);
  }, [setActiveLink]); // Dependencies for useCallback

  useEffect(() => {
    if (isClient) {
      determineActiveLink();
      window.addEventListener('scroll', determineActiveLink, { passive: true });
      window.addEventListener('hashchange', determineActiveLink);
      window.addEventListener('resize', determineActiveLink);
    }

    return () => {
      if (isClient) {
        window.removeEventListener('scroll', determineActiveLink);
        window.removeEventListener('hashchange', determineActiveLink);
        window.removeEventListener('resize', determineActiveLink);
      }
    };
  }, [pathname, isClient, activeLink, determineActiveLink]); 

  const toggleTheme = () => {
    if (!isClient) return;
    let currentEffectiveTheme = theme;
    if (theme === 'system' && typeof window !== 'undefined') {
        currentEffectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    const newThemeToSet = currentEffectiveTheme === 'dark' ? 'light' : 'dark';
    setTheme(newThemeToSet);
  };
  
  if (isClient && pathname.startsWith('/admin')) {
    return null; // Don't render header on admin paths after client mount and path check
  }
  
  let themeIconContent: ReactNode = <div className="h-5 w-5" />; // Placeholder
  if (isClient) {
    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    themeIconContent = effectiveTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <NextImage 
            src="/logo.png" 
            alt="MLN Logo" 
            width={50} // Reduced width
            height={26} // Reduced height (adjust to maintain aspect ratio)
            priority 
          />
        </Link>

        <nav className="hidden md:flex items-center space-x-1">
          <NavLinks activeHref={activeLink} onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)} />
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            disabled={!isClient}
          >
            {themeIconContent}
          </Button>

          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu" className="transition-transform duration-300 ease-in-out hover:rotate-90">
                  {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[340px] p-0 transition-transform duration-500 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full"
              >
                <SheetHeader className="p-6 border-b text-left">
                  <SheetTitle>
                    <Link
                      href="/"
                      className="flex items-center gap-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <NextImage 
                        src="/logo.png" 
                        alt="MLN Logo" 
                        width={50} // Reduced width
                        height={26} // Reduced height
                        priority
                      />
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="p-6">
                  <nav className="flex flex-col space-y-3">
                    <NavLinks onClick={() => setIsMobileMenuOpen(false)} activeHref={activeLink} />
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

