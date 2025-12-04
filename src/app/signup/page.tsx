'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

// Kakao icon
const KakaoIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute left-4"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 4C7.029 4 3 7.129 3 11.09C3 13.914 4.715 16.342 7.135 17.653L6.533 20.01C6.444 20.34 6.74 20.62 7.072 20.53L10.147 19.67C10.755 19.78 11.373 19.839 12 19.839C16.971 19.839 21 16.71 21 12.75C21 8.79 16.971 5.661 12 5.661C12 5.661 12 4 12 4Z"
      fill="black"
      fillOpacity="0.9"
    ></path>
  </svg>
);

// Google icon
const GoogleIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute left-4"
  >
    <g clipPath="url(#clip0_303_3)">
      <path
        d="M22.56 12.25C22.56 11.45 22.49 10.68 22.36 9.92H12V14.45H18.02C17.75 16.03 16.91 17.41 15.61 18.29V21.09H19.6C21.66 19.21 22.56 16.23 22.56 12.25Z"
        fill="#4285F4"
      ></path>
      <path
        d="M12 23C15.24 23 17.95 21.92 19.6 20.09L15.6 17.29C14.51 18.01 13.38 18.42 12 18.42C9.13 18.42 6.69 16.63 5.82 14.01H1.73V16.89C3.62 20.48 7.51 23 12 23Z"
        fill="#34A853"
      ></path>
      <path
        d="M5.82 14.01C5.61 13.39 5.5 12.71 5.5 12C5.5 11.29 5.61 10.61 5.82 9.99V7.11H1.73C0.95 8.61 0.5 10.26 0.5 12C0.5 13.74 0.95 15.39 1.73 16.89L5.82 14.01Z"
        fill="#FBBC05"
      ></path>
      <path
        d="M12 5.58C13.68 5.58 15.04 6.26 15.82 7L18.66 4.18C16.95 2.66 14.71 1.7 12 1.7C7.51 1.7 3.62 4.52 1.73 8.11L5.82 10.99C6.69 8.37 9.13 6.58 12 6.58V5.58Z"
        fill="#EA4335"
      ></path>
    </g>
    <defs>
      <clipPath id="clip0_303_3">
        <rect width="24" height="24" fill="white"></rect>
      </clipPath>
    </defs>
  </svg>
);

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



export default function SignupPage() {
  const router = useRouter();

  const handleLogin = () => {
    // In a real app, you'd handle the specific login provider.
    // For this prototype, we'll just mark the user as signed up and redirect.
    localStorage.setItem('isSignedUp', 'true');
    router.push('/');
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-black text-white p-8">
      <div className="flex-grow flex flex-col items-center justify-center text-center w-full max-w-sm">
        <span className="font-headline text-6xl font-bold text-primary drop-shadow-sm scale-y-[.85]">
          Aura
        </span>
        <p className="mt-8 mb-16 text-lg text-neutral-300">
          운명적인 인연을 발견하세요
        </p>

        <div className="space-y-3 w-full">
          <Button
            onClick={handleLogin}
            className="w-full h-12 bg-[#FEE500] text-black hover:bg-[#FEE500]/90 font-semibold text-base relative"
          >
            <KakaoIcon />
            카카오로 계속하기
          </Button>
          <Button
            onClick={handleLogin}
            variant="secondary"
            className="w-full h-12 bg-white text-black hover:bg-white/90 font-semibold text-base relative"
          >
            <GoogleIcon />
            Google로 계속하기
          </Button>
          <Button
            onClick={handleLogin}
            variant="secondary"
            className="w-full h-12 bg-neutral-800 text-white hover:bg-neutral-700 font-semibold text-base relative"
          >
            <PhoneIcon />
            전화번호로 계속하기
          </Button>
        </div>
      </div>

      <div className="text-center text-xs text-neutral-500 max-w-sm">
        계속 진행하면 Aura의{' '}
        <a href="#" className="underline">
          이용약관
        </a>{' '}
        및{' '}
        <a href="#" className="underline">
          개인정보처리방침
        </a>
        에 동의하는 것으로 간주됩니다.
      </div>
    </div>
  );
}
