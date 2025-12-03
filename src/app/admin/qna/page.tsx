
"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { QnA } from "@/lib/types";
import { Loader2, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { errorEmitter } from "@/lib/error-emitter";
import { FirestorePermissionError } from "@/lib/errors";


export default function QnaAdminPage() {
  const [questions, setQuestions] = useState<QnA[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    const db = getFirebaseDb();
    if(!db) return;
    setLoading(true);

    const qnaCollection = collection(db, "qna");
    const statusFilter = activeTab === 'answered' ? true : false;
    const q = query(qnaCollection, where("answered", "==", statusFilter), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const qnaList: QnA[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QnA));
      setQuestions(qnaList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching Q&A: ", error);
      const permissionError = new FirestorePermissionError({
          path: 'qna',
          operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast, activeTab]);

  const AnswerForm = ({ questionId }: { questionId: string }) => {
    const [answer, setAnswer] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!answer.trim()) {
            toast({ variant: "destructive", title: "لا يمكن إرسال إجابة فارغة." });
            return;
        }
        setIsSubmitting(true);
        const db = getFirebaseDb();
        if(!db) {
            toast({ variant: "destructive", title: "فشل الاتصال بقاعدة البيانات." });
            setIsSubmitting(false);
            return;
        };

        const qnaDocRef = doc(db, "qna", questionId);
        const updateData = {
            answer: answer,
            answered: true,
            answeredAt: serverTimestamp(),
        };

        updateDoc(qnaDocRef, updateData)
        .then(() => {
            toast({ title: "تم إرسال الإجابة بنجاح" });
        })
        .catch((error) => {
            console.error("Error submitting answer:", error);
            const permissionError = new FirestorePermissionError({
                path: qnaDocRef.path,
                operation: 'update',
                requestResourceData: updateData
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setIsSubmitting(false);
        });
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 items-start pt-4">
            <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="اكتب إجابتك هنا..."
                className="flex-grow"
                rows={3}
            />
            <Button type="submit" size="icon" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
        </form>
    );
  }

  const getInitials = (name?: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      );
    }
    
    if (questions.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-24 border rounded-lg">
          <p>لا توجد أسئلة في هذا القسم حالياً.</p>
        </div>
      );
    }

    return (
      <Accordion type="single" collapsible className="w-full space-y-4">
        {questions.map((q) => (
          <AccordionItem value={q.id} key={q.id} className="bg-card border rounded-lg">
            <AccordionTrigger className="p-4 text-right hover:no-underline">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
                    <p className="font-semibold text-base flex-1 break-words">{q.question}</p>
                    <div className="flex items-center gap-4 shrink-0">
                       <Badge variant="outline">{q.subjectName} / {q.lectureTitle}</Badge>
                       <span className="text-xs text-muted-foreground">
                            {q.createdAt ? formatDistanceToNow(q.createdAt.toDate(), { addSuffix: true, locale: ar }) : ''}
                        </span>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                       <Avatar className="h-9 w-9">
                          <AvatarImage src={q.userPhotoURL ?? ''} />
                          <AvatarFallback>{getInitials(q.userName)}</AvatarFallback>
                       </Avatar>
                       <div>
                           <p className="font-semibold text-sm">{q.userName}</p>
                           <p className="text-xs text-muted-foreground">{q.userEmail}</p>
                       </div>
                   </div>
                    {q.answered && q.answer ? (
                        <div>
                            <h4 className="font-semibold text-primary mb-1">الإجابة:</h4>
                            <p className="whitespace-pre-wrap text-foreground bg-primary/5 p-3 rounded-md">{q.answer}</p>
                        </div>
                    ) : (
                       <AnswerForm questionId={q.id} />
                    )}
                </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إدارة الأسئلة والأجوبة</CardTitle>
          <CardDescription>
            مراجعة أسئلة الطلاب والإجابة عليها لتظهر في صفحات المحاضرات.
          </CardDescription>
        </CardHeader>
      </Card>
      
       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">أسئلة معلقة</TabsTrigger>
                <TabsTrigger value="answered">تمت الإجابة</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">{renderContent()}</TabsContent>
            <TabsContent value="answered">{renderContent()}</TabsContent>
        </Tabs>
    </div>
  );
}
