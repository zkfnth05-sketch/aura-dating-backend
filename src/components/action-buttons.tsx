import { Button } from '@/components/ui/button';
import { X, Heart, Star, Sparkles } from 'lucide-react';

type ActionButtonsProps = {
  onDislike: () => void;
  onSuperlike: () => void;
  onLike: () => void;
  onAI: () => void;
};

export default function ActionButtons({ onDislike, onSuperlike, onLike, onAI }: ActionButtonsProps) {
  return (
    <div className="mt-6 flex items-center justify-center gap-4 z-10">
      <Button onClick={onDislike} variant="outline" size="icon" className="w-16 h-16 rounded-full bg-background border-2 border-foreground/50 hover:border-foreground text-foreground/80 hover:text-foreground">
        <X className="w-8 h-8" />
      </Button>
      <Button onClick={onSuperlike} variant="outline" size="icon" className="w-14 h-14 rounded-full bg-background border-2 border-primary/70 hover:border-primary text-primary/80 hover:text-primary">
        <Star className="w-6 h-6" />
      </Button>
      <Button onClick={onLike} variant="default" size="icon" className="w-16 h-16 rounded-full shadow-lg shadow-primary/30">
        <Heart className="w-8 h-8 fill-current" />
      </Button>
      <Button onClick={onAI} variant="outline" size="icon" className="w-14 h-14 rounded-full bg-background border-2 border-primary/70 hover:border-primary text-primary/80 hover:text-primary">
        <Sparkles className="w-6 h-6" />
      </Button>
    </div>
  );
}
