'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/user-context';
import { useLanguage } from '@/contexts/language-context';
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
  const { t } = useLanguage();
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
        title: t('reauth_no_phone_title'),
        description: t('reauth_no_phone_desc'),
      });
      return;
    }
    try {
        await sendVerificationCode(user.phoneNumber);
        setIsCodeSent(true);
        toast({
            title: t('reauth_code_sent_title'),
            description: t('reauth_code_sent_desc'),
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: t('reauth_code_failed_title'),
            description: error.message || t('reauth_code_failed_desc'),
        });
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
        toast({
            variant: "destructive",
            description: t('auth_otp_invalid'),
        });
        return;
    }
    try {
        await reauthenticate(otp);
        toast({
            title: t('reauth_verify_success_title'),
            description: t('reauth_verify_success_desc'),
        });
        onReauthSuccess();
        onClose();
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: t('reauth_verify_failed_title'),
            description: error.message || t('reauth_verify_failed_desc'),
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('reauth_title')}</DialogTitle>
          <DialogDescription>
            {t('reauth_desc')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Input value={user?.phoneNumber || ''} readOnly disabled className="bg-zinc-800" />
            <Button onClick={handleSendCode} disabled={isSendingOtp || isCodeSent}>
              {isSendingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('reauth_get_code_button')}
            </Button>
          </div>
          {isCodeSent && (
            <div className="space-y-2">
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder={t('reauth_otp_placeholder')}
                maxLength={6}
                className="text-center tracking-widest"
                disabled={isVerifyingOtp}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>{t('cancel_button')}</Button>
          <Button onClick={handleVerify} disabled={!isCodeSent || otp.length !== 6 || isVerifyingOtp}>
            {isVerifyingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('reauth_submit_button')}
          </Button>
        </DialogFooter>
        <div id="recaptcha-container-reauth" ref={setRecaptchaContainer}></div>
      </DialogContent>
    </Dialog>
  );
}
