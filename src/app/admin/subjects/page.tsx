"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query, orderBy, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Subject, LectureYear, Semester } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
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
import { Loader2, Trash2, BookCopy, Pencil } from "lucide-react";
import AddSubjectDialog from "./add-subject-dialog";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import EditSubjectDialog from "./edit-subject-dialog";
import { errorEmitter } from "@/lib/error-emitter";
import { FirestorePermissionError } from "@/lib/errors";

const yearMap: Record<LectureYear, string> = {
  first: "الفرقة الأولى",
  second: "الفرقة الثانية",
  third: "الفرقة الثالثة",
  fourth: "الفرقة الرابعة",
};

const semesterMap: Record<Semester, string> = {
  first: "فصل أول",
  second: "فصل ثاني",
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubjects = useCallback(() => {
    setLoading(true);
    const db = getFirebaseDb();
    const subjectsCollection = collection(db, "subjects");
    const q = query(subjectsCollection, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const subjectsList: Subject[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
        setSubjects(subjectsList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching subjects: ", error);
        const permissionError = new FirestorePermissionError({
            path: 'subjects',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);

        toast({
          variant: "destructive",
          title: "فشل تحميل المواد الدراسية",
          description: "ليست لديك الصلاحية لعرض المواد. يرجى مراجعة قواعد الأمان في Firebase.",
        });
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [toast]);

  useEffect(() => {
    const unsubscribe = fetchSubjects();
    return () => unsubscribe();
  }, [fetchSubjects]);

  const handleDelete = async (subjectId: string) => {
    const db = getFirebaseDb();
    const subjectDocRef = doc(db, "subjects", subjectId);
    // You might want to delete subcollections like lectures here as well
    deleteDoc(subjectDocRef)
      .then(() => {
        toast({ title: "تم حذف المادة" });
        // The onSnapshot listener will automatically update the UI
      })
      .catch((error) => {
        console.error("Error deleting subject: ", error);
        toast({ variant: "destructive", title: "فشل حذف المادة" });
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة المواد الدراسية</h2>
          <p className="text-muted-foreground">إضافة وتعديل المواد الدراسية التي تقدمها المنصة.</p>
        </div>
        <AddSubjectDialog onSubjectAdded={() => {}} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : subjects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Card key={subject.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{subject.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 pt-1">
                    <Badge variant="outline">{yearMap[subject.year]}</Badge>
                    <Badge variant="outline">{semesterMap[subject.semester]}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 {/* Can add more details here in future like lecture count */}
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                 <Button asChild>
                  <Link href={`/admin/lectures?subjectId=${subject.id}`}>
                    <BookCopy className="ml-2 h-4 w-4" />
                    عرض المحاضرات
                  </Link>
                </Button>
                <div className="flex gap-2">
                  <EditSubjectDialog subject={subject} onSubjectUpdated={() => {}} />
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
                          هذا الإجراء سيحذف المادة وجميع المحاضرات والاختبارات المرتبطة بها بشكل نهائي.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(subject.id)}>
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
        <div className="text-center text-muted-foreground py-24 border rounded-lg">
          <p>لا توجد مواد دراسية بعد. قم بإضافة مادتك الدراسية الأولى.</p>
        </div>
      )}
    </div>
  );
}
