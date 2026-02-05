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
  const { t, setLanguage, supportedLanguages, language } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-black text-white p-8">
      <div className="flex-grow flex flex-col items-center justify-center text-center w-full max-w-sm">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {supportedLanguages.map(lang => (
                <Button key={lang.code} variant="ghost" size="sm" onClick={() => setLanguage(lang.code as any)} className={cn("gap-2", language === lang.code && "bg-primary text-primary-foreground hover:bg-primary/90")}>
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                </Button>
            ))}
        </div>
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
        {t('terms_agree_suffix')}
      </div>
    </div>
  );
}