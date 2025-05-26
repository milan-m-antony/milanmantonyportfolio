import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from "@/components/ui/toaster";
import { Geist, Geist_Mono } from 'next/font/google';
import { supabase } from '@/lib/supabaseClient';
import type { LegalDocument } from '@/types/supabase';
import Preloader from '@/components/layout/Preloader';
import VisitTracker from '@/components/analytics/VisitTracker'; // Import the VisitTracker
import LivePresenceTracker from '@/components/utils/LivePresenceTracker'; // Import LivePresenceTracker

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "Milan M Antony | Portfolio",
  description: 'Personal portfolio of Milan, a creative developer showcasing projects, skills, and journey.',
};

async function getLegalDocument(id: string): Promise<LegalDocument | null> {
  console.log(`[RootLayout] Attempting to fetch legal document with ID: ${id}`);
  try {
    const { data, error, status, statusText } = await supabase
      .from('legal_documents')
      .select('id, title, content, updated_at')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      let errorMessage = `[RootLayout] Error fetching legal document ${id}. `;
      if (typeof error === 'object' && error !== null) {
        const supabaseError = error as { message?: string; details?: string; hint?: string; code?: string };
        errorMessage += `Message: ${supabaseError.message || 'N/A'}, Details: ${supabaseError.details || 'N/A'}, Hint: ${supabaseError.hint || 'N/A'}, Code: ${supabaseError.code || 'N/A'}. `;
      } else {
        try {
          errorMessage += `Received error: ${JSON.stringify(error)}. `;
        } catch (e) {
          errorMessage += `Received non-serializable error. `;
        }
      }
      errorMessage += `Status: ${status || 'N/A'} ${statusText || 'N/A'}.`;
      console.error(errorMessage);
      return null;
    }
    if (data) {
      console.log(`[RootLayout] Successfully fetched document: ${data.title} (updated: ${data.updated_at})`);
    } else {
      console.warn(`[RootLayout] No document found for ID: ${id}, returning null.`);
    }
    return data;
  } catch (e: any) {
    console.error(`[RootLayout] EXCEPTION while fetching legal document ${id}:`, e.message, e);
    return null;
  }
}
console.log("[RootLayout] Rendering RootLayout server component.");

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log("[RootLayout] Executing RootLayout async function.");
  const termsDocPromise = getLegalDocument('terms-and-conditions');
  const privacyDocPromise = getLegalDocument('privacy-policy');

  const [termsDoc, privacyDoc] = await Promise.all([termsDocPromise, privacyDocPromise]);

  console.log('[RootLayout] Rendering with termsDoc title:', termsDoc?.title, 'and privacyDoc title:', privacyDoc?.title);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon link tags - pointing to favicon_io subfolder */}
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon_io/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon_io/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon_io/favicon-16x16.png" />
        <link rel="manifest" href="/favicon_io/site.webmanifest" />
        <link rel="icon" href="/favicon_io/favicon.ico" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <VisitTracker /> {/* Add VisitTracker here, it's a client component */}
          <LivePresenceTracker /> {/* Add LivePresenceTracker here */}
          <Preloader />
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer termsContentData={termsDoc} privacyPolicyData={privacyDoc} />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
