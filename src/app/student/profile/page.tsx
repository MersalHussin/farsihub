"use client";

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function StudentProfilePage() {
    const { user, deleteAccount } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    if (!user) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';
    }

    const handleDeleteAccount = async () => {
        try {
            await deleteAccount();
            toast({
                title: "تم حذف الحساب",
                description: "تم حذف حسابك بنجاح. سنفتقدك!",
            });
            router.push('/');
        } catch (error) {
            console.error("Failed to delete account:", error);
            toast({
                variant: "destructive",
                title: "فشل حذف الحساب",
                description: "حدث خطأ أثناء محاولة حذف حسابك. يرجى المحاولة مرة أخرى.",
            });
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">الملف الشخصي</h1>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <Avatar className="h-24 w-24 text-3xl">
                            <AvatarImage src={user.photoURL || undefined} alt={user.name} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className='text-center sm:text-right'>
                            <CardTitle className="text-2xl">{user.name}</CardTitle>
                            <CardDescription>{user.email}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <h3 className="font-semibold mb-2">تفاصيل الحساب</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                        <p><span className="font-medium text-foreground min-w-[80px] inline-block">الدور:</span> <Badge variant="secondary">طالب</Badge></p>
                        <p><span className="font-medium text-foreground min-w-[80px] inline-block">الحالة:</span> 
                            {user.approved ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">مُفعّل</Badge>
                            ) : (
                                <Badge variant="destructive">قيد المراجعة</Badge>
                            )}
                        </p>
                    </div>
                </CardContent>
            </Card>

             <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <ShieldAlert className="h-5 w-5" />
                        منطقة الخطر
                    </CardTitle>
                    <CardDescription>
                        الإجراءات التالية لا يمكن التراجع عنها. يرجى التأكد قبل المتابعة.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className='text-sm'>إذا قمت بحذف حسابك، ستفقد الوصول إلى جميع المحاضرات ونتائج الاختبارات بشكل نهائي.</p>
                </CardContent>
                <CardFooter className="flex justify-start">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">حذف الحساب</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد تماماً؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                    هذا الإجراء لا يمكن التراجع عنه. سيتم حذف حسابك وجميع بياناتك المرتبطة به بشكل نهائي.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                                    نعم، أحذف حسابي
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
        </div>
    );
}
