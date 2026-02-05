'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { useLanguage } from '@/contexts/language-context';

type CameraDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onPhotoTaken: (dataUri: string) => void;
};

export default function CameraDialog({ isOpen, onClose, onPhotoTaken }: CameraDialogProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
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
            title: t('camera_access_denied_title'),
            description: t('camera_access_denied_desc'),
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
        onClose(); // Close the dialog after photo is taken
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle>{t('take_photo')}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="relative w-full aspect-[3/4] rounded-md overflow-hidden bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          {!hasCameraPermission && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>{t('camera_access_required')}</AlertTitle>
              <AlertDescription>
                {t('camera_allow_access')}
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>{t('cancel_button')}</Button>
          <Button onClick={handleCapture} disabled={!hasCameraPermission}>
            {t('take_photo')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
