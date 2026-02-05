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
    <div className="flex items-center justify-center gap-6 z-10">
      {/* Dislike Button */}
      <Button 
        onClick={onDislike} 
        variant="ghost" 
        size="icon" 
        className="w-20 h-20 rounded-full bg-button-bg text-button-dislike hover:bg-neutral-700"
      >
        <X className="w-10 h-10" />
      </Button>

      {/* Message Button */}
      <Button 
        onClick={onMessage} 
        variant="ghost" 
        size="icon" 
        className="w-16 h-16 rounded-full bg-button-bg text-blue-400 hover:bg-neutral-700"
      >
        <MessageCircle className="w-8 h-8" />
      </Button>
      
      {/* Like Button */}
      <Button 
        onClick={onLike} 
        variant="ghost" 
        size="icon" 
        className={cn(
            "w-20 h-20 rounded-full bg-button-bg text-button-like hover:bg-neutral-700",
            isLiked && "cursor-not-allowed opacity-70"
        )}
        disabled={isLiked}
      >
        <Heart className={cn("w-10 h-10", isLiked && "fill-current")} />
      </Button>
    </div>
  );
}
