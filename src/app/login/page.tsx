
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page as login is no longer used
    router.replace('/');
  }, [router]);

  // Render null or a simple message while redirecting
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <p>Redirecting...</p>
    </div>
  );
}
