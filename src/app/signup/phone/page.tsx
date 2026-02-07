
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countryCodes } from '@/lib/country-codes';
import { useToast } from '@/hooks/use-toast';

export default function PhonePage() {
  const router = useRouter();
  const { phoneAuth } = useUser();
  const { t } = useLanguage();
  const { toast } = useToast();
  const {
    phoneNumber,
    setPhoneNumber,
    countryCode,
    setCountryCode,
    setupRecaptcha,
    sendVerificationCode,
    isSendingOtp,
  } = phoneAuth;

  const [recaptchaContainer, setRecaptchaContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // This container is where the invisible reCAPTCHA will be rendered.
    const container = document.getElementById('recaptcha-container');
    if (container) {
      setRecaptchaContainer(container);
    }
  }, []);

  useEffect(() => {
    if (recaptchaContainer) {
      setupRecaptcha(recaptchaContainer);
    }
  }, [recaptchaContainer, setupRecaptcha]);

  const handleSendCode = async () => {
    if (!/^\d{8,15}$/.test(phoneNumber.replace(/^0+/, ''))) {
        toast({ variant: 'destructive', description: t('auth_phone_invalid') });
        return;
    }
    await sendVerificationCode();
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white px-8 py-12">
      <header className="relative flex-shrink-0 flex items-center justify-center">
        <Link href="/signup" className="absolute left-0 p-2">
            <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-center">{t('phone_login_title')}</h1>
      </header>
      <Progress value={10} className="w-full mt-4 h-1 bg-zinc-800" />
      

      <main className="flex-1 flex flex-col justify-center">
        <div className="space-y-8">
          <div>
            <label htmlFor="country-code" className="text-sm font-medium text-zinc-400">
              {t('country_region')}
            </label>
            <Select value={countryCode} onValueChange={setCountryCode} disabled={isSendingOtp}>
                <SelectTrigger id="country-code" className="mt-2 w-full bg-zinc-900 border-zinc-800 h-12 text-base">
                    <SelectValue placeholder={t('select_country_placeholder')} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 text-white border-zinc-800 max-h-60">
                    {countryCodes.map(c => (
                        <SelectItem key={c.label} value={c.value}>{c.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-medium text-zinc-400">
              {t('phone_number')}
            </label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              placeholder={t('phone_number_placeholder')}
              className="mt-2 bg-zinc-900 border-zinc-800 h-12 text-base"
              disabled={isSendingOtp}
            />
            <p className="text-xs text-zinc-500 mt-2">
              {t('phone_number_description')}
            </p>
          </div>
        </div>
      </main>

      <footer className="flex-shrink-0 pt-8">
        <Button
          onClick={handleSendCode}
          disabled={isSendingOtp || !phoneNumber}
          className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-full text-lg"
        >
          {isSendingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('get_verify_code')}
        </Button>
      </footer>
      
      {/* This div is essential for the invisible reCAPTCHA */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
