"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Lecture } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, FileQuestion } from "lucide-react";
import AddLectureDialog from "./add-lecture-dialog";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const yearMap = {
  first: "الفرقة الأولى",
  second: "الفرقة الثانية",
  third: "الفرقة الثالثة",
  fourth: "الفرقة الرابعة",
};

const semesterMap = {
  first: "الفصل الأول",
  second: "الفصل الثاني",
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
        description: "حدث خطأ أثناء جلب بيانات المحاضرات.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLectures();
  }, [fetchLectures]);

  const handleDelete = async (lectureId: string) => {
    try {
      await deleteDoc(doc(db, "lectures", lectureId));
      toast({
        title: "تم حذف المحاضرة",
      });
      fetchLectures();
    } catch (error) {
      console.error("Error deleting lecture: ", error);
      toast({
        variant: "destructive",
        title: "فشل حذف المحاضرة",
      });
    }
  };
  
  const groupedLectures = useMemo(() => {
    return lectures.reduce((acc, lecture) => {
        const { year } = lecture;
        if (!acc[year]) {
            acc[year] = [];
        }
        acc[year].push(lecture);
        return acc;
    }, {} as Record<string, Lecture[]>);
  }, [lectures]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة المحاضرات والاختبارات</h2>
          <p className="text-muted-foreground">إضافة وتعديل المحاضرات والاختبارات المرتبطة بها.</p>
        </div>
        <AddLectureDialog onLectureAdded={fetchLectures} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedLectures).length > 0 ? (
            Object.entries(groupedLectures).map(([year, lecturesInYear]) => (
              <div key={year}>
                <h3 className="text-xl font-bold mb-4">{yearMap[year as keyof typeof yearMap]}</h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {lecturesInYear.map((lecture) => (
                    <Card key={lecture.id} className="flex flex-col">
                      <CardHeader>
                        <CardTitle>{lecture.title}</CardTitle>
                         <div className="flex flex-wrap items-center gap-2 pt-2">
                            <Badge variant="secondary">{lecture.subject}</Badge>
                            <Badge variant="outline">{semesterMap[lecture.semester]}</Badge>
                        </div>
                        {lecture.quiz && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                            <FileQuestion className="h-4 w-4" />
                            <span>يحتوي على اختبار: {lecture.quiz.title}</span>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-muted-foreground line-clamp-2 h-10">{lecture.description}</p>
                      </CardContent>
                      <CardFooter className="flex justify-between items-center">
                        <Button variant="outline" asChild>
                          <Link href={`/lectures/${lecture.id}`} target="_blank" rel="noopener noreferrer">
                            عرض
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                هذا الإجراء سيحذف المحاضرة وأي اختبار مرتبط بها بشكل نهائي.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(lecture.id)}>
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-12 border rounded-lg">
              <p>لا توجد محاضرات. قم بإضافة محاضرتك الأولى.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

    