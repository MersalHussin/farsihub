
"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const formSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صالح." }),
  password: z.string().min(1, { message: "كلمة المرور مطلوبة." }),
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صالح." }),
});

export default function LoginPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { loading, user } = useAuth();
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error("Firebase Auth is not initialized.");
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "سيتم توجيهك الآن...",
      });
      // The AuthProvider will handle the redirection.
    } catch (error: any) {
      console.error(error);
      let errorMessage = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التحقق منها وإعادة المحاولة.";
      }
      toast({
        variant: "destructive",
        title: "فشل تسجيل الدخول",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePasswordReset(values: z.infer<typeof forgotPasswordSchema>) {
    setIsResetLoading(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error("Firebase Auth is not initialized.");
      await sendPasswordResetEmail(auth, values.email);
      toast({
        title: "تم إرسال البريد الإلكتروني بنجاح",
        description: "يرجى التحقق من صندوق الوارد الخاص بك، ولا تنس تفقد مجلد الرسائل غير المرغوب فيها (Spam).",
      });
      setIsResetDialogOpen(false);
      forgotPasswordForm.reset();
    } catch (error: any) {
      console.error(error);
      let errorMessage = "حدث خطأ أثناء محاولة إرسال بريد إعادة التعيين. قد يكون بسبب إعدادات Firebase.";
      if (error.code === 'auth/user-not-found') {
          errorMessage = "هذا البريد الإلكتروني غير مسجل لدينا."
      }
      toast({
        variant: "destructive",
        title: "فشل إرسال البريد",
        description: errorMessage,
      });
    } finally {
      setIsResetLoading(false);
    }
  }
  
  if (loading || user) {
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-4">جارِ التحقق من جلسة الدخول...</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>تسجيل الدخول</CardTitle>
        <CardDescription>
          مرحباً بعودتك! أدخل بياناتك للوصول إلى حسابك.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>البريد الإلكتروني</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="example@mail.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                    <div className="flex items-center justify-between">
                        <FormLabel>كلمة المرور</FormLabel>
                        <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                          <DialogTrigger asChild>
                              <Button variant="link" type="button" className="p-0 h-auto text-xs">هل نسيت كلمة المرور؟</Button>
                          </DialogTrigger>
                          <DialogContent>
                              <DialogHeader>
                                  <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
                                  <DialogDescription>
                                      أدخل بريدك الإلكتروني المسجل لدينا وسنرسل لك رابطاً لإعادة تعيين كلمة مرورك.
                                  </DialogDescription>
                              </DialogHeader>
                              <Form {...forgotPasswordForm}>
                                  <form onSubmit={forgotPasswordForm.handleSubmit(handlePasswordReset)} className="space-y-4">
                                      <FormField
                                          control={forgotPasswordForm.control}
                                          name="email"
                                          render={({ field }) => (
                                              <FormItem>
                                                  <FormLabel>البريد الإلكتروني</FormLabel>
                                                  <FormControl>
                                                      <Input type="email" placeholder="example@mail.com" {...field} />
                                                  </FormControl>
                                                  <FormMessage />
                                              </FormItem>
                                          )}
                                      />
                                      <DialogFooter>
                                          <DialogClose asChild>
                                              <Button type="button" variant="secondary">إلغاء</Button>
                                          </DialogClose>
                                          <Button type="submit" disabled={isResetLoading}>
                                              {isResetLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                              إرسال
                                          </Button>
                                      </DialogFooter>
                                  </form>
                              </Form>
                          </DialogContent>
                      </Dialog>
                    </div>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              تسجيل الدخول
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          ليس لديك حساب؟{" "}
          <Link href="/signup" className="underline">
            إنشاء حساب جديد
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
