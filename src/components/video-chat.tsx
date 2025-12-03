'use client';

import { useState, useEffect, useRef } from 'react';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

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
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const getMedia = async () => {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(userStream);
        setHasPermissions(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = userStream;
        }
        // For simulation, we'll use the same stream for the remote user.
        // In a real app, this would come from a WebRTC connection.
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = userStream;
        }
      } catch (err) {
        console.error('Error accessing media devices.', err);
        setHasPermissions(false);
        toast({
            variant: "destructive",
            title: "카메라/마이크 권한 필요",
            description: "화상 통화를 사용하려면 설정에서 권한을 허용해주세요."
        });
      }
    };

    getMedia();

    return () => {
      // Clean up the stream when the component unmounts
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMic = () => {
    if (stream) {
        stream.getAudioTracks().forEach(track => {
            track.enabled = !isMicOn;
        });
        setIsMicOn(!isMicOn);
    }
  };

  const toggleCamera = () => {
     if (stream) {
        stream.getVideoTracks().forEach(track => {
            track.enabled = !isCameraOn;
        });
        setIsCameraOn(!isCameraOn);
    }
  };

  const handleEndCall = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    onEndCall();
  };

  return (
    <div className="relative flex flex-col h-screen w-full bg-black text-white">
      {/* Remote User Video (background) */}
      <div className="absolute inset-0">
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
                    <AvatarImage src={remoteUser.photoUrl} />
                    <AvatarFallback>{remoteUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="mt-4 text-xl font-semibold">{remoteUser.name}</p>
                {!hasPermissions && (
                    <Alert variant="destructive" className="mt-8 max-w-sm">
                        <AlertTitle>카메라 접근 불가</AlertTitle>
                        <AlertDescription>
                            화상 통화를 위해 카메라와 마이크 권한을 허용해주세요.
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Local User Video (picture-in-picture) */}
      <div className="absolute top-4 right-4 h-48 w-36 rounded-lg overflow-hidden border-2 border-primary">
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
          <Button variant="ghost" size="icon" onClick={toggleMic} className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur">
            {isMicOn ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleCamera} className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur">
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
