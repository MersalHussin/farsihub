
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileQuestion, Sparkles, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

const features = [
  {
    icon: <BookOpen className="w-12 h-12 text-primary" />,
    title: 'المحاضرات',
    description: 'وصول سهل ومنظم لجميع ملفات المحاضرات بصيغة PDF.',
    href: '/lectures',
  },
  {
    icon: <FileQuestion className="w-12 h-12 text-primary" />,
    title: 'الاختبارات',
    description: 'اختبر فهمك بعد كل محاضرة من خلال اختبارات قصيرة.',
    href: '/lectures',
  },
    {
    icon: <ClipboardCheck className="w-12 h-12 text-primary" />,
    title: 'التكليفات',
    description: 'تابع التكليفات المطلوبة وقم بتسليمها في المواعيد المحددة.',
    href: '/assignments',
  },
  {
    icon: <Sparkles className="w-12 h-12 text-primary" />,
    title: 'التطوير الذاتي',
    description: 'موارد إضافية وبرامج لتنمية مهاراتك اللغوية بشكل مستمر.',
    href: '#',
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const renderAuthButtons = () => {
    if (!isClient || loading) {
      return (
        <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Skeleton className="h-14 w-48" />
            <Skeleton className="h-14 w-48" />
        </div>
      );
    }

    if (user) {
      return (
        <Button asChild size="lg" className="font-bold text-lg px-8 py-6">
          <Link href="/lectures">أبدأ التعلم</Link>
        </Button>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button asChild size="lg" className="font-bold text-lg px-8 py-6">
          <Link href="/signup">ابدأ رحلتك الآن</Link>
        </Button>
        <Button asChild size="lg" variant="secondary" className="font-bold text-lg px-8 py-6">
          <Link href="/login">تسجيل الدخول</Link>
        </Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <section className="text-center py-20 lg:py-32 px-4 bg-card border-b">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-headline text-foreground mb-4 leading-tight">
              أتقن الفارسية مع <span className='text-primary'>فارسي هب</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              منصتك التعليمية المتكاملة لتتبع تقدمك في تعلم اللغة الفارسية من خلال المحاضرات، والاختبارات، والتكليفات، وبرامج التطوير الذاتي.
            </p>
            {renderAuthButtons()}
          </div>
        </section>

        <section id="features" className="py-20 lg:py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-headline">لماذا تختار فارسي هب؟</h2>
              <p className="text-muted-foreground mt-2">كل ما تحتاجه للنجاح في مكان واحد.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => (
                <Link href={feature.href} key={feature.title} className="block group">
                  <Card className="text-center transition-all duration-300 transform group-hover:-translate-y-2 group-hover:shadow-xl h-full border-2 border-transparent hover:border-primary/50">
                    <CardHeader>
                      <div className="mx-auto bg-primary/10 rounded-full p-4 w-24 h-24 flex items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-primary/20">
                        {feature.icon}
                      </div>
                      <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
