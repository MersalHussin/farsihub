"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Lecture, Quiz } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Confetti from 'react-dom-confetti';
import { errorEmitter } from "@/lib/error-emitter";
import { FirestorePermissionError, type SecurityRuleContext } from "@/lib/errors";
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

interface Submission {
    id: string;
    score: number;
}

export default function TakeQuizPage() {
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const idParams = params.id || [];
  const [subjectId, lectureId] = idParams;

  const fetchLectureAndSubmission = useCallback(async () => {
    if (typeof subjectId !== 'string' || typeof lectureId !== 'string' || !user) return;
    setLoading(true);
    
    try {
        const submissionQuery = query(
            collection(db, "quizSubmissions"),
            where("userId", "==", user.uid),
            where("lectureId", "==", lectureId)
        );
        
        getDocs(submissionQuery).then((submissionSnapshot) => {
            if (!submissionSnapshot.empty) {
                const submissionDoc = submissionSnapshot.docs[0];
                setExistingSubmission({ id: submissionDoc.id, score: submissionDoc.data().score });
            }
        }).catch((error) => {
            console.error("Error fetching submissions:", error);
            const permissionError = new FirestorePermissionError({
                path: 'quizSubmissions',
                operation: 'list'
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        });

        const docRef = doc(db, "subjects", subjectId, "lectures", lectureId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const lectureData = { id: docSnap.id, ...docSnap.data() } as Lecture;
            setLecture(lectureData);
            if (lectureData.quiz) {
                setQuiz(lectureData.quiz);
            } else {
                toast({ variant: "destructive", title: "الاختبار غير موجود لهذه المحاضرة" });
                router.push(`/lectures/${subjectId}/${lectureId}`);
            }
        } else {
            toast({ variant: "destructive", title: "المحاضرة غير موجودة" });
            router.push('/lectures');
        }
    } catch(error) {
        console.error("Error fetching data: ", error);
        toast({ variant: "destructive", title: "فشل تحميل البيانات" });
    } finally {
        setLoading(false);
    }
  }, [subjectId, lectureId, user, toast, router]);

  useEffect(() => {
    if (user) {
        fetchLectureAndSubmission();
    }
  }, [fetchLectureAndSubmission, user]);

  const handleNextQuestion = () => {
    if (selectedAnswer === null) {
      toast({
        variant: "destructive",
        title: "الرجاء اختيار إجابة",
        description: "يجب عليك اختيار إجابة قبل المتابعة.",
      });
      return;
    }

    const newAnswers = { ...answers, [currentQuestionIndex]: selectedAnswer };
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz(newAnswers);
    }
  };
  
  const finishQuiz = (finalAnswers: Record<number, string>) => {
    if(!quiz || !user || !lecture || !subjectId || !lectureId) return;
    let correctCount = 0;
    quiz.questions.forEach((question, index) => {
        if(finalAnswers[index] === question.correctAnswer) {
            correctCount++;
        }
    });
    const finalScore = (correctCount / quiz.questions.length) * 100;
    setScore(finalScore);
    setIsFinished(true);
    
    if(finalScore > 80) {
        setShowConfetti(true);
    }

    const submissionData = {
        quizId: lectureId, // Using lectureId as quizId for simplicity
        quizTitle: quiz.title,
        lectureId: lectureId,
        subjectId: subjectId,
        userId: user.uid,
        userName: user.name,
        score: finalScore,
        answers: finalAnswers,
        submittedAt: serverTimestamp(),
    };

    addDoc(collection(db, "quizSubmissions"), submissionData)
        .then((docRef) => {
            setExistingSubmission({ id: docRef.id, score: finalScore });
            toast({ title: "تم تقديم الاختبار بنجاح!" });
        })
        .catch(async (error) => {
            const permissionError = new FirestorePermissionError({
                path: 'quizSubmissions',
                operation: 'create',
                requestResourceData: submissionData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  const handleRetakeQuiz = async () => {
    if (!existingSubmission) return;
    try {
        const submissionRef = doc(db, "quizSubmissions", existingSubmission.id);
        await deleteDoc(submissionRef);

        // Reset state to start the quiz again
        setExistingSubmission(null);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setSelectedAnswer(null);
        setIsFinished(false);
        setScore(0);
        toast({ title: "يمكنك الآن إعادة الاختبار." });
    } catch(e: any) {
        const permissionError = new FirestorePermissionError({
            path: `quizSubmissions/${existingSubmission.id}`,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: "destructive", title: "فشل حذف النتيجة السابقة." });
    }
  }


  const renderQuizContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full py-24">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (!quiz || !lecture) {
      return <div className="text-center py-24">
          <h2 className="text-2xl font-bold">لم يتم العثور على الاختبار</h2>
          <p className="text-muted-foreground">قد تكون المحاضرة أو الاختبار الذي تبحث عنه قد حُذف.</p>
          <Button variant="outline" onClick={() => router.push('/lectures')} className="mt-4">
                العودة للمحاضرات
            </Button>
        </div>;
    }
    
    if (existingSubmission && !isFinished) {
         return (
            <Card className="w-full max-w-2xl mx-auto text-center">
                <CardHeader>
                    <CardTitle>لقد أكملت هذا الاختبار بالفعل!</CardTitle>
                    <CardDescription>هذه هي نتيجتك السابقة.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-5xl font-bold">{Math.round(existingSubmission.score)}%</p>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="outline">إعادة الاختبار</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                    هل أنت متأكد أنك تريد إعادة الاختبار؟ سيتم حذف نتيجتك السابقة.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={handleRetakeQuiz}>
                                    نعم، أعد الاختبار
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button onClick={() => router.push(`/lectures/${lecture.subjectId}/${lecture.id}`)}>
                        <ArrowRight className="ml-2 h-4 w-4" />
                        العودة إلى المحاضرة
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    if(isFinished) {
        return (
            <Card className="w-full max-w-2xl mx-auto text-center">
                 <Confetti active={ showConfetti } config={{
                    angle: 90,
                    spread: 360,
                    startVelocity: 40,
                    elementCount: 70,
                    dragFriction: 0.12,
                    duration: 3000,
                    stagger: 3,
                    width: "10px",
                    height: "10px",
                    perspective: "500px",
                    colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
                 }}/>
                <CardHeader>
                    <CardTitle>لقد أكملت الاختبار!</CardTitle>
                    <CardDescription>هذه هي نتيجتك.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-5xl font-bold">{Math.round(score)}%</p>
                    <p className="text-muted-foreground">
                       أجبت بشكل صحيح على {Math.round(score/100 * quiz.questions.length)} من {quiz.questions.length} أسئلة.
                    </p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button onClick={() => router.push(`/lectures/${lecture.subjectId}/${lecture.id}`)}>
                        <ArrowRight className="ml-2 h-4 w-4" />
                        العودة إلى المحاضرة
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    const question = quiz.questions[currentQuestionIndex];
    
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{quiz.title}</CardTitle>
          <CardDescription>
            السؤال {currentQuestionIndex + 1} من {quiz.questions.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg font-semibold text-right">{question.text}</p>
          <RadioGroup dir="rtl" value={selectedAnswer ?? undefined} onValueChange={setSelectedAnswer}>
            {question.options.map((option, index) => (
              option && (
                <Label key={index} htmlFor={`option-${index}`} className="flex items-center gap-4 text-base p-4 border rounded-md cursor-pointer hover:bg-muted/50 has-[:checked]:bg-muted has-[:checked]:border-primary">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  {option}
                </Label>
              )
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleNextQuestion}>
            {currentQuestionIndex === quiz.questions.length - 1 ? "إنهاء الاختبار" : "السؤال التالي"}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto py-10 px-4">
        {renderQuizContent()}
      </main>
      <Footer />
    </div>
  );
}
