
"use server"; // Make this a Server Component

import { supabase } from '@/lib/supabaseClient';
import SectionWrapper from '@/components/ui/SectionWrapper';
import SectionTitle from '@/components/ui/SectionTitle';
import type { Certification } from '@/types/supabase'; // Use the Supabase-aligned type
import CertificationsClientView from './CertificationsClientView'; // New client component

async function getCertifications(): Promise<Certification[]> {
  const { data, error } = await supabase
    .from('certifications')
    .select('*')
    .order('created_at', { ascending: false }); // Example ordering

  if (error) {
    console.error('Error fetching certifications:', error);
    return [];
  }
  // Map Supabase row to Certification type, e.g., image_url to imageUrl
  return data.map(c => ({
    ...c,
    imageUrl: c.image_url,
    imageHint: c.image_hint,
    verifyUrl: c.verify_url,
  })) as Certification[];
}


export default async function CertificationsSection() {
  const certificationsData = await getCertifications();

  return (
    <SectionWrapper id="certifications" className="bg-background section-fade-in" style={{ animationDelay: '1.0s' }}>
      <CertificationsClientView initialCertificationsData={certificationsData} />
    </SectionWrapper>
  );
}

