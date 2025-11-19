"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Loader2, FileQuestion, BookOpen, Trophy } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { QuizSubmission, Achievement } from "@/lib/types";

export default function StudentAchievementsPage() {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchAchievements = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        };
        setLoading(true);
        try {
            const q = query(
                collection(db, "quizSubmissions"),
                where("userId", "==", user.uid),
                orderBy("submittedAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const quizAchievements: Achievement[] = querySnapshot.docs.map(doc => {
                const data = doc.data() as Omit<QuizSubmission, 'id'>;
                const submittedAt = (data.submittedAt as unknown as Timestamp).toDate();
                return {
                    id: `quiz-${doc.id}`,
                    title: `أكملت اختبار: ${data.quizTitle}`,
                    description: `أحرزت ${Math.round(data.score)}% في هذا الاختبار.`,
                    date: submittedAt,
                    type: 'quiz',
                    icon: <FileQuestion className="h-6 w-6 text-blue-500" />,
                };
            });
            
            setAchievements(quizAchievements.sort((a, b) => b.date.getTime() - a.date.getTime()));

        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "فشل تحميل الإنجازات",
                description: "قد تكون هناك مشكلة في صلاحيات الوصول."
            });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        if (user) {
            fetchAchievements();
        } else if (!user && !loading) {
            // Redirect or handle appropriately if user is not logged in
        }
    }, [fetchAchievements, user, loading]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-amber-500" />
                <div>
                    <h1 className="text-3xl font-bold">الإنجازات</h1>
                    <p className="text-muted-foreground">
                        سجل بإنجازاتك التعليمية. كل خطوة هي تقدم!
                    </p>
                </div>
            </div>
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : achievements.length > 0 ? (
                 <div className="space-y-4">
                    {achievements.map(ach => (
                        <Card key={ach.id}>
                            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                <div className="p-3 rounded-full bg-muted">
                                  {ach.icon}
                                </div>
                                <div className="flex-1">
                                    <CardTitle>{ach.title}</CardTitle>
                                    <CardDescription>
                                        {format(ach.date, 'PPP')}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-24 border rounded-lg bg-card">
                    <p className="text-lg mb-2">لم تحقق أي إنجازات بعد.</p>
                    <p>ابدأ رحلتك الآن بمذاكرة محاضرة أو حل اختبار.</p>
                     <Button asChild className="mt-4">
                        <Link href="/lectures">تصفح المحاضرات وابدأ</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
