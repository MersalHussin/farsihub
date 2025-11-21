"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@/lib/types";
import { format } from 'date-fns';
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { errorEmitter } from "@/lib/error-emitter";
import { FirestorePermissionError } from "@/lib/errors";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const db = getFirebaseDb();
    const q = query(collection(db, "users"), where("role", "==", "student"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const studentsList: Student[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            email: data.email,
            role: data.role,
            approved: data.approved,
            createdAt: data.createdAt?.toDate(),
          } as Student;
        });
        setStudents(studentsList);
        setLoading(false);
      }, 
      async (error) => {
        const permissionError = new FirestorePermissionError({
            path: 'users',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error("Error fetching students: ", error);
        toast({
          variant: "destructive",
          title: "فشل تحميل الطلاب",
          description: "حدث خطأ أثناء جلب بيانات الطلاب.",
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);

  const handleApprovalChange = (studentId: string, approved: boolean) => {
    const db = getFirebaseDb();
    const studentRef = doc(db, "users", studentId);
    const updateData = { approved };
    updateDoc(studentRef, updateData)
      .then(() => {
        toast({
          title: "تم تحديث الحالة",
          description: `تم ${approved ? 'قبول' : 'تعليق'} الطالب بنجاح.`,
        });
      })
      .catch(async (error) => {
        // Revert UI change on error.
        setStudents((prevStudents) =>
          prevStudents.map((student) =>
            student.id === studentId ? { ...student, approved: !approved } : student
          )
        );
        const permissionError = new FirestorePermissionError({
            path: studentRef.path,
            operation: 'update',
            requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
    
    // Optimistic UI update
    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.id === studentId ? { ...student, approved } : student
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة الطلاب</CardTitle>
        <CardDescription>
          عرض وقبول أو رفض طلبات تسجيل الطلاب الجدد.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead className="hidden md:table-cell">البريد الإلكتروني</TableHead>
                <TableHead className="hidden sm:table-cell">تاريخ التسجيل</TableHead>
                <TableHead className="text-left">الحالة (مقبول)</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {students.length > 0 ? (
                students.map((student) => (
                    <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{student.email}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                        {student.createdAt ? format(student.createdAt, 'yyyy/MM/dd') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-left">
                        <Switch
                        checked={student.approved}
                        onCheckedChange={(checked) =>
                            handleApprovalChange(student.id, checked)
                        }
                        aria-label="Student approval switch"
                        />
                    </TableCell>
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                    لا يوجد طلاب لعرضهم.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
