'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useUser, useStorage } from '@/firebase';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { X, Check, RefreshCw, Loader2 } from 'lucide-react';
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

  const stopStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    stopStream();
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
    }
    mediaRecorderRef.current = null;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setMode('record');
    setIsRecording(false);
    setVideoBlob(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setCountdown(MAX_DURATION_SECONDS);
  }, [stopStream, previewUrl]);

  const startCamera = useCallback(async () => {
    cleanup();
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
  }, [cleanup, onClose, t, toast]);

  useEffect(() => {
    if (isOpen && mode === 'record') {
      startCamera();
    } else {
      cleanup();
    }
    return () => cleanup();
  }, [isOpen, startCamera, cleanup, mode]);
  
  const startRecording = async () => {
    const stream = await startCamera();
    if (!stream) return;

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
      stopStream();
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

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
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

  const renderContent = () => {
    if (mode === 'uploading') {
      return <Loader2 className="w-16 h-16 animate-spin text-primary" />;
    }

    if (mode === 'preview' && previewUrl) {
      return (
        <>
          <video src={previewUrl} autoPlay loop playsInline className="w-full h-full object-cover" />
          <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-6 z-20">
            <Button variant="outline" size="icon" className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white" onClick={() => setMode('record')}>
                <RefreshCw />
            </Button>
            <Button size="icon" className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90" onClick={handleSave}>
                <Check className="w-10 h-10" />
            </Button>
          </div>
        </>
      );
    }
    
    return (
      <>
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
        <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center z-20">
          <Button 
            variant="outline" 
            size="icon" 
            className="w-20 h-20 rounded-full bg-transparent border-white border-4"
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? <div className="w-8 h-8 bg-red-500 rounded-md" /> : <div className="w-16 h-16 bg-red-500 rounded-full" />}
          </Button>
        </div>
        {isRecording && <p className="absolute top-16 text-white text-lg font-mono bg-black/50 px-2 rounded-md">{countdown}</p>}
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full max-w-full sm:rounded-none bg-black p-0 flex flex-col items-center justify-center border-none">
        <div className="absolute top-4 left-4 z-20">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white bg-black/30 hover:bg-black/50">
                <X />
            </Button>
        </div>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
