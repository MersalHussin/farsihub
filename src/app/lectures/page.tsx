"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Lecture, LectureYear } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, BookOpen } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const yearMap: Record<LectureYear, string> = {
  first: "الفرقة الأولى",
  second: "الفرقة الثانية",
  third: "الفرقة الثالثة",
  fourth: "الفرقة الرابعة",
};

export default function LecturesPage() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLectures = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "lectures"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const lecturesList: Lecture[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lecture));
      setLectures(lecturesList);
    } catch (error) {
      console.error("Error fetching lectures: ", error);
      toast({
        variant: "destructive",
        title: "فشل تحميل المحاضرات",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLectures();
  }, [fetchLectures]);

  const groupedLectures = useMemo(() => {
    return lectures.reduce((acc, lecture) => {
      const { year } = lecture;
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(lecture);
      return acc;
    }, {} as Record<LectureYear, Lecture[]>);
  }, [lectures]);


  const renderContent = () => {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const yearsWithLectures = Object.keys(groupedLectures) as LectureYear[];

    if (yearsWithLectures.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-12 border rounded-lg">
                <p>لا توجد محاضرات متاحة حالياً.</p>
            </div>
        );
    }

    return (
        <Accordion type="multiple" defaultValue={yearsWithLectures} className="w-full space-y-4">
            {(Object.keys(yearMap) as LectureYear[]).map((year) => 
                groupedLectures[year] && groupedLectures[year].length > 0 && (
                <AccordionItem value={year} key={year} className="border rounded-lg bg-card">
                    <AccordionTrigger className="p-6 text-lg font-bold">
                    {yearMap[year]} ({groupedLectures[year].length})
                    </AccordionTrigger>
                    <AccordionContent className="p-6 pt-0">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {groupedLectures[year].map((lecture) => (
                             <Card key={lecture.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>{lecture.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-muted-foreground line-clamp-3 h-14">{lecture.description}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild className="w-full">
                                        <Link href={`/lectures/${lecture.id}`}>
                                        <BookOpen className="ml-2 h-4 w-4" />
                                        عرض التفاصيل
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
  };


  return (
    <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto py-10 px-4">
            <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold">المحاضرات</h2>
                  <p className="text-muted-foreground">تصفح جميع المحاضرات المتاحة لكل فرقة دراسية.</p>
                </div>
                {renderContent()}
            </div>
        </main>
        <Footer />
    </div>
  );
}
