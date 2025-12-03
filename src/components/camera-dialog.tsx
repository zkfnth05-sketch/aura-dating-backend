'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

type CameraDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onPhotoTaken: (dataUri: string) => void;
};

export default function CameraDialog({ isOpen, onClose, onPhotoTaken }: CameraDialogProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    async function setupCamera() {
      if (isOpen) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasCameraPermission(true);
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: '카메라 접근 거부됨',
            description: '브라우저 설정에서 카메라 권한을 허용해주세요.',
          });
        }
      } else {
        // Cleanup when dialog is closed
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      }
    }

    setupCamera();

    return () => {
      // Ensure cleanup on unmount as well
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUri = canvas.toDataURL('image/png');
        onPhotoTaken(dataUri);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle>사진 촬영</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          {!hasCameraPermission && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>카메라 접근 필요</AlertTitle>
              <AlertDescription>
                이 기능을 사용하려면 카메라 접근을 허용해주세요.
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button onClick={handleCapture} disabled={!hasCameraPermission}>
            촬영하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
