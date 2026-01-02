'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const { phoneAuth } = useUser();
  const { phoneNumber, verifyOtp, isVerifyingOtp, sendVerificationCode } = phoneAuth;

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
        <h1 className="text-xl font-bold text-center">인증 코드 입력</h1>
      </header>
      <Progress value={20} className="w-full mt-4 h-1 bg-zinc-800" />


      <main className="flex-grow flex flex-col justify-center mt-8">
        <div className="space-y-8">
          <div>
            <label htmlFor="otp" className="text-sm font-medium text-zinc-400">
              {phoneNumber} (으)로 전송된 6자리 코드를 입력하세요.
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
              코드 재전송
            </Button>
        </div>
      </main>

      <footer className="flex-shrink-0 mt-8">
        <Button
          onClick={handleVerify}
          disabled={isVerifyingOtp || otp.length !== 6}
          className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-full text-lg"
        >
          {isVerifyingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "인증하고 계속하기"}
        </Button>
      </footer>
    </div>
  );
}
