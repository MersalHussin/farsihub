"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const questionSchema = z.object({
  text: z.string().min(5, "يجب أن يكون السؤال 5 أحرف على الأقل."),
  options: z.array(z.string().min(1, "الخيار لا يمكن أن يكون فارغًا.")).min(2, "يجب أن يكون هناك خياران على الأقل."),
  correctAnswer: z.string().min(1, "الرجاء تحديد الإجابة الصحيحة."),
});

const formSchema = z.object({
  title: z.string().min(3, { message: "يجب أن يتكون العنوان من 3 أحرف على الأقل." }),
  description: z.string().min(10, { message: "يجب أن يتكون الوصف من 10 أحرف على الأقل." }),
  pdfUrl: z.string().url({ message: "الرجاء إدخال رابط صالح." }),
  subject: z.string().min(2, { message: "يجب إدخال اسم المادة." }),
  semester: z.enum(["first", "second"], {
    required_error: "الرجاء تحديد الفصل الدراسي.",
  }),
  year: z.enum(["first", "second", "third", "fourth"], {
    required_error: "الرجاء تحديد الفرقة الدراسية.",
  }),
  hasQuiz: z.boolean().default(false),
  quiz: z.object({
      title: z.string(),
      questions: z.array(questionSchema)
  }).optional()
}).refine(data => {
    if (data.hasQuiz) {
        return data.quiz && data.quiz.title.length > 0 && data.quiz.questions.length > 0;
    }
    return true;
}, {
    message: "إذا تم تفعيل الاختبار، يجب توفير عنوان للاختبار وسؤال واحد على الأقل.",
    path: ["quiz"],
});


type AddLectureDialogProps = {
  onLectureAdded: () => void;
};

export default function AddLectureDialog({ onLectureAdded }: AddLectureDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      pdfUrl: "",
      subject: "",
      hasQuiz: false,
      quiz: {
        title: "",
        questions: [],
      }
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
      const lectureData: any = {
        title: values.title,
        description: values.description,
        pdfUrl: values.pdfUrl,
        year: values.year,
        subject: values.subject,
        semester: values.semester,
        createdAt: serverTimestamp(),
      };

      if (values.hasQuiz && values.quiz) {
        lectureData.quiz = values.quiz;
      }

      await addDoc(collection(db, "lectures"), lectureData);
      
      toast({
        title: "تمت إضافة المحاضرة",
        description: "تمت إضافة المحاضرة بنجاح.",
      });
      form.reset();
      setIsOpen(false);
      onLectureAdded();
    } catch (error) {
      console.error("Error adding lecture: ", error);
      toast({
        variant: "destructive",
        title: "فشل إضافة المحاضرة",
        description: "حدث خطأ أثناء إضافة المحاضرة.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="ml-2 h-4 w-4" />
          إضافة محاضرة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>إضافة محاضرة جديدة</DialogTitle>
          <DialogDescription>
            أدخل تفاصيل المحاضرة وأضف اختباراً إذا رغبت.
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
                    name="subject"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>اسم المادة</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="مثال: نصوص فارسية" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="year"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>الفرقة الدراسية</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر الفرقة" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="first">الفرقة الأولى</SelectItem>
                                    <SelectItem value="second">الفرقة الثانية</SelectItem>
                                    <SelectItem value="third">الفرقة الثالثة</SelectItem>
                                    <SelectItem value="fourth">الفرقة الرابعة</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="semester"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>الفصل الدراسي</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر الفصل" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="first">الفصل الأول</SelectItem>
                                    <SelectItem value="second">الفصل الثاني</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
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

                    <Separator />

                    <FormField
                        control={form.control}
                        name="hasQuiz"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                        إضافة اختبار لهذه المحاضرة
                                    </FormLabel>
                                    <FormDescription>
                                        قم بتفعيل هذا الخيار لإضافة اختبار قصير مرتبط بالمحاضرة.
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
                                                                    <RadioGroupItem value={field.value} />
                                                                    <Input {...field} placeholder={`خيار ${optionIndex + 1}`} />
                                                                </div>
                                                                </FormControl>
                                                            </FormItem>
                                                            )}
                                                        />
                                                        ))}
                                                    </div>
                                                </RadioGroup>
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
                إضافة
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    