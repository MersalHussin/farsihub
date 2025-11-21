"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { User, Trophy, Loader2, AlertTriangle } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


const navItems = [
  { href: '/student/profile', label: 'الملف الشخصي', icon: User },
  { href: '/student/achievements', label: 'الإنجازات', icon: Trophy },
];


export default function StudentLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (loading) return;

    if (!user) {
        router.replace('/login');
        return;
    }

    if (user.role !== 'student') {
        router.replace('/login');
        return;
    }

    // If user is a student but hasn't selected their year,
    // redirect them to onboarding, unless they are already on it.
    if (!user.year && pathname !== '/student/onboarding') {
        router.replace('/student/onboarding');
        return;
    }

  }, [user, loading, router, pathname]);


  if (loading || !user) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }
  
  // This layout is for onboarded students. The onboarding page has its own minimal layout.
  // We check the path to prevent the main layout from rendering on the onboarding page.
  if (pathname === '/student/onboarding') {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container mx-auto flex flex-col md:flex-row flex-grow py-6">
        <aside className="w-full md:w-64 md:border-l-2 md:pl-6">
          <nav className="flex flex-row md:flex-col gap-2 border-b-2 md:border-b-0 pb-4 mb-4">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                asChild
                className={cn(
                  'justify-start gap-3 flex-1 md:flex-none text-base md:text-sm px-4 py-3 h-auto',
                  pathname === item.href && 'bg-primary/10 text-primary font-bold'
                )}
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
        </main>
      </div>
    </div>
  );
}
