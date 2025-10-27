"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
  const { user } = useAuth();
  const [semesterFilter, setSemesterFilter] = useState<"first" | "second" | "all">("all");

  const fetchLectures = useCallback(async () => {
    setLoading(true);
    try {
      const lecturesCollection = collection(db, "lectures");
      let q;
      if (user?.year) {
        q = query(
          lecturesCollection,
          where("year", "==", user.year),
          orderBy("createdAt", "desc")
        );
      } else {
        q = query(lecturesCollection, orderBy("createdAt", "desc"));
      }

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
  }, [toast, user?.year]);

  useEffect(() => {
    fetchLectures();
  }, [fetchLectures]);

  const groupedAndFilteredLectures = useMemo(() => {
    const filteredBySemester = semesterFilter === "all"
      ? lectures
      : lectures.filter(lecture => lecture.semester === semesterFilter);

    return filteredBySemester.reduce((acc, lecture) => {
      const { subject } = lecture;
      if (!acc[subject]) {
        acc[subject] = [];
      }
      acc[subject].push(lecture);
      return acc;
    }, {} as Record<string, Lecture[]>);
  }, [lectures, semesterFilter]);


  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    const subjects = Object.keys(groupedAndFilteredLectures);

    if (subjects.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-12 border rounded-lg">
          <p>
            {semesterFilter !== "all" 
              ? "لا توجد محاضرات متاحة لهذا الفصل الدراسي حالياً."
              : "لا توجد محاضرات متاحة لفرقتك الدراسية حالياً."
            }
          </p>
        </div>
      );
    }
    
    return (
        <Accordion type="multiple" defaultValue={subjects} className="w-full space-y-4">
            {subjects.map((subject) => (
                <AccordionItem value={subject} key={subject} className="border rounded-lg bg-card">
                    <AccordionTrigger className="p-6 text-lg font-bold">
                        <div className="flex items-center gap-3">
                           <span>{subject}</span> 
                           <Badge variant="secondary">{groupedAndFilteredLectures[subject].length} محاضرات</Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-6 pt-0">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {groupedAndFilteredLectures[subject].map((lecture) => (
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
            <h2 className="text-3xl font-bold">
              {user?.year ? `محاضرات ${yearMap[user.year]}` : "المحاضرات"}
            </h2>
            <p className="text-muted-foreground">
              {user?.year ? "تصفح جميع المواد والمحاضرات المتاحة لك." : "تصفح جميع المحاضرات المتاحة."}
            </p>
          </div>
          
          {user?.year && (
            <Tabs dir="rtl" value={semesterFilter} onValueChange={(value) => setSemesterFilter(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-sm">
                <TabsTrigger value="all">الكل</TabsTrigger>
                <TabsTrigger value="first">الفصل الأول</TabsTrigger>
                <TabsTrigger value="second">الفصل الثاني</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {renderContent()}
        </div>
      </main>
      <Footer />
    </div>
  );
}
    