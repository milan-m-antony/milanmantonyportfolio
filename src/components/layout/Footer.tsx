
"use client";

import { FileText, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LegalDocument } from '@/types/supabase';
import { format, parseISO, isValid } from 'date-fns';

type ModalContentType = 'terms' | 'privacy' | null;

interface FooterProps {
  termsContentData: LegalDocument | null;
  privacyPolicyData: LegalDocument | null;
}

export default function Footer({ termsContentData, privacyPolicyData }: FooterProps) {
  const pathname = usePathname();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [openModal, setOpenModal] = useState<ModalContentType>(null);
  const [modalContent, setModalContent] = useState<{ title: string, content: string, lastUpdated: string | null }>({ title: '', content: '', lastUpdated: null });
  const [isMounted, setIsMounted] = useState(false);
  const [shouldRenderFooter, setShouldRenderFooter] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (pathname.startsWith('/admin')) {
        setShouldRenderFooter(false);
      } else {
        setShouldRenderFooter(true);
      }
    }
  }, [pathname, isMounted]);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    // Log received props for debugging
    // console.log('[Footer] Props received: termsContentData updated_at:', termsContentData?.updated_at, 'privacyPolicyData updated_at:', privacyPolicyData?.updated_at);
  }, [termsContentData, privacyPolicyData]); // Removed currentYear from dependencies as it's set once

  const formatLastUpdated = (dateString: string | undefined | null) => {
    if (!dateString) return null;
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, "MMMM d, yyyy 'at' h:mm a") : "Date unavailable";
    } catch (error) {
      console.error("[Footer] Error formatting date:", error);
      return "Date unavailable";
    }
  };

  const handleOpenModal = (type: ModalContentType) => {
    // console.log(`[Footer] handleOpenModal called for type: ${type}`);
    let newModalContent = { title: '', content: '<p>Content currently unavailable. Please check back later.</p>', lastUpdated: null };

    if (type === 'terms') {
      if (termsContentData) {
        // console.log('[Footer] Using termsContentData for modal:', termsContentData.title, termsContentData.updated_at);
        newModalContent = {
          title: termsContentData.title || 'Terms & Conditions',
          content: termsContentData.content || '<p>Terms and Conditions content not available.</p>',
          lastUpdated: formatLastUpdated(termsContentData.updated_at)
        };
      } else {
        // console.log('[Footer] termsContentData is null for modal.');
      }
    } else if (type === 'privacy') {
      if (privacyPolicyData) {
        // console.log('[Footer] Using privacyPolicyData for modal:', privacyPolicyData.title, privacyPolicyData.updated_at);
        newModalContent = {
          title: privacyPolicyData.title || 'Privacy Policy',
          content: privacyPolicyData.content || '<p>Privacy Policy content not available.</p>',
          lastUpdated: formatLastUpdated(privacyPolicyData.updated_at)
        };
      } else {
        // console.log('[Footer] privacyPolicyData is null for modal.');
      }
    }
    setModalContent(newModalContent);
    setOpenModal(type);
  };

  const handleCloseModal = () => {
    setOpenModal(null);
  };

  if (!isMounted || !shouldRenderFooter) {
    return null; // Don't render anything if not mounted or if it's an admin path (after mount)
  }

  return (
    <>
      <footer className="border-t border-border/40 bg-background">
        <div className="container mx-auto flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center">
            <p className="text-sm leading-loose text-muted-foreground">
              &copy; {currentYear} Milan. All rights reserved.
            </p>
            <span className="hidden sm:inline-block text-muted-foreground mx-1">|</span>
            <Button
              variant="link"
              className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto"
              onClick={() => handleOpenModal('terms')}
            >
              Terms & Conditions
            </Button>
            <span className="hidden sm:inline-block text-muted-foreground mx-1">·</span>
            <Button
              variant="link"
              className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto"
              onClick={() => handleOpenModal('privacy')}
            >
              Privacy Policy
            </Button>
          </div>
        </div>
      </footer>

      <Dialog open={openModal !== null} onOpenChange={(isOpen) => !isOpen && handleCloseModal()}>
        <DialogContent className="max-w-2xl sm:max-w-3xl md:max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl">
              {openModal === 'terms' && <FileText className="mr-2 h-6 w-6 text-primary" />}
              {openModal === 'privacy' && <ShieldCheck className="mr-2 h-6 w-6 text-primary" />}
              {modalContent.title}
            </DialogTitle>
            <DialogDescription>
              {openModal === 'terms' ? "Please read these terms carefully." : "Your privacy is important to us."}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-6">
            <article
              className="prose dark:prose-invert max-w-none text-sm text-foreground/80 py-4"
              dangerouslySetInnerHTML={{ __html: modalContent.content }}
            />
            {modalContent.lastUpdated && (
              <p className="mt-6 text-xs text-muted-foreground">
                Last updated: {modalContent.lastUpdated}
              </p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
