
"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { cn } from '@/lib/utils';

const boyAvatarUrl = 'https://i.suar.me/81XmV/l';
const girlAvatarUrl = 'https://i.suar.me/j5Q7x/l';

export default function AdminProfilePage() {
    const { user, deleteAccount, updateProfilePicture } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
    const [isSavingAvatar, setIsSavingAvatar] = useState(false);
    const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);

    if (!user || user.role !== 'admin') {
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

    const handleSaveAvatar = async () => {
        if (!selectedAvatar) {
            toast({ variant: 'destructive', title: 'الرجاء اختيار صورة' });
            return;
        }
        setIsSavingAvatar(true);
        try {
            await updateProfilePicture(selectedAvatar);
            toast({ title: 'تم تحديث الصورة بنجاح' });
            setSelectedAvatar(null);
            setIsAvatarDialogOpen(false); // Close dialog on success
        } catch (error) {
            toast({ variant: 'destructive', title: 'فشل تحديث الصورة' });
            console.error(error);
        } finally {
            setIsSavingAvatar(false);
        }
    };


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">الملف الشخصي</h1>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                       <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                            <DialogTrigger asChild>
                                <button className="relative group">
                                    <Avatar className="h-24 w-24 text-3xl">
                                        <AvatarImage src={user.photoURL || undefined} alt={user.name} />
                                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white text-xs font-bold">تغيير</span>
                                    </div>
                                </button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                <DialogTitle>تغيير الصورة الشخصية</DialogTitle>
                                <DialogDescription>اختر صورة رمزية جديدة لحسابك.</DialogDescription>
                                </DialogHeader>
                                <RadioGroup
                                    value={selectedAvatar ?? undefined}
                                    onValueChange={setSelectedAvatar}
                                    className="flex flex-col sm:flex-row gap-4 py-4"
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
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">إلغاء</Button>
                                    </DialogClose>
                                    <Button onClick={handleSaveAvatar} disabled={isSavingAvatar || !selectedAvatar}>
                                        {isSavingAvatar && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                        حفظ الصورة
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <div className='text-center sm:text-right'>
                            <CardTitle className="text-2xl">{user.name}</CardTitle>
                            <CardDescription>{user.email}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <h3 className="font-semibold mb-2">تفاصيل الحساب</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                        <div><span className="font-medium text-foreground min-w-[80px] inline-block">الدور:</span> <Badge variant="secondary" className="bg-primary/10 text-primary">مسؤول</Badge></div>
                        <div>
                            <span className="font-medium text-foreground min-w-[80px] inline-block">الحالة:</span>
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">نشط</Badge>
                        </div>
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
                    <div className='text-sm'>إذا قمت بحذف حسابك، ستفقد الوصول إلى جميع الصلاحيات الإدارية بشكل نهائي.</div>
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
