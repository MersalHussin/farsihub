"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileQuestion, Sparkles, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/hooks/use-auth';

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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <section className="text-center py-20 px-4 bg-card">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground mb-4">
              أهلاً بك في فارسي هب
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              فارسي هب هي منصة تعليمية مخصصة لطلاب جامعة القاهرة لتتبع تقدمهم في تعلم اللغة الفارسية من خلال المحاضرات، والاختبارات، والتكليفات، وبرامج التطوير الذاتي.
            </p>
            <div className="flex justify-center gap-4">
              {!loading && (
                user ? (
                   <Button asChild size="lg" className="font-bold">
                    <Link href="/dashboard">ابدأ الآن</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg" className="font-bold">
                      <Link href="/signup">سجل الآن</Link>
                    </Button>
                    <Button asChild size="lg" variant="secondary" className="font-bold">
                      <Link href="/login">تسجيل الدخول</Link>
                    </Button>
                  </>
                )
              )}
            </div>
          </div>
        </section>

        <section id="features" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 font-headline">مميزات المنصة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => (
                <Link href={feature.href} key={feature.title} className="block">
                  <Card className="text-center transition-transform transform hover:-translate-y-2 hover:shadow-xl h-full">
                    <CardHeader>
                      <div className="mx-auto bg-primary/10 rounded-full p-4 w-24 h-24 flex items-center justify-center mb-4">
                        {feature.icon}
                      </div>
                      <CardTitle className="font-headline">{feature.title}</CardTitle>
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
