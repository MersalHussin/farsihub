"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { setDoc, doc, serverTimestamp, collection } from "firebase/firestore";
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
import { Loader2, PlusCircle } from "lucide-react";
import { LectureYear, Semester } from "@/lib/types";
import { errorEmitter } from "@/lib/error-emitter";
import { FirestorePermissionError } from "@/lib/errors";

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
  year: z.nativeEnum(Object.keys(yearMap).reduce((acc, key) => ({...acc, [key]: key}), {} as Record<LectureYear, LectureYear>)),
  semester: z.nativeEnum(Object.keys(semesterMap).reduce((acc, key) => ({...acc, [key]: key}), {} as Record<Semester, Semester>)),
});


type AddSubjectDialogProps = {
  onSubjectAdded: () => void;
};

export default function AddSubjectDialog({ onSubjectAdded }: AddSubjectDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    const newSubjectRef = doc(collection(db, "subjects"));
    const subjectData = {
        ...values,
        createdAt: serverTimestamp(),
        id: newSubjectRef.id,
    };

    setDoc(newSubjectRef, subjectData)
        .then(() => {
            toast({
                title: "تمت إضافة المادة",
                description: "تمت إضافة المادة الدراسية بنجاح.",
            });
            form.reset();
            setIsOpen(false);
            onSubjectAdded();
        })
        .catch((error) => {
            console.error("Error adding subject: ", error);
            const permissionError = new FirestorePermissionError({
                path: newSubjectRef.path,
                operation: 'create',
                requestResourceData: subjectData,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: "destructive",
                title: "فشل إضافة المادة",
                description: "حدث خطأ أثناء إضافة المادة.",
            });
        })
        .finally(() => {
            setIsLoading(false);
        });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="ml-2 h-4 w-4" />
          إضافة مادة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة مادة دراسية جديدة</DialogTitle>
          <DialogDescription>
            أدخل تفاصيل المادة الجديدة.
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
                إضافة
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
