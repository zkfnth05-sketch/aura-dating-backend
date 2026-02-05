import { Button } from '@/components/ui/button';
import { X, Heart, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ActionButtonsProps = {
  onDislike: () => void;
  onMessage: () => void;
  onLike: () => void;
  isLiked?: boolean;
};

export default function ActionButtons({ onDislike, onMessage, onLike, isLiked = false }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-10 z-10">
      <Button 
        onClick={onDislike} 
        variant="outline" 
        size="icon" 
        className="w-16 h-16 rounded-full bg-button-dislike text-white hover:bg-button-dislike/90 shadow-lg border-2 border-white/20"
      >
        <X className="w-10 h-10" />
      </Button>

      <Button 
        onClick={onMessage} 
        variant="outline" 
        size="icon" 
        className="w-16 h-16 rounded-full bg-button-superlike text-white hover:bg-button-superlike/90 shadow-lg border-2 border-white/20"
      >
        <MessageCircle className="w-9 h-9" />
      </Button>
      
      <Button 
        onClick={onLike} 
        variant="outline" 
        size="icon" 
        className={cn(
            "w-16 h-16 rounded-full bg-button-like text-white hover:bg-button-like/90 shadow-lg border-2 border-white/20",
            isLiked && "bg-zinc-700 text-zinc-400 cursor-not-allowed"
        )}
        disabled={isLiked}
      >
        <Heart className="w-10 h-10 fill-current" />
      </Button>
    </div>
  );
}
