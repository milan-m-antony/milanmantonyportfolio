
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
      <p className="text-sm text-muted-foreground">Loading admin area...</p>
    </div>
  );
}
