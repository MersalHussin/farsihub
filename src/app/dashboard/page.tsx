"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait until loading is false
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (user.role === 'admin') {
      router.replace('/admin/profile');
    } else if (user.role === 'student') {
      if (!user.year) {
        router.replace('/student/onboarding');
      } else {
        router.replace('/student/profile');
      }
    }
    
  }, [user, loading, router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className='ml-4'>جارِ توجيهك...</p>
    </div>
  );
}
