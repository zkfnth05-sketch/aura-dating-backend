'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useUser, useStorage } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useLanguage } from '@/contexts/language-context';

const MAX_DURATION_SECONDS = 15;

export default function VideoUploadDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, updateUser } = useUser();
  const storage = useStorage();
  const { toast } = useToast();
  const { t } = useLanguage();

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [mode, setMode] = useState<'record' | 'preview' | 'uploading'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(MAX_DURATION_SECONDS);

  const cleanupAndClose = useCallback(() => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
    }
    if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
    }
    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
    }
    setMode('record');
    setIsRecording(false);
    setVideoBlob(null);
    setPreviewUrl(null);
    onClose();
  }, [onClose, previewUrl]);
  
  const startCamera = useCallback(async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } },
            audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.src = '';
            videoRef.current.srcObject = stream;
        }
    } catch (err) {
        toast({
            variant: 'destructive',
            title: t('camera_permission_denied_title'),
            description: t('camera_permission_denied_desc'),
        });
        cleanupAndClose();
    }
  }, [t, toast, cleanupAndClose]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    // Cleanup is handled by the Dialog's onOpenChange or unmount
  }, [isOpen, startCamera]);


  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current?.active) {
        toast({ variant: 'destructive', title: "카메라 오류", description: "카메라를 시작할 수 없습니다. 권한을 확인해주세요." });
        return;
    }

    setIsRecording(true);
    setCountdown(MAX_DURATION_SECONDS);

    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    mediaRecorderRef.current = recorder;
    const chunks: Blob[] = [];
    
    recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onstop = () => {
        setIsRecording(false);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        
        if (chunks.length === 0) {
            console.warn("Recording stopped with no data, possibly too short.");
            return;
        }

        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        setVideoBlob(blob);
        setPreviewUrl(url);
        setMode('preview');

        if(videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.src = url;
        }
    };

    recorder.start();

    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopRecording, toast]);
  
  const handleSave = async () => {
    if (!videoBlob || !user || !storage) return;
    setMode('uploading');
    try {
      const videoFileRef = storageRef(storage, `videos/${user.id}/${Date.now()}.webm`);
      await uploadBytes(videoFileRef, videoBlob);
      const downloadURL = await getDownloadURL(videoFileRef);
      await updateUser({ videoUrls: [...(user.videoUrls || []), downloadURL] });
      toast({
        title: '동영상 업로드 성공',
        description: '프로필에 동영상이 추가되었습니다.',
      });
      cleanupAndClose();
    } catch (error) {
      console.error('Failed to upload video:', error);
      toast({
        variant: 'destructive',
        title: '업로드 실패',
        description: '동영상 업로드 중 오류가 발생했습니다.',
      });
      setMode('preview');
    }
  };
  
  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setMode('record');
    setVideoBlob(null);
    setPreviewUrl(null);
    startCamera();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && cleanupAndClose()}>
      <DialogContent className="max-w-md bg-card border-primary/20 flex flex-col p-0 h-full sm:h-auto sm:max-h-[95vh] rounded-none sm:rounded-lg">
        <DialogHeader className="p-6 pb-2 shrink-0 border-b">
          <DialogTitle>{t('record_video_title')}</DialogTitle>
          <DialogDescription>{t('record_video_desc')}</DialogDescription>
        </DialogHeader>
        <div className="px-6 py-4 flex-1 overflow-y-auto min-h-0">
          <div className="relative w-full aspect-[9/16] rounded-md overflow-hidden bg-black flex items-center justify-center">
            <video 
              ref={videoRef} 
              autoPlay 
              muted={mode === 'record'} 
              playsInline 
              loop={mode === 'preview'} 
              className="w-full h-full object-cover" 
              style={{ transform: mode === 'record' ? 'scaleX(-1)' : 'none' }}
            />
            {isRecording && <p className="absolute top-4 text-white text-lg font-mono bg-black/50 px-3 py-1 rounded-full">{countdown}</p>}
            {mode === 'uploading' && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}
          </div>
        </div>
        <DialogFooter className="p-6 pt-4 shrink-0 border-t">
          {mode === 'record' && (
            <>
              <Button variant="secondary" onClick={cleanupAndClose} disabled={isRecording}>{t('cancel_button')}</Button>
              <Button onClick={isRecording ? stopRecording : startRecording}>
                {isRecording ? t('stop_recording') : t('start_recording')}
              </Button>
            </>
          )}
          {mode === 'preview' && (
            <>
              <Button variant="secondary" onClick={handleRetake}>{t('retake_button')}</Button>
              <Button onClick={handleSave}>{t('save_button')}</Button>
            </>
          )}
          {mode === 'uploading' && (
            <Button disabled className="w-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('uploading_button')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
