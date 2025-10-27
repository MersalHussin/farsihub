"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { doc, updateDoc } from "firebase/firestore";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil } from "lucide-react";
import { LectureYear, Semester, Subject } from "@/lib/types";

const yearMap: Record<LectureYear, string> = {
  first: "الفرقة الأولى",
  second: "الفرقة الثانية",
  third: "الفرقة الثالثة",
  fourth: "الفرقة الرابعة",
};

const semesterMap: Record<Semester, string> = {
  first: "الفصل الدراسي الأول",
  second: "الفصل الدراسي الثاني",
};

const formSchema = z.object({
  name: z.string().min(3, { message: "يجب أن يتكون اسم المادة من 3 أحرف على الأقل." }),
  year: z.enum(["first", "second", "third", "fourth"], { required_error: "الرجاء تحديد الفرقة الدراسية."}),
  semester: z.enum(["first", "second"], { required_error: "الرجاء تحديد الفصل الدراسي."}),
});

type EditSubjectDialogProps = {
  subject: Subject;
  onSubjectUpdated: () => void;
};

export default function EditSubjectDialog({ subject, onSubjectUpdated }: EditSubjectDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: subject.name,
      year: subject.year,
      semester: subject.semester,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    const subjectRef = doc(db, "subjects", subject.id);
    updateDoc(subjectRef, values)
        .then(() => {
            toast({
                title: "تم تحديث المادة",
                description: "تم تحديث بيانات المادة بنجاح.",
            });
            setIsOpen(false);
            onSubjectUpdated();
        })
        .catch((error) => {
            console.error("Error updating subject: ", error);
            toast({
                variant: "destructive",
                title: "فشل تحديث المادة",
                description: "حدث خطأ أثناء تحديث المادة.",
            });
        })
        .finally(() => {
            setIsLoading(false);
        });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
            <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تعديل المادة الدراسية</DialogTitle>
          <DialogDescription>
            قم بتحديث تفاصيل المادة.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
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
                      {Object.entries(yearMap).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                      ))}
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
                        <SelectValue placeholder="اختر الفصل الدراسي" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(semesterMap).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0 pt-4">
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
