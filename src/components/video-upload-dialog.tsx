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
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [mode, setMode] = useState<'record' | 'preview' | 'uploading'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(MAX_DURATION_SECONDS);

  const cleanup = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
    }
    mediaRecorderRef.current = null;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setMode('record');
    setIsRecording(false);
    setVideoBlob(null);
    setPreviewUrl(null);
    setCountdown(MAX_DURATION_SECONDS);
  }, [previewUrl]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('camera_permission_denied_title'),
        description: t('camera_permission_denied_desc'),
      });
      onClose();
      return null;
    }
  }, [onClose, t, toast]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      cleanup();
    }
    return () => cleanup();
  }, [isOpen, startCamera, cleanup]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setIsRecording(false);
  }, []);

  const startRecordingInternal = (stream: MediaStream) => {
    setIsRecording(true);
    setCountdown(MAX_DURATION_SECONDS);

    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = recorder;
    const chunks: Blob[] = [];
    
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setVideoBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setMode('preview');
      setIsRecording(false);
      stream.getTracks().forEach(track => track.stop()); // Stop camera after recording
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

    setTimeout(stopRecording, MAX_DURATION_SECONDS * 1000);
  };
  
  const startRecording = async () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (!stream || !stream.active) {
      const newStream = await startCamera();
      if (!newStream) return;
      // Need a small delay for the new stream to be ready
      setTimeout(() => startRecordingInternal(newStream), 100);
    } else {
      startRecordingInternal(stream);
    }
  };

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
      onClose();
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
    cleanup();
    startCamera();
  }

  const handleClose = () => {
    cleanup();
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle>{t('record_video_title')}</DialogTitle>
          <DialogDescription>{t('record_video_desc')}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="relative w-full aspect-[9/16] rounded-md overflow-hidden bg-black flex items-center justify-center">
            {mode === 'uploading' ? (
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            ) : mode === 'preview' && previewUrl ? (
                <video src={previewUrl} autoPlay loop playsInline className="w-full h-full object-cover" />
            ) : (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            )}
            {isRecording && <p className="absolute top-4 text-white text-lg font-mono bg-black/50 px-3 py-1 rounded-full">{countdown}</p>}
          </div>
        </div>
        <DialogFooter>
          {mode === 'record' && (
            <>
              <Button variant="secondary" onClick={handleClose} disabled={isRecording}>{t('cancel_button')}</Button>
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
