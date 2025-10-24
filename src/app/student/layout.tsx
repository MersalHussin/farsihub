"use client";

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookHeart, Home, BookCopy, FileQuestion, ClipboardCheck, User, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const navItems = [
  { href: '/student', label: 'لوحة التحكم', icon: Home },
  { href: '/student/lectures', label: 'المحاضرات', icon: BookCopy },
  { href: '/student/quizzes', label: 'الاختبارات', icon: FileQuestion },
  { href: '/student/assignments', label: 'التكليفات', icon: ClipboardCheck },
  { href: '/student/profile', label: 'الملف الشخصي', icon: User },
];

export default function StudentLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  if (!user || user.role !== 'student' || !user.approved) {
    router.replace('/login');
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar side="right">
          <SidebarHeader>
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-sidebar-primary-foreground/80 hover:text-sidebar-primary-foreground">
              <BookHeart className="h-7 w-7 text-primary" />
              <span className="text-foreground">فارسي هب</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href || (item.href !== '/student' && pathname.startsWith(item.href))}
                      tooltip={{ children: item.label, side: 'left', align: 'center' }}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className='border-t'>
            <div className='flex items-center gap-3 p-3'>
              <Avatar>
                  <AvatarImage src={user.photoURL ?? ''} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className='flex flex-col'>
                <span className="font-semibold text-sm text-foreground">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>
            <Button onClick={logout} variant="ghost" className="w-full justify-start gap-2">
                <LogOut />
                تسجيل الخروج
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <div className='flex flex-col h-full'>
                <header className="flex h-16 items-center justify-between border-b px-6 lg:justify-start">
                    <div className="lg:hidden">
                        <SidebarTrigger />
                    </div>
                    <div className="font-semibold text-lg hidden lg:block">
                        أهلاً بك، {user.name}!
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                  {children}
                </main>
            </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
