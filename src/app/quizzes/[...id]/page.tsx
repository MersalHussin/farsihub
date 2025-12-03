
"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, writeBatch } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Lecture, Quiz, QuizSubmission } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Confetti from 'react-dom-confetti';
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const idParams = params.id || [];
  const [subjectId, lectureId] = idParams;

  const fetchLecture = useCallback(async () => {
    if (!user) {
        setLoading(false);
        router.push('/login');
        return;
    }
    if (typeof subjectId !== 'string' || typeof lectureId !== 'string') {
        setLoading(false);
        toast({ variant: "destructive", title: "رابط غير صالح" });
        router.push('/lectures');
        return;
    };

    setLoading(true);
    try {
        const db = getFirebaseDb();
        if (!db) throw new Error("Firestore is not initialized.");

        const lectureRef = doc(db, "subjects", subjectId, "lectures", lectureId);
        const lectureSnap = await getDoc(lectureRef);

        if (lectureSnap.exists()) {
            const lectureData = { id: lectureSnap.id, ...lectureSnap.data() } as Lecture;
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
    } catch (error) {
        console.error("Error fetching data: ", error);
        toast({ variant: "destructive", title: "فشل تحميل البيانات" });
    } finally {
        setLoading(false);
    }
  }, [subjectId, lectureId, user, toast, router]);

  useEffect(() => {
    fetchLecture();
  }, [fetchLecture]);


  const handleNextQuestion = () => {
    const currentQuestion = quiz?.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    if (currentQuestion.type === 'mcq' && selectedAnswer === null) {
      toast({
        variant: "destructive",
        title: "الرجاء اختيار إجابة",
        description: "يجب عليك اختيار إجابة قبل المتابعة.",
      });
      return;
    }

    if (currentQuestion.type === 'essay' && (selectedAnswer === null || selectedAnswer.trim() === '')) {
      toast({
        variant: "destructive",
        title: "الرجاء كتابة إجابة",
        description: "يجب عليك كتابة إجابة للسؤال المقالي.",
      });
      return;
    }

    const newAnswers = { ...answers, [currentQuestionIndex]: selectedAnswer! };
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz(newAnswers);
    }
  };
  
  const finishQuiz = async (finalAnswers: Record<number, string>) => {
    if(!quiz || !user || !lecture || !subjectId || !lectureId) return;
    setIsSubmitting(true);
    let correctCount = 0;
    quiz.questions.forEach((question, index) => {
        if(question.type === 'mcq' && finalAnswers[index] === question.correctAnswer) {
            correctCount++;
        }
        if(question.type === 'essay' && finalAnswers[index].trim() !== '') {
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
        quizId: lectureId,
        quizTitle: quiz.title,
        lectureId: lectureId,
        subjectId: subjectId,
        userId: user.uid,
        userName: user.name,
        score: finalScore,
        answers: finalAnswers,
        submittedAt: serverTimestamp(),
    };

    try {
        const db = getFirebaseDb();
        if (!db) throw new Error("Firestore is not initialized.");
        await addDoc(collection(db, "quizSubmissions"), submissionData);
        toast({ title: "تم تقديم الاختبار بنجاح!" });
    } catch(error) {
        console.error("Error creating submission: ", error);
        toast({ variant: "destructive", title: "فشل حفظ نتيجتك." });
    } finally {
        setIsSubmitting(false);
    }
  };
  
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
                    <CardTitle>نتيجة الاختبار</CardTitle>
                    <CardDescription>
                       لقد أكملت الاختبار بنجاح.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-5xl font-bold">{Math.round(score)}%</p>
                    <p className="text-muted-foreground">
                       أجبت بشكل صحيح على {Math.round(score/100 * quiz.questions.length)} من {quiz.questions.length} أسئلة.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
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
          
          {question.type === 'mcq' && question.options && (
            <RadioGroup dir="rtl" value={selectedAnswer ?? ''} onValueChange={setSelectedAnswer}>
                {question.options.map((option, index) => (
                option && (
                    <Label key={index} htmlFor={`option-${index}`} className="flex items-center gap-4 text-base p-4 border rounded-md cursor-pointer hover:bg-muted/50 has-[:checked]:bg-muted has-[:checked]:border-primary">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    {option}
                    </Label>
                )
                ))}
            </RadioGroup>
          )}

          {question.type === 'essay' && (
            <div className="space-y-4">
                <Textarea 
                    rows={8}
                    placeholder="اكتب إجابتك هنا..."
                    value={selectedAnswer ?? ''}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    className="text-base"
                />
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>ملاحظة هامة</AlertTitle>
                    <AlertDescription>
                        سيتم احتساب هذا السؤال صحيحاً بمجرد كتابة أي إجابة. يمكنك مراجعة إجابتك لاحقاً مع المسؤول.
                    </AlertDescription>
                </Alert>
            </div>
          )}

        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleNextQuestion} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
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
