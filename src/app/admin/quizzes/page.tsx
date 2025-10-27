"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Quiz } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
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
import { Loader2, Trash2 } from "lucide-react";
import AddQuizDialog from "./add-quiz-dialog";
import Link from "next/link";
import { errorEmitter } from "@/lib/error-emitter";
import { FirestorePermissionError } from "@/lib/errors";

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "quizzes"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const quizzesList: Quiz[] = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Quiz)
      );
      setQuizzes(quizzesList);
    } catch (error) {
      console.error("Error fetching quizzes: ", error);
      toast({
        variant: "destructive",
        title: "فشل تحميل الاختبارات",
        description: "حدث خطأ أثناء جلب بيانات الاختبارات.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);
  
  const handleDelete = (quizId: string) => {
    const docRef = doc(db, "quizzes", quizId);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: "تم حذف الاختبار",
          description: "تم حذف الاختبار بنجاح.",
        });
        fetchQuizzes();
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
            path: `quizzes/${quizId}`,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        // We don't console.error here because the listener will throw for us
        // which gives a better debugging experience in Next.js.
        // We still show a toast to the user.
        toast({
            variant: "destructive",
            title: "فشل حذف الاختبار",
            description: "ليست لديك الصلاحية لحذف هذا الاختبار.",
        });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة الاختبارات</h2>
          <p className="text-muted-foreground">
            إضافة وتعديل الاختبارات المرتبطة بالمحاضرات.
          </p>
        </div>
        <AddQuizDialog onQuizAdded={fetchQuizzes} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.length > 0 ? (
            quizzes.map((quiz) => (
              <Card key={quiz.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{quiz.title}</CardTitle>
                  <CardDescription>
                    {quiz.questions.length} أسئلة
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">
                    مرتبط بالمحاضرة: {quiz.lectureTitle || "غير محدد"}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" asChild>
                    <Link href={`/admin/quizzes/${quiz.id}/edit`}>
                      تعديل
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
                                هذا الإجراء سيحذف الاختبار بشكل نهائي ولا يمكن التراجع عنه.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(quiz.id)}>
                                حذف
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="md:col-span-2 lg:col-span-3 text-center text-muted-foreground py-12 border rounded-lg">
              <p>لا توجد اختبارات. قم بإضافة اختبارك الأول.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
