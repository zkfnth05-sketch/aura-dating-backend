'use client';

import { useState, useEffect, useRef } from 'react';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, onSnapshot, collection, addDoc, getDoc, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';
import { useLanguage } from '@/contexts/language-context';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

interface VideoChatProps {
  localUser: User;
  remoteUser: User;
  matchId: string;
  onEndCall: () => void;
}

export default function VideoChat({ localUser, remoteUser, matchId, onEndCall }: VideoChatProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const firestore = useFirestore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [hasPermissions, setHasPermissions] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  useEffect(() => {
    const setupCall = async () => {
      if (!firestore) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        setHasPermissions(true);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err: any) {
        setHasPermissions(false);
        if (err.name === 'NotFoundError') {
          toast({
            variant: "destructive",
            title: t('media_device_not_found_title'),
            description: t('media_device_not_found_desc'),
          });
        } else {
          toast({
              variant: "destructive",
              title: t('camera_permission_denied_title'),
              description: t('camera_permission_denied_desc')
          });
        }
        return;
      }
      
      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      const matchRef = doc(firestore, 'matches', matchId);
      const candidatesCol = collection(matchRef, 'candidates');

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(candidatesCol, { ...event.candidate.toJSON(), userId: localUser.id });
        }
      };

      const matchSnap = await getDoc(matchRef);
      const isCaller = matchSnap.data()?.callerId === localUser.id;

      if (isCaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await updateDoc(matchRef, { offer: { type: offer.type, sdp: offer.sdp } });

        onSnapshot(matchRef, async (snapshot) => {
          const data = snapshot.data();
          if (!pc.currentRemoteDescription && data?.answer) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
        });
      } else {
        const offer = matchSnap.data()?.offer;
        if (offer) {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await updateDoc(matchRef, { answer: { type: answer.type, sdp: answer.sdp }, callStatus: 'active' });
        }
      }

      onSnapshot(candidatesCol, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added' && change.doc.data().userId !== localUser.id) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
            } catch (error) {
              console.error("Error adding received ice candidate", error);
            }
          }
        });
      });
    };

    setupCall();

    return () => {
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore, matchId, localUser.id]);
  
  const cleanupCallData = async () => {
      if (!firestore) return;
      const matchRef = doc(firestore, 'matches', matchId);
      const candidatesCol = collection(matchRef, 'candidates');
  
      try {
        const candidatesSnap = await getDocs(candidatesCol);
        if(!candidatesSnap.empty) {
            const batch = writeBatch(firestore);
            candidatesSnap.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }
      
        await updateDoc(matchRef, {
          callStatus: 'idle',
          offer: null,
          answer: null,
          callerId: null
        });
      } catch (error) {
        console.error("Error cleaning up call data:", error);
      }
  };
  
  const handleEndCall = async () => {
      await cleanupCallData();
      onEndCall();
  };
  
  const toggleMic = () => {
    if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
            track.enabled = !isMicOn;
        });
        setIsMicOn(!isMicOn);
    }
  };

  const toggleCamera = () => {
     if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(track => {
            track.enabled = !isCameraOn;
        });
        setIsCameraOn(!isCameraOn);
    }
  };

  return (
    <div className="relative flex flex-col h-screen w-full bg-black text-white">
      <div className="absolute inset-0 z-0">
         <video
           ref={remoteVideoRef}
           autoPlay
           playsInline
           className="h-full w-full object-cover"
         />
        {!hasPermissions && (
          <div className="h-full w-full bg-zinc-900 flex flex-col items-center justify-center">
            <Alert variant="destructive" className="mt-8 max-w-sm">
                <AlertTitle>{t('camera_access_required')}</AlertTitle>
                <AlertDescription>
                    {t('camera_allow_access')}
                </AlertDescription>
            </Alert>
          </div>
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="absolute top-4 right-4 h-48 w-36 rounded-lg overflow-hidden border-2 border-primary z-10 bg-zinc-800">
         {hasPermissions ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover scale-x-[-1] ${isCameraOn ? 'opacity-100' : 'opacity-0'}`}
            />
         ) : null}
         {!isCameraOn &&
            <div className="h-full w-full flex items-center justify-center">
                <VideoOff className="w-8 h-8 text-zinc-500"/>
            </div>
         }
      </div>

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
