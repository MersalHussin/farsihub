"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Trash2, Pencil } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { Subject, Lecture } from "@/lib/types";

const questionSchema = z.object({
  text: z.string().min(5, "يجب أن يكون السؤال 5 أحرف على الأقل."),
  options: z.array(z.string().min(1, "الخيار لا يمكن أن يكون فارغًا.")).min(2, "يجب أن يكون هناك خياران على الأقل."),
  correctAnswer: z.string({required_error: "الرجاء تحديد الإجابة الصحيحة."}).min(1, "الرجاء تحديد الإجابة الصحيحة."),
});

const formSchema = z.object({
  title: z.string().min(3, { message: "يجب أن يتكون العنوان من 3 أحرف على الأقل." }),
  description: z.string().min(10, { message: "يجب أن يتكون الوصف من 10 أحرف على الأقل." }),
  pdfUrl: z.string().url({ message: "الرجاء إدخال رابط صالح." }),
  youtubeVideoUrl: z.string().url({ message: "الرجاء إدخال رابط يوتيوب صالح." }).optional().or(z.literal('')),
  hasQuiz: z.boolean().default(false),
  quiz: z.object({
      title: z.string(),
      questions: z.array(questionSchema)
  }).nullable().optional()
}).refine(data => {
    if (data.hasQuiz) {
        return data.quiz && data.quiz.title.length > 0 && data.quiz.questions.length > 0;
    }
    return true;
}, {
    message: "إذا تم تفعيل الاختبار، يجب توفير عنوان للاختبار وسؤال واحد على الأقل.",
    path: ["quiz"],
});


type EditLectureDialogProps = {
  onLectureUpdated: () => void;
  subject: Subject;
  lecture: Lecture;
};

export default function EditLectureDialog({ onLectureUpdated, subject, lecture }: EditLectureDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: lecture.title,
      description: lecture.description,
      pdfUrl: lecture.pdfUrl,
      youtubeVideoUrl: lecture.youtubeVideoUrl || '',
      hasQuiz: !!lecture.quiz,
      quiz: lecture.quiz || { title: "", questions: [] },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "quiz.questions",
  });

  const hasQuiz = form.watch("hasQuiz");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const db = getFirebaseDb();
      if (!db) throw new Error("Firestore is not initialized.");
      const lectureDocRef = doc(db, "subjects", subject.id, "lectures", lecture.id);
      
      const lectureData: any = {
        title: values.title,
        description: values.description,
        pdfUrl: values.pdfUrl,
        youtubeVideoUrl: values.youtubeVideoUrl || deleteField(),
        quiz: values.hasQuiz && values.quiz ? values.quiz : deleteField(),
      };
      
      if (lectureData.quiz) {
         lectureData.quiz.questions = lectureData.quiz.questions.map((q: any) => ({
                ...q,
                options: q.options.filter((opt: string) => opt.trim() !== ""), // remove empty options
            }));
      }


      await updateDoc(lectureDocRef, lectureData);
      
      toast({
        title: "تم تحديث المحاضرة",
        description: "تم تحديث المحاضرة بنجاح.",
      });
      setIsOpen(false);
      onLectureUpdated();
    } catch (error) {
      console.error("Error updating lecture: ", error);
      toast({
        variant: "destructive",
        title: "فشل تحديث المحاضرة",
        description: "حدث خطأ أثناء تحديث المحاضرة.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>تعديل المحاضرة: {lecture.title}</DialogTitle>
          <DialogDescription>
            قم بتحديث تفاصيل المحاضرة.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <ScrollArea className="h-[70vh] p-4">
                 <div className="space-y-6">
                    <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>عنوان المحاضرة</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>وصف المحاضرة</FormLabel>
                        <FormControl>
                            <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    
                    <FormField
                    control={form.control}
                    name="pdfUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>رابط PDF</FormLabel>
                        <FormControl>
                            <Input dir='ltr' placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField
                    control={form.control}
                    name="youtubeVideoUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>رابط فيديو يوتيوب (اختياري)</FormLabel>
                        <FormControl>
                            <Input dir='ltr' placeholder="https://www.youtube.com/watch?v=..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <Separator />

                    <FormField
                        control={form.control}
                        name="hasQuiz"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                        إضافة/تعديل اختبار لهذه المحاضرة
                                    </FormLabel>
                                    <FormDescription>
                                        قم بتفعيل هذا الخيار لإضافة أو تعديل الاختبار القصير.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    
                    {hasQuiz && (
                        <div className="space-y-4 border p-4 rounded-md">
                             <FormField
                                control={form.control}
                                name="quiz.title"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>عنوان الاختبار</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="اختبار المحاضرة الأولى" />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <div>
                                <FormLabel>أسئلة الاختبار</FormLabel>
                                <div className="space-y-4 mt-2">
                                    {fields.map((field, index) => (
                                    <div key={field.id} className="border p-4 rounded-md space-y-3 relative">
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="icon" 
                                            className="absolute top-2 left-2 h-6 w-6" 
                                            onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>

                                        <FormField
                                        control={form.control}
                                        name={`quiz.questions.${index}.text`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>نص السؤال {index + 1}</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                        
                                        <FormField
                                        control={form.control}
                                        name={`quiz.questions.${index}.correctAnswer`}
                                        render={({ field: radioField }) => (
                                            <FormItem className="space-y-3">
                                                <FormLabel>الخيارات والإجابة الصحيحة</FormLabel>
                                                 <FormDescription>
                                                    اختر الإجابة الصحيحة بالضغط على الدائرة بجانبها.
                                                </FormDescription>
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={radioField.onChange}
                                                        defaultValue={radioField.value}
                                                        className="flex flex-col space-y-1"
                                                    >
                                                        <div className="space-y-2">
                                                            {[0, 1, 2, 3].map((optionIndex) => (
                                                            <FormField
                                                                key={optionIndex}
                                                                control={form.control}
                                                                name={`quiz.questions.${index}.options.${optionIndex}`}
                                                                render={({ field }) => (
                                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                                    <FormControl>
                                                                    <div className="flex items-center gap-2 w-full">
                                                                        <RadioGroupItem value={field.value ?? ''} disabled={!field.value} />
                                                                        <Input {...field} placeholder={`خيار ${optionIndex + 1}`} />
                                                                    </div>
                                                                    </FormControl>
                                                                </FormItem>
                                                                )}
                                                            />
                                                            ))}
                                                        </div>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                    </div>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-4"
                                    onClick={() => append({ text: "", options: ["", "", "", ""], correctAnswer: "" })}
                                >
                                    <PlusCircle className="ml-2 h-4 w-4" />
                                    إضافة سؤال
                                </Button>
                                <FormMessage>{form.formState.errors.quiz?.questions?.message}</FormMessage>
                                <FormMessage>{form.formState.errors.quiz?.root?.message}</FormMessage>
                            </div>
                        </div>
                    )}
                 </div>
            </ScrollArea>
            <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
                <DialogClose asChild>
                    <Button type="button" variant="secondary">
                        إلغاء
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حفظ التعديلات
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
