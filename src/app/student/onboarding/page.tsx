
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { doc, updateDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { type LectureYear } from "@/lib/types";
import Image from 'next/image';
import { cn } from "@/lib/utils";

const yearMap: Record<LectureYear, string> = {
  first: "الفرقة الأولى",
  second: "الفرقة الثانية",
  third: "الفرقة الثالثة",
  fourth: "الفرقة الرابعة",
};

const boyAvatarUrl = 'https://i.suar.me/81XmV/l';
const girlAvatarUrl = 'https://i.suar.me/j5Q7x/l';


export default function OnboardingPage() {
  const { user, loading, logout, refreshUser, updateProfilePicture } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<LectureYear | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if user is not a student or has already selected a year
  useEffect(() => {
    if (!loading && user) {
        if (user.role !== 'student' || user.year) {
            router.replace('/dashboard');
        }
    }
     if (!loading && !user) {
        router.replace('/login');
     }
  }, [user, loading, router]);


  const handleSave = async () => {
    if (!user || !selectedYear || !selectedAvatar) {
        toast({
            variant: "destructive",
            title: "الرجاء إكمال جميع الخيارات.",
            description: "يجب اختيار الفرقة الدراسية والصورة الرمزية."
        });
      return;
    }
    setIsSubmitting(true);
    try {
      // We are updating both the user document and the auth profile picture
      await updateProfilePicture(selectedAvatar);

      const db = getFirebaseDb();
      if(db) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { 
          year: selectedYear,
          photoURL: selectedAvatar, // Save it to the document as well
        });
      }
      
      // Manually refresh user context to get the new 'year' and 'photoURL'
      await refreshUser();

      toast({
        title: "تم الحفظ بنجاح!",
        description: "سيتم توجيهك إلى لوحة التحكم.",
      });

      router.push('/dashboard');

    } catch (error) {
      console.error("Error updating user profile: ", error);
      toast({
        variant: "destructive",
        title: "فشل حفظ البيانات",
        description: "حدث خطأ ما، يرجى المحاولة مرة أخرى.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading || !user || user.year) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
       <div className="absolute top-6">
         <div className="flex items-center gap-2 font-bold text-xl">
            <Image src="https://i.suar.me/lpqVn/l" alt="Farsi Hub Logo" width={28} height={28} className="h-7 w-7" />
            <span>فارسي هب</span>
         </div>
      </div>
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">خطوة أخيرة يا {user.name}!</CardTitle>
          <CardDescription>
            لتخصيص تجربتك التعليمية، يرجى تحديد فرقتك الدراسية وصورتك الرمزية.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-2">
          <div>
            <Label className="text-lg font-semibold mb-3 block text-center">اختر فرقتك الدراسية</Label>
            <RadioGroup 
              onValueChange={(value) => setSelectedYear(value as LectureYear)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {Object.keys(yearMap).map((yearKey) => (
                <Label 
                  key={yearKey} 
                  htmlFor={yearKey}
                  className="flex items-center justify-center text-lg space-x-3 space-x-reverse rounded-lg border-2 p-4 cursor-pointer transition-all hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:text-primary"
                >
                  <RadioGroupItem value={yearKey} id={yearKey} className="h-5 w-5" />
                  <span className="font-bold">{yearMap[yearKey as LectureYear]}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div>
             <Label className="text-lg font-semibold mb-3 block text-center">اختر صورتك الرمزية</Label>
             <RadioGroup
                value={selectedAvatar ?? undefined}
                onValueChange={setSelectedAvatar}
                className="flex flex-col sm:flex-row gap-4"
            >
                <Label htmlFor="boy-avatar" className="flex-1 flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:text-primary">
                    <RadioGroupItem value={boyAvatarUrl} id="boy-avatar" className="sr-only" />
                    <Image 
                      src={boyAvatarUrl} 
                      alt="صورة ولد" 
                      width={80} 
                      height={80} 
                      className={cn(
                        "rounded-full transition-all",
                         selectedAvatar === boyAvatarUrl && 'ring-2 ring-offset-2 ring-primary'
                      )}
                    />
                    <span>ولد</span>
                </Label>
                <Label htmlFor="girl-avatar" className="flex-1 flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:text-primary">
                    <RadioGroupItem value={girlAvatarUrl} id="girl-avatar" className="sr-only" />
                    <Image 
                      src={girlAvatarUrl} 
                      alt="صورة بنت" 
                      width={80} 
                      height={80} 
                      className={cn(
                        "rounded-full transition-all",
                         selectedAvatar === girlAvatarUrl && 'ring-2 ring-offset-2 ring-primary'
                      )}
                    />
                    <span>بنت</span>
                </Label>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
             <Button onClick={handleSave} className="w-full" size="lg" disabled={isSubmitting || !selectedYear || !selectedAvatar}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                حفظ والمتابعة
            </Button>
            <Button variant="link" size="sm" className="text-muted-foreground" onClick={logout}>
                تسجيل الخروج
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
