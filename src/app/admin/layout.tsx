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
import { Users, BookCopy, ClipboardCheck, LogOut, Loader2, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Image from 'next/image';


const navItems = [
  { href: '/admin/subjects', label: 'المواد الدراسية', icon: Library },
  { href: '/admin/students', label: 'الطلاب', icon: Users },
  { href: '/admin/assignments', label: 'التكليفات', icon: ClipboardCheck },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
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

  if (!user || user.role !== 'admin') {
    router.replace('/login');
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar side="right">
          <SidebarHeader>
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-sidebar-primary-foreground/80 hover:text-sidebar-primary-foreground">
              <Image src="https://i.suar.me/lpqVn/l" alt="Farsi Hub Logo" width={28} height={28} className="h-7 w-7" />
              <span className="text-foreground">فارسي هب</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(item.href)}
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
          <SidebarFooter className='border-t p-2'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start h-auto px-2 py-1.5">
                  <div className='flex items-center gap-3'>
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user.photoURL ?? ''} alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className='flex flex-col items-start'>
                      <span className="font-semibold text-sm text-foreground">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
                <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <div className='flex flex-col h-full'>
                <header className="flex h-16 items-center justify-between border-b px-6 lg:justify-end">
                    <div className="lg:hidden">
                        <SidebarTrigger />
                    </div>
                    <h1 className='font-semibold text-lg'>لوحة تحكم المسؤول</h1>
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
