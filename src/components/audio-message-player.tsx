
'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Languages, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getAudioTranslation } from '@/actions/ai-actions';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';

const languageMap: { [key: string]: string } = {
  ko: 'Korean',
  en: 'English',
  es: 'Spanish',
  ja: 'Japanese',
};

export default function AudioMessagePlayer({ message }: { message: Message }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const { toast } = useToast();
  const { language: targetLanguageCode, t } = useLanguage();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
    };

    const setAudioTime = () => {
      if (audio.duration > 0) {
        const newProgress = (audio.currentTime / audio.duration) * 100;
        setProgress(newProgress);
        if (audio.currentTime === audio.duration) {
          setIsPlaying(false);
          setProgress(0); // Reset progress on end
        }
      }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(e => console.error("Audio play failed", e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    if (message.audioUrl) {
      const link = document.createElement('a');
      link.href = message.audioUrl;
      link.download = `aura-audio-${message.id || Date.now()}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleTranslate = async () => {
    if (!message.audioUrl) return;

    setIsTranslating(true);
    setTranslatedText(null);
    try {
      const result = await getAudioTranslation({
        audioUrl: message.audioUrl,
        targetLanguage: languageMap[targetLanguageCode] || 'Korean',
      });
      if (result.translatedText) {
        setTranslatedText(result.translatedText);
      } else {
        toast({ variant: 'destructive', description: "음성을 텍스트로 변환하지 못했습니다." });
      }
    } catch (error) {
      toast({ variant: 'destructive', description: "음성 메시지 번역에 실패했습니다." });
    } finally {
      setIsTranslating(false);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  return (
    <div className="flex flex-col gap-2 w-full max-w-[250px]">
      <div className="flex items-center gap-2 p-2 rounded-lg bg-black/10 dark:bg-white/10">
        <audio ref={audioRef} src={message.audioUrl} preload="metadata" className="hidden" />
        <Button onClick={togglePlayPause} size="icon" variant="ghost" className="w-8 h-8 rounded-full flex-shrink-0">
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <div className="flex-grow flex flex-col justify-center">
            <Progress value={progress} className="w-full h-1" />
            <span className="text-xs text-right text-muted-foreground mt-1">{formatTime(duration)}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button onClick={handleDownload} size="sm" variant="ghost" className="text-muted-foreground h-7 px-2">
          <Download className="h-3 w-3 mr-1" />
          {t('download_button')}
        </Button>
        <Button onClick={handleTranslate} size="sm" variant="ghost" className="text-muted-foreground h-7 px-2" disabled={isTranslating}>
          {isTranslating ? <Loader2 className="h-3 w-3 mr-1 animate-spin"/> : <Languages className="h-3 w-3 mr-1" />}
          {isTranslating ? t('translating_button') : t('translate_button')}
        </Button>
      </div>
      {translatedText && (
        <div className="text-xs p-2 bg-black/5 dark:bg-white/5 rounded-md italic">
          {translatedText}
        </div>
      )}
    </div>
  );
}
