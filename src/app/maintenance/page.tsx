
// src/app/maintenance/page.tsx
import { createClient } from '@supabase/supabase-js';
import { type Metadata } from 'next';
import { AlertTriangle } from 'lucide-react'; // For a visual cue

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_SITE_SETTINGS_ID = 'global_settings';

export const metadata: Metadata = {
  title: 'Under Maintenance',
  description: 'Our site is currently undergoing scheduled maintenance.',
  // Prevent indexing of the maintenance page
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

async function getMaintenanceMessage(): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Maintenance Page: Supabase URL or Anon Key is not defined.');
    return 'We are currently performing scheduled maintenance. Please check back soon.';
  }

  // Create a new Supabase client instance for server-side fetching
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('maintenance_message')
      .eq('id', ADMIN_SITE_SETTINGS_ID)
      .single(); // Use single as we expect it to exist

    if (error) {
      console.error('Maintenance Page: Error fetching maintenance message:', error.message);
      return 'We are currently performing scheduled maintenance. We will be back online shortly.';
    }
    return data?.maintenance_message || 'The site is currently undergoing maintenance. We appreciate your patience.';
  } catch (e: any) {
    console.error('Maintenance Page: Exception fetching maintenance message:', e.message);
    return 'An error occurred while fetching the maintenance status. Please try again later.';
  }
}

export default async function MaintenancePage() {
  const message = await getMaintenanceMessage();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center">
      <div className="max-w-lg w-full bg-card text-card-foreground p-8 rounded-xl shadow-2xl">
        <div className="mb-6">
          <AlertTriangle className="h-20 w-20 text-primary mx-auto animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold text-card-foreground mb-4">
          Site Under Maintenance
        </h1>
        <p className="text-lg text-card-foreground/80 leading-relaxed">
          {message}
        </p>
        <p className="mt-8 text-sm text-muted-foreground">
          We appreciate your patience and understanding.
        </p>
      </div>
    </div>
  );
}
