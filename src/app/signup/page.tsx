
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import React from 'react';

// Phone icon
const PhoneIcon = () => (
    <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="absolute left-4"
    >
        <path d="M3.56778 8.16334C4.85732 10.6276 6.9602 12.7305 9.42452 14.0199L11.5933 11.8512C11.7997 11.6448 12.1026 11.5833 12.367 11.6911C13.2676 12.0463 14.2384 12.25 15.25 12.25C15.6642 12.25 16 12.5858 16 13V16.5C16 16.9142 15.6642 17.25 15.25 17.25C8.48122 17.25 3 11.7688 3 5C3 4.58579 3.33579 4.25 3.75 4.25H7.25C7.66421 4.25 8 4.58579 8 5C8 6.01156 8.20374 6.98236 8.55887 7.88296C8.66668 8.14736 8.60523 8.45025 8.39884 8.65664L6.23011 10.8254C6.23011 10.8254 3.56778 8.16334 3.56778 8.16334Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const FlagIcon = ({ code, ...props }: { code: string } & React.SVGProps<SVGSVGElement>) => {
  switch (code) {
    case 'ko':
      return <svg viewBox="0 0 900 600" {...props}>
        <rect width="900" height="600" fill="#fff"/>
        <g transform="translate(450,300)">
        <circle r="150" fill="#cd2e3a"/>
        <path d="M0-150a150 150 0 0 0 0 300 75 75 0 0 1 0-150 75 75 0 0 1 0 150" fill="#0047a0"/>
        </g>
        <g fill="#000" transform="translate(193.2,143.2) rotate(33.69)">
        <path d="M-75-25h150v16.7h-150z"/>
        <path d="M-75-8.3h150v16.7h-150z"/>
        <path d="M-75 8.3h150v16.7h-150z"/>
        </g>
        <g fill="#000" transform="translate(706.8,456.8) rotate(33.69)">
        <path d="M-75-25h50v16.7h-50zM25-25h50v16.7h-50z"/>
        <path d="M-75-8.3h50v16.7h-50zM25-8.3h50v16.7h-50z"/>
        <path d="M-75 8.3h50v16.7h-50zM25 8.3h50v16.7h-50z"/>
        </g>
        <g fill="#000" transform="translate(706.8,143.2) rotate(-33.69)">
        <path d="M-75-25h50v16.7h-50zM25-25h50v16.7h-50z"/>
        <path d="M-75-8.3h150v16.7h-150z"/>
        <path d="M-75 8.3h50v16.7h-50zM25 8.3h50v16.7h-50z"/>
        </g>
        <g fill="#000" transform="translate(193.2,456.8) rotate(-33.69)">
        <path d="M-75-25h150v16.7h-150z"/>
        <path d="M-75-8.3h50v16.7h-50zM25-8.3h50v16.7h-50z"/>
        <path d="M-75 8.3h150v16.7h-150z"/>
        </g>
      </svg>;
    case 'en':
      return <svg viewBox="0 0 38 20" {...props}><path fill="#B22234" d="m0,0H38V20H0"/><path stroke="#fff" strokeWidth="2" d="m0,2H38m0,4H0m0,4H38m0,4H0"/><path fill="#3C3B6E" d="m0,0H18V10H0"/></svg>;
    case 'es':
      return <svg viewBox="0 0 30 20" {...props}><path fill="#C60B1E" d="M0 0h30v20H0z"/><path fill="#FFC400" d="M0 5h30v10H0z"/></svg>;
    case 'ja':
      return <svg viewBox="0 0 30 20" {...props}><path fill="#fff" d="M0 0h30v20H0z"/><circle cx="15" cy="10" r="6" fill="#BC002D"/></svg>;
    default:
      return null;
  }
};


export default function SignupPage() {
  const router = useRouter();
  const { t, setLanguage, supportedLanguages, language } = useLanguage();

  return (
    <div className="flex flex-col items-center min-h-screen bg-black text-white p-8">
       <div className="w-full text-center pt-20">
        <p className="mb-4 text-sm text-neutral-400">
            Hello, welcome to Aura Ai Dating. Please select your preferred language below.
        </p>
        <div className="flex flex-nowrap items-center justify-center gap-2 overflow-x-auto">
            {supportedLanguages.map(lang => (
                <Button key={lang.code} variant="ghost" size="sm" onClick={() => setLanguage(lang.code as any)} className={cn("gap-2", language === lang.code && "bg-primary text-primary-foreground hover:bg-primary/90")}>
                    <FlagIcon code={lang.code} className="w-5 h-auto rounded-sm" />
                    <span>{lang.name}</span>
                </Button>
            ))}
        </div>
      </div>
      <div className="flex-grow flex flex-col items-center justify-center text-center w-full max-w-sm">
        <span className="font-headline text-6xl font-bold text-primary drop-shadow-sm scale-y-[.85]">
          {t('app_title')}
        </span>
        <p className="mt-8 mb-16 text-lg text-neutral-300">
          {t('app_tagline')}
        </p>

        <div className="space-y-3 w-full">
          <Button
            onClick={() => router.push('/signup/phone')}
            variant="secondary"
            className="w-full h-12 bg-neutral-800 text-white hover:bg-neutral-700 font-semibold text-base relative"
          >
            <PhoneIcon />
            {t('continue_with_phone')}
          </Button>
        </div>
      </div>

      <div className="text-center text-xs text-neutral-500 max-w-sm">
        {t('terms_agree_prefix')}
        <Dialog>
          <DialogTrigger asChild>
            <button className="underline">{t('terms_of_service')}</button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card text-foreground">
            <DialogHeader>
              <DialogTitle>{t('terms_of_service')}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-96 w-full rounded-md border p-4">
              <div className="prose prose-sm dark:prose-invert">
                <h3 className="font-bold">{t('terms_article_1_title')}</h3>
                <p>{t('terms_article_1_content')}</p>
                
                <h3 className="font-bold mt-4">{t('terms_article_2_title')}</h3>
                <p>{t('terms_article_2_content_1')}</p>
                <ol className="list-decimal pl-5">
                  <li>{t('terms_article_2_content_2')}</li>
                  <li>{t('terms_article_2_content_3')}</li>
                </ol>

                <h3 className="font-bold mt-4">{t('terms_article_3_title')}</h3>
                <p>{t('terms_article_3_content')}</p>
                
                <h3 className="font-bold mt-4">{t('terms_article_4_title')}</h3>
                <p>{t('terms_article_4_content_1')}</p>
                <ul className="list-disc pl-5">
                    <li>{t('terms_article_4_service_1')}</li>
                    <li>{t('terms_article_4_service_2')}</li>
                    <li>{t('terms_article_4_service_3')}</li>
                </ul>
                <p className="mt-4">...</p>
                <p className="font-bold">{t('terms_effective_date')}</p>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
        {t('and')}
        <Dialog>
          <DialogTrigger asChild>
            <button className="underline">{t('privacy_policy')}</button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card text-foreground">
            <DialogHeader>
              <DialogTitle>{t('privacy_policy')}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-96 w-full rounded-md border p-4">
              <div className="prose prose-sm dark:prose-invert">
                <p>{t('privacy_intro')}</p>
                
                <h3 className="font-bold mt-4">{t('privacy_article_1_title')}</h3>
                <p>{t('privacy_article_1_content_1')}</p>
                <ol className="list-decimal pl-5">
                  <li>{t('privacy_article_1_item_1')}</li>
                  <li>{t('privacy_article_1_item_2')}</li>
                </ol>

                <h3 className="font-bold mt-4">{t('privacy_article_2_title')}</h3>
                <p>{t('privacy_article_2_content_1')}</p>
                <ul className="list-disc pl-5">
                  <li>{t('privacy_article_2_item_1')}</li>
                  <li>{t('privacy_article_2_item_2')}</li>
                </ul>

                <p className="mt-4">...</p>
                <p className="font-bold">{t('privacy_effective_date')}</p>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
        {t('terms_agree_suffix')}
      </div>
    </div>
  );
}
