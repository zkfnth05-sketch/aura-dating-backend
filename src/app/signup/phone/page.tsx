'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

export default function PhonePage() {
  const router = useRouter();
  const { phoneAuth } = useUser();
  const {
    phoneNumber,
    setPhoneNumber,
    setupRecaptcha,
    sendVerificationCode,
    isSendingOtp,
  } = phoneAuth;

  const [recaptchaContainer, setRecaptchaContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (recaptchaContainer) {
      setupRecaptcha(recaptchaContainer);
    }
  }, [recaptchaContainer, setupRecaptcha]);

  const handleSendCode = async () => {
    // Basic validation for Korean phone number format
    if (!/^010[0-9]{8}$/.test(phoneNumber)) {
        alert("유효한 전화번호를 입력해주세요. (예: 01012345678)");
        return;
    }
    await sendVerificationCode();
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white px-8 py-12">
      <header className="flex-shrink-0">
        <h1 className="text-2xl font-bold text-center">전화번호로 로그인</h1>
        <Progress value={10} className="w-full mt-4 h-1 bg-zinc-800" />
      </header>

      <main className="flex-grow flex flex-col justify-center mt-8">
        <div className="space-y-8">
          <div>
            <label htmlFor="phone" className="text-sm font-medium text-zinc-400">
              전화번호
            </label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="전화번호를 입력하세요 (예: 01012345678)"
              className="mt-2 bg-zinc-900 border-zinc-800 h-12 text-base"
              disabled={isSendingOtp}
            />
            <p className="text-xs text-zinc-500 mt-2">
              로그인 또는 회원가입을 위해 전화번호를 입력해주세요.
            </p>
          </div>
        </div>
      </main>

      <footer className="flex-shrink-0 mt-8">
        <Button
          onClick={handleSendCode}
          disabled={isSendingOtp || !phoneNumber}
          className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-full text-lg"
        >
          {isSendingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "인증 코드 받기"}
        </Button>
      </footer>
      
      {/* Container for reCAPTCHA */}
      <div id="recaptcha-container" ref={setRecaptchaContainer}></div>
    </div>
  );
}
