"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query, orderBy, deleteDoc, doc, where, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Lecture, Subject } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import { Loader2, Trash2, FileQuestion, ArrowRight, Pencil } from "lucide-react";
import AddLectureDialog from "./add-lecture-dialog";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';
import EditLectureDialog from "./edit-lecture-dialog";

export default function LecturesPage() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectId = searchParams.get('subjectId');

  const fetchLecturesAndSubject = useCallback(async () => {
    if (!subjectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Fetch Subject
      const subjectRef = doc(db, "subjects", subjectId);
      const subjectSnap = await getDoc(subjectRef);
      if(subjectSnap.exists()) {
          setSubject({ id: subjectSnap.id, ...subjectSnap.data() } as Subject);
      } else {
          toast({ variant: "destructive", title: "المادة غير موجودة" });
          router.push("/admin/subjects");
          return;
      }

      // Fetch Lectures
      const lecturesCollectionRef = collection(db, "subjects", subjectId, "lectures");
      const q = query(
        lecturesCollectionRef,
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const lecturesList: Lecture[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lecture));
      setLectures(lecturesList);
    } catch (error) {
      console.error("Error fetching data: ", error);
      toast({
        variant: "destructive",
        title: "فشل تحميل البيانات",
        description: "حدث خطأ أثناء جلب بيانات المحاضرات والمادة.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, subjectId, router]);

  useEffect(() => {
    fetchLecturesAndSubject();
  }, [fetchLecturesAndSubject]);

  const handleDelete = async (lectureId: string) => {
    if (!subjectId) return;
    try {
      const lectureDocRef = doc(db, "subjects", subjectId, "lectures", lectureId);
      await deleteDoc(lectureDocRef);
      toast({
        title: "تم حذف المحاضرة",
      });
      fetchLecturesAndSubject();
    } catch (error) {
      console.error("Error deleting lecture: ", error);
      toast({
        variant: "destructive",
        title: "فشل حذف المحاضرة",
      });
    }
  };

  if (!subjectId) {
    return (
      <div className="text-center text-muted-foreground py-24 border rounded-lg">
        <p>الرجاء تحديد مادة أولاً من صفحة <Link href="/admin/subjects" className="underline font-bold">المواد الدراسية</Link> لعرض محاضراتها.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <Button variant="ghost" onClick={() => router.push('/admin/subjects')}>
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للمواد الدراسية
        </Button>

      {subject && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">محاضرات مادة: {subject.name}</h2>
            <p className="text-muted-foreground">إضافة وتعديل المحاضرات التابعة لهذه المادة.</p>
          </div>
          <AddLectureDialog onLectureAdded={fetchLecturesAndSubject} subject={subject} />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : lectures.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lectures.map((lecture) => (
            <Card key={lecture.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{lecture.title}</CardTitle>
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
                  <Link href={`/lectures/${lecture.subjectId}/${lecture.id}`} target="_blank" rel="noopener noreferrer">
                    عرض
                  </Link>
                </Button>
                <div className="flex gap-2">
                    <EditLectureDialog subject={subject!} lecture={lecture} onLectureUpdated={fetchLecturesAndSubject} />
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
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-12 border rounded-lg">
          {subject && <p>لا توجد محاضرات لهذه المادة. قم بإضافة محاضرتك الأولى من زر "إضافة محاضرة".</p>}
        </div>
      )}
    </div>
  );
}
