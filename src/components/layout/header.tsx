
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LayoutDashboard, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Skeleton } from '../ui/skeleton';
import { PendingApprovalBanner } from './pending-approval-banner';
import { Separator } from '@/components/ui/separator';
import { usePathname } from 'next/navigation';


export function Header() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
  
  const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => (
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
          onClick={() => isMobile && setIsSheetOpen(false)}
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
           onClick={() => isMobile && setIsSheetOpen(false)}
        >
          <Link href="/admin">
            <LayoutDashboard className="ml-2 h-4 w-4" />
            لوحة التحكم
          </Link>
        </Button>
      )}
    </nav>
  );

  const AuthArea = () => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient || loading) {
      return (
        <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      );
    }

    if (user) {
      const profileUrl = user.role === 'admin' ? '/admin/profile' : '/student/profile';
      const profileLabel = user.role === 'admin' ? 'لوحة التحكم' : 'الملف الشخصي';
      const profileIcon = user.role === 'admin' ? <LayoutDashboard className="mr-2 h-4 w-4" /> : <User className="mr-2 h-4 w-4" />;
      
      return (
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
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/login">تسجيل الدخول</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">سجل الآن</Link>
        </Button>
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        {user && user.role === 'student' && !user.approved && <PendingApprovalBanner />}
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <div className="md:hidden">
                  <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                      <SheetTrigger asChild>
                      <Button variant="outline" size="icon">
                          <Menu className="h-6 w-6" />
                          <span className="sr-only">Open menu</span>
                      </Button>
                      </SheetTrigger>
                      <SheetContent side="right">
                      <div className="flex flex-col gap-4 mt-8">
                          <NavLinks isMobile={true}/>
                          <Separator/>
                          {/* Mobile Auth Buttons */}
                          {loading || !user ? (
                            <div className="flex flex-col gap-2">
                              <Button variant="ghost" asChild onClick={() => setIsSheetOpen(false)}><Link href="/login">تسجيل الدخول</Link></Button>
                              <Button asChild onClick={() => setIsSheetOpen(false)}><Link href="/signup">سجل الآن</Link></Button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                                  <Button variant="outline" asChild onClick={() => setIsSheetOpen(false)}>
                                      <Link href={user.role === 'admin' ? '/admin/profile' : '/student/profile'}>الملف الشخصي</Link>
                                  </Button>
                                <Button onClick={() => { logout(); setIsSheetOpen(false); }}>تسجيل الخروج</Button>
                            </div>
                          )}
                      </div>
                      </SheetContent>
                  </Sheet>
              </div>
              <Logo />
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex">
                <NavLinks />
            </div>

            <div className="hidden md:flex items-center">
                <AuthArea />
            </div>
        </div>
    </header>
  );
}
