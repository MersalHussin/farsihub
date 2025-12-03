
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LayoutDashboard, AlertTriangle, User } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Skeleton } from '../ui/skeleton';

function PendingApprovalBanner() {
    return (
        <div className="bg-yellow-500 border-b border-yellow-600 text-yellow-950 p-2 text-center text-sm flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>حسابك قيد المراجعة. قد تكون بعض الميزات محدودة حتى تتم الموافقة على حسابك.</span>
        </div>
    );
}

export function Header() {
  const { user, loading, logout } = useAuth();
  const isMobile = useIsMobile();
  const pathname = usePathname();

  const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';

  const navItems = [
    { href: '/', label: 'الرئيسية' },
    { href: '/lectures', label: 'المحاضرات' },
    { href: '/assignments', label: 'التكليفات' },
  ];

  const Logo = () => (
    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
        <Image src="https://i.suar.me/lpqVn/l" alt="Farsi Hub Logo" width={28} height={28} className="h-7 w-7" />
        <span>فارسي هب</span>
    </Link>
  );

  const NavLinks = ({ isMobile = false }) => (
    <nav className={cn("flex items-center gap-2", isMobile ? "flex-col" : "flex-row")}>
      {navItems.map((item) => (
        <Button
          key={item.href}
          variant="link"
          asChild
          className={cn(
            'text-foreground/80 hover:text-foreground hover:no-underline font-semibold',
            { 'text-primary font-bold': pathname === item.href },
            isMobile && 'w-full justify-start text-base'
          )}
        >
          <Link href={item.href}>{item.label}</Link>
        </Button>
      ))}
      {user?.role === 'admin' && (
         <Button
          variant="link"
          asChild
          className={cn(
            'text-foreground/80 hover:text-foreground hover:no-underline font-semibold',
             isMobile && 'w-full justify-start text-base'
          )}
        >
          <Link href="/admin">
            <LayoutDashboard className="ml-2 h-4 w-4" />
            لوحة التحكم
          </Link>
        </Button>
      )}
    </nav>
  );

  const AuthArea = ({ isMobile = false }) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient || loading) {
      return isMobile ? <div className='h-24 w-full' /> : <div className='h-10 w-10' />; 
    }

    if (user) {
      const profileUrl = user.role === 'admin' ? '/admin' : '/student/profile';
      const profileLabel = user.role === 'admin' ? 'لوحة التحكم' : 'الملف الشخصي';
      const profileIcon = user.role === 'admin' ? <LayoutDashboard className="mr-2 h-4 w-4" /> : <User className="mr-2 h-4 w-4" />;
      
      return isMobile ? (
        <div className="flex flex-col w-full mt-4 pt-4 border-t">
           <Button variant='outline' asChild className='w-full'>
            <Link href={profileUrl}>{profileLabel}</Link>
          </Button>
          <Button onClick={logout} variant="default" className='w-full mt-2'>
            تسجيل الخروج
          </Button>
        </div>
      ) : (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                        <AvatarImage src={user.photoURL ?? ''} alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href={profileUrl}>
                        {profileIcon}
                        <span>{profileLabel}</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                    تسجيل الخروج
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <div className={cn("flex items-center gap-2", isMobile && 'flex-col w-full mt-4 pt-4 border-t')}>
        <Button variant="ghost" asChild  className={cn(isMobile && 'w-full')}>
          <Link href="/login">تسجيل الدخول</Link>
        </Button>
        <Button asChild  className={cn(isMobile && 'w-full')}>
          <Link href="/signup">سجل الآن</Link>
        </Button>
      </div>
    );
  }


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        {user && user.role === 'student' && !user.approved && <PendingApprovalBanner />}
        <div className="container mx-auto flex h-16 items-center px-4">
            {isMobile ? (
                <>
                    <Logo />
                    <div className="mr-auto">
                        <Sheet>
                            <SheetTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                            </SheetTrigger>
                            <SheetContent side="right">
                            <nav className="flex flex-col gap-2 mt-8">
                                <NavLinks isMobile={true}/>
                            </nav>
                            <AuthArea isMobile={true}/>
                            </SheetContent>
                        </Sheet>
                    </div>
                </>
            ) : (
            <div className='flex items-center justify-between w-full'>
                <div className='flex-1'>
                    <Logo />
                </div>

                <div className='flex-1 flex justify-center'>
                    <NavLinks />
                </div>

                <div className='flex-1 flex justify-end'>
                    <AuthArea />
                </div>
            </div>
            )}
        </div>
    </header>
  );
}
