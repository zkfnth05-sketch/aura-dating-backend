import { Button } from '@/components/ui/button';
import { X, Heart, Send } from 'lucide-react';

type ActionButtonsProps = {
  onDislike: () => void;
  onMessage: () => void;
  onLike: () => void;
};

export default function ActionButtons({ onDislike, onMessage, onLike }: ActionButtonsProps) {
  return (
    <div className="mt-6 flex items-center justify-center gap-10 z-10">
      <Button onClick={onDislike} variant="outline" size="icon" className="w-16 h-16 rounded-full bg-button-bg border-0 text-button-dislike hover:bg-button-bg/80">
        <X className="w-8 h-8" />
      </Button>
      <Button onClick={onMessage} variant="outline" size="icon" className="w-16 h-16 rounded-full bg-button-bg border-0 text-button-superlike hover:bg-button-bg/80">
        <Send className="w-7 h-7" />
      </Button>
      <Button onClick={onLike} variant="outline" size="icon" className="w-16 h-16 rounded-full bg-button-bg border-0 text-button-like hover:bg-button-bg/80">
        <Heart className="w-8 h-8 fill-current" />
      </Button>
    </div>
  );
}
