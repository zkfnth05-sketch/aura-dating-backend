
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countryCodes } from '@/lib/country-codes';

export default function PhonePage() {
  const router = useRouter();
  const { phoneAuth } = useUser();
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
        alert("유효한 전화번호를 입력해주세요.");
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
        <h1 className="text-xl font-bold text-center">전화번호로 로그인</h1>
      </header>
      <Progress value={10} className="w-full mt-4 h-1 bg-zinc-800" />
      

      <main className="flex-1 flex flex-col justify-center">
        <div className="space-y-8">
          <div>
            <label htmlFor="country-code" className="text-sm font-medium text-zinc-400">
              국가/지역
            </label>
            <Select value={countryCode} onValueChange={setCountryCode} disabled={isSendingOtp}>
                <SelectTrigger id="country-code" className="mt-2 w-full bg-zinc-900 border-zinc-800 h-12 text-base">
                    <SelectValue placeholder="국가 선택" />
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
              전화번호
            </label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="전화번호"
              className="mt-2 bg-zinc-900 border-zinc-800 h-12 text-base"
              disabled={isSendingOtp}
            />
            <p className="text-xs text-zinc-500 mt-2">
              로그인 또는 회원가입을 위해 전화번호를 입력해주세요.
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
          {isSendingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "인증 코드 받기"}
        </Button>
      </footer>
      
      {/* This div is essential for the invisible reCAPTCHA */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
