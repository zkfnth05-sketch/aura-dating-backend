'use client';

import { useState, useEffect, useRef } from 'react';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useLanguage } from '@/contexts/language-context';

interface VideoChatProps {
  localUser: User;
  remoteUser: User;
  onEndCall: () => void;
}

export default function VideoChat({
  localUser,
  remoteUser,
  onEndCall,
}: VideoChatProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;
        setHasPermissions(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // For simulation, we'll use the same stream for the remote user.
        // In a real app, this would come from a WebRTC connection.
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        if (err.name === 'NotFoundError') {
          console.warn('NotFoundError: No media devices found. This is expected in environments without physical devices.');
          setHasPermissions(false);
          toast({
            variant: "destructive",
            title: t('media_device_not_found_title'),
            description: t('media_device_not_found_desc'),
          });
        } else { // For other errors like NotAllowedError (permission denied)
          console.error('Error accessing media devices.', err);
          setHasPermissions(false);
          toast({
              variant: "destructive",
              title: t('camera_permission_denied_title'),
              description: t('camera_permission_denied_desc')
          });
        }
      }
    };

    getMedia();

    return () => {
      // Clean up the stream when the component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMic = () => {
    if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => {
            track.enabled = !isMicOn;
        });
        setIsMicOn(!isMicOn);
    }
  };

  const toggleCamera = () => {
     if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach(track => {
            track.enabled = !isCameraOn;
        });
        setIsCameraOn(!isCameraOn);
    }
  };

  const handleEndCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    onEndCall();
  };

  return (
    <div className="relative flex flex-col h-screen w-full bg-black text-white">
      {/* Remote User Video (background) */}
      <div className="absolute inset-0 z-0">
        {hasPermissions && isCameraOn ? (
           <video
             ref={remoteVideoRef}
             autoPlay
             playsInline
             className="h-full w-full object-cover"
           />
        ) : (
            <div className="h-full w-full bg-zinc-900 flex flex-col items-center justify-center">
                <Avatar className="w-24 h-24">
                    <AvatarImage src={remoteUser.photoUrls[0]} />
                    <AvatarFallback>{remoteUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="mt-4 text-xl font-semibold">{remoteUser.name}</p>
                {!hasPermissions && (
                    <Alert variant="destructive" className="mt-8 max-w-sm">
                        <AlertTitle>{t('camera_access_required')}</AlertTitle>
                        <AlertDescription>
                            {t('camera_allow_access')}
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Local User Video (picture-in-picture) */}
      <div className="absolute top-4 right-4 h-48 w-36 rounded-lg overflow-hidden border-2 border-primary z-10">
         {hasPermissions && isCameraOn ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover scale-x-[-1]" // Flip horizontally
            />
         ) : (
            <div className="h-full w-full bg-zinc-800 flex items-center justify-center">
                <VideoOff className="w-8 h-8 text-zinc-500"/>
            </div>
         )}
      </div>

      {/* Call Controls */}
      <div className="absolute bottom-10 left-0 right-0 z-10">
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleMic} className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur" disabled={!hasPermissions}>
            {isMicOn ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleCamera} className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur" disabled={!hasPermissions}>
            {isCameraOn ? <Video className="w-7 h-7" /> : <VideoOff className="w-7 h-7" />}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full"
          >
            <PhoneOff className="w-7 h-7" />
          </Button>
        </div>
      </div>
    </div>
  );
}
