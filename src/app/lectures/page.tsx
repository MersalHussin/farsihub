"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Lecture, Subject, LectureYear, Semester } from "@/lib/types";
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
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lecturesBySubject, setLecturesBySubject] = useState<Record<string, Lecture[]>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const [semesterFilter, setSemesterFilter] = useState<"first" | "second" | "all">("all");

  const fetchSubjectsAndLectures = useCallback(async () => {
    if (!user?.year) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Fetch Subjects for the user's year
      const subjectsQuery = query(
        collection(db, "subjects"),
        where("year", "==", user.year),
        orderBy("createdAt", "desc")
      );
      const subjectsSnapshot = await getDocs(subjectsQuery);
      const subjectsList: Subject[] = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
      setSubjects(subjectsList);

      // Fetch lectures for each subject
      const lecturesData: Record<string, Lecture[]> = {};
      for (const subject of subjectsList) {
        const lecturesQuery = query(
            collection(db, "subjects", subject.id, "lectures"),
            orderBy("createdAt", "desc")
        );
        const lecturesSnapshot = await getDocs(lecturesQuery);
        lecturesData[subject.id] = lecturesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lecture));
      }
      setLecturesBySubject(lecturesData);

    } catch (error: any) {
      console.error("Error fetching data: ", error);
      toast({
          variant: "destructive",
          title: "فشل تحميل البيانات",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user?.year]);

  useEffect(() => {
    if(user?.approved && user?.year) {
        fetchSubjectsAndLectures();
    } else {
        setLoading(false);
    }
  }, [fetchSubjectsAndLectures, user]);

  const filteredSubjects = useMemo(() => {
    if (semesterFilter === "all") {
      return subjects;
    }
    return subjects.filter(subject => subject.semester === semesterFilter);
  }, [subjects, semesterFilter]);
  
  const semesterCounts = useMemo(() => {
    return subjects.reduce((acc, subject) => {
        if (subject.semester) {
            acc[subject.semester] = (acc[subject.semester] || 0) + 1;
        }
        return acc;
    }, {} as Record<Semester, number>);
  }, [subjects]);

  const getLecturesForSubject = (subjectId: string) => {
    return lecturesBySubject[subjectId] || [];
  }

  const renderPageContent = () => {
    if (loading) {
        return (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center text-muted-foreground py-24 border rounded-lg">
               <p>يجب عليك تسجيل الدخول أولاً لعرض المحاضرات.</p>
               <Button asChild className="mt-4">
                   <Link href="/login">تسجيل الدخول</Link>
               </Button>
           </div>
         );
    }

    if (!user.approved) {
        return (
            <div className="text-center text-muted-foreground py-24 border rounded-lg">
               <p>حسابك قيد المراجعة. يجب التواصل مع الدعم لتفعيل حسابك.</p>
           </div>
         );
    }

    if (!user.year) {
        return (
            <div className="text-center text-muted-foreground py-24 border rounded-lg">
               <p>الرجاء تحديد فرقتك الدراسية أولاً لعرض المحاضرات.</p>
               <Button asChild className="mt-4">
                   <Link href="/student/onboarding">تحديد الفرقة الدراسية</Link>
               </Button>
           </div>
         );
    }

    if (subjects.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-12 border rounded-lg">
          <p>
            لا توجد مواد دراسية متاحة لفرقتك الدراسية حالياً.
          </p>
        </div>
      );
    }
    
    return (
        <>
            <div className="flex justify-center">
                <Tabs dir="rtl" value={semesterFilter} onValueChange={(value) => setSemesterFilter(value as any)}>
                <TabsList className="grid w-full grid-cols-3 max-w-sm">
                    <TabsTrigger value="all">الكل</TabsTrigger>
                    <TabsTrigger value="first">الفصل الأول</TabsTrigger>
                    <TabsTrigger value="second" disabled={!semesterCounts.second || semesterCounts.second === 0}>
                        الفصل الثاني
                    </TabsTrigger>
                </TabsList>
                </Tabs>
            </div>
            <Accordion type="multiple" defaultValue={filteredSubjects.map(s => s.id)} className="w-full space-y-4">
                {filteredSubjects.length > 0 ? filteredSubjects.map((subject) => {
                    const subjectLectures = getLecturesForSubject(subject.id);
                    return (
                        <AccordionItem value={subject.id} key={subject.id} className="border rounded-lg bg-card">
                            <AccordionTrigger className="p-6 text-lg font-bold">
                                <div className="flex items-center gap-3">
                                   <span>{subject.name}</span> 
                                   <Badge variant="secondary">{subjectLectures.length} محاضرات</Badge>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-6 pt-0">
                               {subjectLectures.length > 0 ? (
                                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {subjectLectures.map((lecture) => (
                                         <Card key={lecture.id} className="flex flex-col">
                                            <CardHeader>
                                                <CardTitle>{lecture.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex-grow">
                                                <p className="text-muted-foreground line-clamp-3 h-14">{lecture.description}</p>
                                            </CardContent>
                                            <CardFooter>
                                                <Button asChild className="w-full">
                                                    <Link href={`/lectures/${lecture.subjectId}/${lecture.id}`}>
                                                    <BookOpen className="ml-2 h-4 w-4" />
                                                    عرض التفاصيل
                                                    </Link>
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                               ) : (
                                <p className="text-muted-foreground">لا توجد محاضرات لهذه المادة بعد.</p>
                               )}
                            </AccordionContent>
                        </AccordionItem>
                    )
                }) : (
                     <div className="text-center text-muted-foreground py-12 border rounded-lg">
                        <p>لا توجد مواد دراسية متاحة لهذا الفصل الدراسي حالياً.</p>
                    </div>
                )}
            </Accordion>
        </>
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
              {user ? "تصفح جميع المواد والمحاضرات المتاحة لك." : "يرجى تسجيل الدخول لعرض المحاضرات."}
            </p>
          </div>
          
          {renderPageContent()}

        </div>
      </main>
      <Footer />
    </div>
  );
}
