
"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { Lecture } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, FileQuestion, FileText, BookText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import { VideoPlayerDialog } from "./video-player-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { errorEmitter } from "@/lib/error-emitter";
import { FirestorePermissionError } from "@/lib/errors";


export default function LectureDetailsPage() {
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const idParams = params.id || [];
  const [subjectId, lectureId] = idParams;

  const fetchLecture = useCallback(() => {
    if (typeof subjectId !== 'string' || typeof lectureId !== 'string') {
        router.push('/lectures'); // Redirect if params are invalid
        return;
    }
    setLoading(true);

    const db = getFirebaseDb();
    if (!db) {
        toast({ variant: "destructive", title: "فشل تحميل البيانات" });
        setLoading(false);
        return;
    };

    const lectureRef = doc(db, "subjects", subjectId, "lectures", lectureId);
    
    const unsubscribe = onSnapshot(lectureRef, (lectureSnap) => {
      if (lectureSnap.exists()) {
        setLecture({ id: lectureSnap.id, ...lectureSnap.data() } as Lecture);
      } else {
        toast({ variant: "destructive", title: "المحاضرة غير موجودة" });
        router.push('/lectures');
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching data: ", error);
        const permissionError = new FirestorePermissionError({
            path: lectureRef.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
    });

    return unsubscribe;

  }, [subjectId, lectureId, toast, router]);

  useEffect(() => {
    const unsubscribe = fetchLecture();
    return () => {
        if(unsubscribe) unsubscribe();
    }
  }, [fetchLecture]);

  const pageContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full py-24">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }
  
    if (!lecture) {
      return (
        <div className="text-center py-24">
          <h2 className="text-2xl font-bold">لم يتم العثور على المحاضرة</h2>
          <p className="text-muted-foreground">قد تكون المحاضرة التي تبحث عنها قد حُذفت.</p>
          <Button variant="outline" onClick={() => router.push('/lectures')} className="mt-4">
                العودة للمحاضرات
            </Button>
        </div>
      );
    }

    return (
        <div className="space-y-8">
            <div>
              <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                  <ArrowRight className="ml-2 h-4 w-4" />
                  عودة
              </Button>
              <h1 className="text-3xl md:text-4xl font-bold">{lecture.title}</h1>
              <p className="text-lg text-muted-foreground mt-2">{lecture.description}</p>
            </div>
            <Separator />
    
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                 <Card className="w-full">
                    <CardHeader className="items-center text-center">
                        <div className="p-4 bg-primary/10 rounded-full mb-2">
                            <FileText className="w-12 h-12 text-primary" />
                        </div>
                        <CardTitle>ملف المحاضرة (PDF)</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Button size="lg" asChild>
                            <a href={lecture.pdfUrl} target="_blank" rel="noopener noreferrer">
                                ذاكر المحاضرة
                            </a>
                        </Button>
                    </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    {lecture.youtubeVideoUrl && (
                    <VideoPlayerDialog youtubeUrl={lecture.youtubeVideoUrl} />
                    )}
                    {lecture.quiz ? (
                    <Button size="lg" asChild>
                        <Link href={`/quizzes/${lecture.subjectId}/${lecture.id}`}>
                        <FileQuestion className="ml-2 h-5 w-5" />
                        بدء اختبار: {lecture.quiz.title}
                        </Link>
                    </Button>
                    ) : (
                    <Button size="lg" variant="secondary" disabled>
                        <FileQuestion className="ml-2 h-5 w-5" />
                        لا يوجد اختبار لهذه المحاضرة
                    </Button>
                    )}
                </div>
              </div>

               {lecture.summary && (
                    <Card className="w-full">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                               <BookText className="h-6 w-6 text-primary"/>
                               <CardTitle>ملخص كتابي للمحاضرة</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-lg max-w-none text-foreground whitespace-pre-wrap">
                                {lecture.summary}
                            </div>
                        </CardContent>
                    </Card>
               )}
            </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto py-10 px-4">
        {pageContent()}
      </main>
      <Footer />
    </div>
  );
}
