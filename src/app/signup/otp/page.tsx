'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const { phoneAuth } = useUser();
  const { t } = useLanguage();
  const { phoneNumber, countryCode, verifyOtp, isVerifyingOtp, sendVerificationCode } = phoneAuth;

  const handleVerify = async () => {
    if (otp.length === 6) {
      await verifyOtp(otp);
    } else {
      alert("6자리 인증 코드를 입력해주세요.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white px-8 py-12">
      <header className="relative flex-shrink-0 flex items-center justify-center">
        <Link href="/signup/phone" className="absolute left-0 p-2">
            <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-center">{t('otp_title')}</h1>
      </header>
      <Progress value={20} className="w-full mt-4 h-1 bg-zinc-800" />


      <main className="flex-1 flex flex-col justify-center">
        <div className="space-y-8">
          <div>
            <label htmlFor="otp" className="text-sm font-medium text-zinc-400">
              {countryCode}{phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}{t('otp_description')}
            </label>
            <Input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="mt-2 bg-zinc-900 border-zinc-800 h-12 text-base text-center tracking-[0.5em]"
              disabled={isVerifyingOtp}
            />
          </div>
           <Button variant="link" onClick={() => sendVerificationCode()} className="text-zinc-400">
              {t('resend_code')}
            </Button>
        </div>
      </main>

      <footer className="flex-shrink-0 pt-8">
        <Button
          onClick={handleVerify}
          disabled={isVerifyingOtp || otp.length !== 6}
          className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-full text-lg"
        >
          {isVerifyingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('verify_and_continue')}
        </Button>
      </footer>
    </div>
  );
}
