"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Loader2, PlusCircle } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(3, { message: "يجب أن يتكون العنوان من 3 أحرف على الأقل." }),
  description: z.string().min(10, { message: "يجب أن يتكون الوصف من 10 أحرف على الأقل." }),
  pdfUrl: z.string().url({ message: "الرجاء إدخال رابط صالح." }),
  year: z.enum(["first", "second", "third", "fourth"], {
    required_error: "الرجاء تحديد الفرقة الدراسية.",
  }),
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
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await addDoc(collection(db, "lectures"), {
        ...values,
        createdAt: serverTimestamp(),
      });
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>إضافة محاضرة جديدة</DialogTitle>
          <DialogDescription>
            أدخل تفاصيل المحاضرة الجديدة ورابط ملف PDF الخاص بها.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الفرقة الدراسية</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفرقة الدراسية" />
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
            <DialogFooter className="gap-2 sm:gap-0">
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
