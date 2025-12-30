'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/user-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type ReauthDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onReauthSuccess: () => void;
};

export default function ReauthDialog({ isOpen, onClose, onReauthSuccess }: ReauthDialogProps) {
  const { user, phoneAuth } = useUser();
  const { toast } = useToast();
  const { 
    setupRecaptcha, 
    sendVerificationCode, 
    reauthenticate,
    isSendingOtp, 
    isVerifyingOtp 
  } = phoneAuth;
  
  const [otp, setOtp] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [recaptchaContainer, setRecaptchaContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (recaptchaContainer) {
      setupRecaptcha(recaptchaContainer);
    }
  }, [recaptchaContainer, setupRecaptcha]);

  useEffect(() => {
    // Reset state when dialog opens
    if (isOpen) {
      setOtp('');
      setIsCodeSent(false);
    }
  }, [isOpen]);

  const handleSendCode = async () => {
    if (!user?.phoneNumber) {
      toast({
        variant: "destructive",
        title: "전화번호 없음",
        description: "등록된 전화번호가 없어 인증을 진행할 수 없습니다.",
      });
      return;
    }
    try {
        await sendVerificationCode(user.phoneNumber);
        setIsCodeSent(true);
        toast({
            title: "인증 코드 발송",
            description: "인증 코드가 휴대전화로 발송되었습니다.",
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "발송 실패",
            description: error.message || "인증 코드 발송에 실패했습니다.",
        });
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
        toast({
            variant: "destructive",
            description: "6자리 인증 코드를 입력해주세요.",
        });
        return;
    }
    try {
        await reauthenticate(otp);
        toast({
            title: "인증 성공",
            description: "본인 인증이 완료되었습니다. 계정 삭제를 진행합니다.",
        });
        onReauthSuccess();
        onClose();
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "인증 실패",
            description: error.message || "인증에 실패했습니다.",
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>보안 재인증</DialogTitle>
          <DialogDescription>
            계정을 삭제하려면 보안을 위해 본인 인증을 다시 진행해야 합니다. 등록된 전화번호로 인증 코드를 받아 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Input value={user?.phoneNumber || ''} readOnly disabled className="bg-zinc-800" />
            <Button onClick={handleSendCode} disabled={isSendingOtp || isCodeSent}>
              {isSendingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "코드 받기"}
            </Button>
          </div>
          {isCodeSent && (
            <div className="space-y-2">
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6자리 인증 코드"
                maxLength={6}
                className="text-center tracking-widest"
                disabled={isVerifyingOtp}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button onClick={handleVerify} disabled={!isCodeSent || otp.length !== 6 || isVerifyingOtp}>
            {isVerifyingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "인증 및 계정 삭제"}
          </Button>
        </DialogFooter>
        <div id="recaptcha-container-reauth" ref={setRecaptchaContainer}></div>
      </DialogContent>
    </Dialog>
  );
}
