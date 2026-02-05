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
        size="icon" 
        className="w-20 h-20 rounded-full bg-button-bg text-muted-foreground hover:bg-neutral-700"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Message Button */}
      <Button 
        onClick={onMessage} 
        size="icon" 
        className="w-20 h-20 rounded-full bg-button-bg text-button-superlike hover:bg-neutral-700"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
      
      {/* Like Button */}
      <Button 
        onClick={onLike} 
        size="icon" 
        className={cn(
            "w-20 h-20 rounded-full bg-button-bg text-button-like hover:bg-neutral-700",
            isLiked && "cursor-not-allowed opacity-70"
        )}
        disabled={isLiked}
      >
        <Heart className="w-6 h-6 fill-current" />
      </Button>
    </div>
  );
}
