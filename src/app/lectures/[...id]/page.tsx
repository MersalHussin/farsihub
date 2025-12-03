
"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { Lecture, QnA } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, FileQuestion, FileText, BookText, MessageSquarePlus, Send, HelpCircle, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import { VideoPlayerDialog } from "./video-player-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { errorEmitter } from "@/lib/error-emitter";
import { FirestorePermissionError } from "@/lib/errors";

const AskQuestionForm = ({ lecture }: { lecture: Lecture }) => {
    const [question, setQuestion] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ variant: "destructive", title: "يجب تسجيل الدخول لطرح سؤال." });
            return;
        }
        if (!question.trim()) {
            toast({ variant: "destructive", title: "لا يمكن إرسال سؤال فارغ." });
            return;
        }

        setIsSubmitting(true);
        const db = getFirebaseDb();
        if(!db) {
            toast({ variant: "destructive", title: "فشل الاتصال بقاعدة البيانات." });
            setIsSubmitting(false);
            return;
        };

        const qnaData = {
            question,
            lectureId: lecture.id,
            lectureTitle: lecture.title,
            subjectId: lecture.subjectId,
            subjectName: lecture.subjectName,
            userId: user.uid,
            userName: user.name,
            userEmail: user.email,
            userPhotoURL: user.photoURL || null,
            answered: false,
            answer: null,
            createdAt: serverTimestamp(),
            answeredAt: null,
        };
        
        const qnaCollectionRef = collection(db, "qna");

        addDoc(qnaCollectionRef, qnaData)
        .then(() => {
            setQuestion("");
            toast({ title: "تم إرسال سؤالك بنجاح!", description: "سيتم مراجعته والإجابة عليه قريبًا." });
        })
        .catch((error) => {
            console.error("Error submitting question:", error);
            const permissionError = new FirestorePermissionError({
                path: 'qna',
                operation: 'create',
                requestResourceData: qnaData
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setIsSubmitting(false);
        });
    };
    
    if (!user) {
        return (
            <div className="text-center p-4 border rounded-lg bg-muted/50">
                <p>
                    <Link href="/login" className="underline font-bold">سجل الدخول</Link> أو 
                    <Link href="/signup" className="underline font-bold"> أنشئ حسابًا جديدًا </Link>
                     لتتمكن من طرح الأسئلة.
                </p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="لديك سؤال؟ اكتبه هنا..."
                rows={4}
            />
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Send className="ml-2 h-4 w-4" />}
                إرسال السؤال
            </Button>
        </form>
    )
}

const QnaSection = ({ lecture }: { lecture: Lecture }) => {
    const [questions, setQuestions] = useState<QnA[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!lecture) return;

        const db = getFirebaseDb();
        if(!db) return;
        
        const q = query(
            collection(db, "qna"),
            where("lectureId", "==", lecture.id),
            where("answered", "==", true),
            orderBy("answeredAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const answeredQuestions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QnA));
            setQuestions(answeredQuestions);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching answered questions:", error);
            const permissionError = new FirestorePermissionError({
                path: `qna`,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [lecture, toast]);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <HelpCircle className="h-6 w-6 text-primary"/>
                    <CardTitle>الأسئلة والأجوبة</CardTitle>
                </div>
                <CardDescription>
                    اطرح سؤالك أو تصفح أسئلة زملائك التي تمت الإجابة عليها.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <AskQuestionForm lecture={lecture} />
                <Separator />
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin"/></div>
                ) : questions.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full space-y-2">
                        {questions.map((qna) => (
                             <AccordionItem value={qna.id} key={qna.id} className="border-b">
                                <AccordionTrigger className="text-right text-base font-semibold hover:no-underline">
                                    <div className="flex items-start gap-3">
                                      <HelpCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-1"/>
                                      <span>{qna.question}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2">
                                   <div className="p-4 bg-primary/5 rounded-lg space-y-3">
                                        <div className="flex items-center gap-2 text-primary font-bold">
                                           <CheckCircle className="h-5 w-5"/>
                                           <span>الإجابة</span>
                                        </div>
                                       <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                                            {qna.answer}
                                        </p>
                                        <p className="text-xs text-muted-foreground pt-2 border-t">
                                            تمت الإجابة {qna.answeredAt ? formatDistanceToNow(qna.answeredAt.toDate(), { addSuffix: true, locale: ar }) : ''}
                                        </p>
                                   </div>
                                </AccordionContent>
                             </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <p className="text-center text-muted-foreground p-4">لا توجد أسئلة تمت الإجابة عليها لهذه المحاضرة بعد. كن أول من يسأل!</p>
                )}
            </CardContent>
        </Card>
    )
}

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
            <Separator />
            <QnaSection lecture={lecture} />
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
