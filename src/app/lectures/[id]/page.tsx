"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { Lecture } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, FileQuestion } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function LectureDetailsPage() {
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  useEffect(() => {
    if (typeof id !== 'string') return;
    async function fetchLecture() {
      setLoading(true);
      try {
        const docRef = doc(db, "lectures", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setLecture({ id: docSnap.id, ...docSnap.data() } as Lecture);
        } else {
          toast({ variant: "destructive", title: "المحاضرة غير موجودة" });
          router.push('/lectures');
        }
      } catch (error) {
        console.error("Error fetching lecture: ", error);
        toast({ variant: "destructive", title: "فشل تحميل المحاضرة" });
      } finally {
        setLoading(false);
      }
    }
    fetchLecture();
  }, [id, toast, router]);

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
        <div className="space-y-6">
            <div>
              <Button variant="ghost" onClick={() => router.push('/lectures')} className="mb-4">
                  <ArrowRight className="ml-2 h-4 w-4" />
                  العودة للمحاضرات
              </Button>
              <h1 className="text-3xl font-bold">{lecture.title}</h1>
              <p className="text-lg text-muted-foreground mt-2">{lecture.description}</p>
            </div>
            <Separator />
    
            <div className="space-y-6">
              <div className="aspect-video w-full">
                  <iframe
                  src={lecture.pdfUrl}
                  className="w-full h-full rounded-lg border"
                  title={lecture.title}
                  ></iframe>
              </div>
              
              <div className="text-center">
                  <Button size="lg" variant="secondary" disabled>
                      <FileQuestion className="ml-2 h-5 w-5" />
                      بدء الاختبار (قريباً)
                  </Button>
              </div>
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
