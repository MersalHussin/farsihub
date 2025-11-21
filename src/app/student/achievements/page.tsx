"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export default function StudentAchievementsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-amber-500" />
                <div>
                    <h1 className="text-3xl font-bold">الإنجازات</h1>
                    <p className="text-muted-foreground">
                        سجل بإنجازاتك التعليمية. كل خطوة هي تقدم!
                    </p>
                </div>
            </div>
             <div className="text-center text-muted-foreground py-24 border rounded-lg bg-card">
                <p className="text-lg">سيتم تفعيل هذه الميزة قريبًا.</p>
                <p>ستظهر هنا جميع الاختبارات التي أكملتها والشهادات التي حصلت عليها.</p>
            </div>
        </div>
    );
}
