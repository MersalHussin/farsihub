import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="w-full border-t bg-card">
      <div className="container mx-auto py-8 px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-muted-foreground">
        <div className="flex flex-col items-center md:items-start">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-4 text-foreground">
              <Image src="https://i.suar.me/lpqVn/l" alt="Farsi Hub Logo" width={28} height={28} className="h-7 w-7" />
              <span>فارسي هب</span>
            </Link>
            <div className="text-center md:text-right max-w-xs">
              منصة تعليمية متكاملة لطلاب اللغة الفارسية في جامعة القاهرة، تهدف إلى تسهيل رحلتهم التعليمية.
            </div>
        </div>
        <div className="text-center">
            <h3 className="font-semibold text-foreground mb-4">روابط سريعة</h3>
            <ul className="space-y-2">
                <li><Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link></li>
                <li><Link href="/lectures" className="hover:text-primary transition-colors">المحاضرات</Link></li>
                <li><Link href="/assignments" className="hover:text-primary transition-colors">التكليفات</Link></li>
            </ul>
        </div>
        <div className="text-center md:text-left">
           <h3 className="font-semibold text-foreground mb-4">تواصل معنا</h3>
           <p>لديك أسئلة أو اقتراحات؟</p>
           <p>farsihub@mersal.top</p>
        </div>
      </div>
      <div className="border-t">
        <div className="container mx-auto py-4 px-4 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} فارسي هب. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
