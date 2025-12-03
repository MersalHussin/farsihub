
"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs, orderBy, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { errorEmitter } from "@/lib/error-emitter";
import { FirestorePermissionError } from "@/lib/errors";

interface Submission {
    id: string;
    quizTitle: string;
    score: number;
    submittedAt: {
        toDate: () => Date;
    };
    lectureId: string;
    subjectId: string;
}

export default function StudentQuizzesPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (!user) return;
        setLoading(true);

        const db = getFirebaseDb();
        if (!db) return;

        const q = query(
            collection(db, "quizSubmissions"),
            where("userId", "==", user.uid),
            orderBy("submittedAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const subs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
            setSubmissions(subs);
            setLoading(false);
        }, (error) => {
            console.error(error);
            const permissionError = new FirestorePermissionError({
                path: 'quizSubmissions',
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <div className="space-y-4">
            <h1 className="text-3xl font-bold">نتائج الاختبارات</h1>
            <p className="text-muted-foreground">
                تصفح نتائج اختباراتك السابقة.
            </p>
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : submissions.length > 0 ? (
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {submissions.map(sub => (
                        <Card key={sub.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle>{sub.quizTitle}</CardTitle>
                                <CardDescription>
                                    {sub.submittedAt ? format(sub.submittedAt.toDate(), 'PPP') : 'N/A'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-4xl font-bold">{Math.round(sub.score)}%</p>
                            </CardContent>
                             <CardFooter className="flex justify-between">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/quizzes/${sub.subjectId}/${sub.lectureId}`}>إعادة الاختبار</Link>
                                </Button>
                                <Button variant="secondary" size="sm" asChild>
                                    <Link href={`/lectures/${sub.subjectId}/${sub.lectureId}`}>عرض المحاضرة</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-24 border rounded-lg bg-card">
                    <p>لم تقم بتقديم أي اختبارات بعد.</p>
                     <Button asChild className="mt-4">
                        <Link href="/lectures">تصفح المحاضرات وابدأ</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
