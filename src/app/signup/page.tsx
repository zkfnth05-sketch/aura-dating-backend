'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

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
    viewBox="0.0 -3.0 24 24"
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
  const auth = useAuth();
  const { toast } = useToast();

  const handleAnonymousLogin = async () => {
    try {
      await signInAnonymously(auth);
      router.push('/signup/profile');
    } catch (error) {
      console.error("Anonymous sign-in failed", error);
      toast({
        variant: "destructive",
        title: "로그인 실패",
        description: "로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      });
    }
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
            onClick={handleAnonymousLogin}
            className="w-full h-12 bg-[#FEE500] text-black hover:bg-[#FEE500]/90 font-semibold text-base relative"
          >
            <KakaoIcon />
            카카오로 계속하기
          </Button>
          <Button
            onClick={handleAnonymousLogin}
            variant="secondary"
            className="w-full h-12 bg-white text-black hover:bg-white/90 font-semibold text-base relative"
          >
            <GoogleIcon />
            Google로 계속하기
          </Button>
          <Button
            onClick={handleAnonymousLogin}
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
        <Dialog>
          <DialogTrigger asChild>
            <button className="underline">이용약관</button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card text-foreground">
            <DialogHeader>
              <DialogTitle>이용약관</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-96 w-full rounded-md border p-4">
              <div className="prose prose-sm dark:prose-invert">
                <h3 className="font-bold">제1조 (목적)</h3>
                <p>이 약관은 더윤컴퍼니(이하 "회사")가 제공하는 Aura 서비스 및 관련 제반 서비스의 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
                
                <h3 className="font-bold mt-4">제2조 (정의)</h3>
                <p>이 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
                <ol className="list-decimal pl-5">
                  <li>"서비스"라 함은 구현되는 단말기(PC, TV, 휴대형단말기 등의 각종 유무선 장치를 포함)와 상관없이 "회원"이 이용할 수 있는 Aura 및 관련 제반 서비스를 의미합니다.</li>
                  <li>"회원"이라 함은 회사의 "서비스"에 접속하여 이 약관에 따라 "회사"와 이용계약을 체결하고 "회사"가 제공하는 "서비스"를 이용하는 고객을 말합니다.</li>
                </ol>

                <h3 className="font-bold mt-4">제3조 (약관의 명시와 개정)</h3>
                <p>"회사"는 이 약관의 내용을 "회원"이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다. "회사"는 "약관의규제에관한법률", "정보통신망이용촉진및정보보호등에관한법률(이하 "정보통신망법")" 등 관련법을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</p>
                
                <h3 className="font-bold mt-4">제4조 (서비스의 제공)</h3>
                <p>회사는 다음과 같은 서비스를 제공합니다.</p>
                <ul className="list-disc pl-5">
                    <li>소셜 네트워킹 서비스</li>
                    <li>위치 기반 추천 서비스</li>
                    <li>기타 회사가 추가 개발하거나 다른 회사와의 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스</li>
                </ul>
                <p className="mt-4">...</p>
                <p className="font-bold">본 약관은 2024년 7월 25일부터 적용됩니다.</p>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
        {' '}및{' '}
        <Dialog>
          <DialogTrigger asChild>
            <button className="underline">개인정보처리방침</button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card text-foreground">
            <DialogHeader>
              <DialogTitle>개인정보처리방침</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-96 w-full rounded-md border p-4">
              <div className="prose prose-sm dark:prose-invert">
                <p>더윤컴퍼니(이하 '회사'는) 고객님의 개인정보를 중요시하며, "정보통신망 이용촉진 및 정보보호"에 관한 법률을 준수하고 있습니다.</p>
                
                <h3 className="font-bold mt-4">제1조 (개인정보의 처리 목적)</h3>
                <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
                <ol className="list-decimal pl-5">
                  <li>홈페이지 회원 가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 제한적 본인확인제 시행에 따른 본인확인, 서비스 부정이용 방지, 만 14세 미만 아동의 개인정보 처리시 법정대리인의 동의여부 확인, 각종 고지·통지, 고충처리 등을 목적으로 개인정보를 처리합니다.</li>
                  <li>신규 서비스 개발 및 마케팅·광고에의 활용: 신규 서비스 개발 및 맞춤 서비스 제공, 통계학적 특성에 따른 서비스 제공 및 광고 게재, 서비스의 유효성 확인, 접속빈도 파악 또는 회원의 서비스 이용에 대한 통계 등을 목적으로 개인정보를 처리합니다.</li>
                </ol>

                <h3 className="font-bold mt-4">제2조 (처리하는 개인정보의 항목)</h3>
                <p>회사는 회원가입, 원활한 고객상담, 각종 서비스의 제공을 위해 아래와 같은 개인정보를 수집하고 있습니다.</p>
                <ul className="list-disc pl-5">
                  <li>필수항목 : 이름, 생년월일, 성별, 로그인ID, 비밀번호, 휴대전화번호, 이메일</li>
                  <li>선택항목 : 프로필 사진, 위치정보, 취미, 관심사 등</li>
                </ul>

                <p className="mt-4">...</p>
                <p className="font-bold">본 방침은 2024년 7월 25일부터 시행됩니다.</p>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
        에 동의하는 것으로 간주됩니다.
      </div>
    </div>
  );
}
