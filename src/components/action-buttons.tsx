import { Button } from '@/components/ui/button';
import { X, Heart, Send } from 'lucide-react';

type ActionButtonsProps = {
  onDislike: () => void;
  onSuperlike: () => void;
  onLike: () => void;
};

export default function ActionButtons({ onDislike, onSuperlike, onLike }: ActionButtonsProps) {
  return (
    <div className="mt-6 flex items-center justify-center gap-8 z-10">
      <Button onClick={onDislike} variant="outline" size="icon" className="w-20 h-20 rounded-full bg-background/80 backdrop-blur-sm border-2 border-foreground/30 text-foreground/50 hover:bg-card hover:text-foreground/80">
        <X className="w-8 h-8" />
      </Button>
      <Button onClick={onSuperlike} variant="outline" size="icon" className="w-16 h-16 rounded-full bg-background/80 backdrop-blur-sm border-2 border-primary/70 text-primary hover:bg-card hover:text-primary">
        <Send className="w-7 h-7" />
      </Button>
      <Button onClick={onLike} variant="outline" size="icon" className="w-20 h-20 rounded-full bg-background/80 backdrop-blur-sm border-2 border-destructive/80 text-destructive hover:bg-card hover:text-destructive">
        <Heart className="w-9 h-9 fill-current" />
      </Button>
    </div>
  );
}
