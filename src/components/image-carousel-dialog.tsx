'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Image from 'next/image';
import type { EmblaCarouselType } from 'embla-carousel-react'
import { useEffect, useState } from 'react';

type ImageCarouselDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  startIndex?: number;
};

export default function ImageCarouselDialog({ isOpen, onClose, images, startIndex = 0 }: ImageCarouselDialogProps) {
  const [api, setApi] = useState<EmblaCarouselType | undefined>()

  useEffect(() => {
    if (!api) {
      return
    }
    // Ensure the carousel goes to the correct start index when opened
    if (isOpen) {
      api.scrollTo(startIndex, true);
    }
  }, [api, isOpen, startIndex])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 border-0 bg-transparent w-full h-full max-w-none sm:rounded-none flex items-center justify-center">
        <DialogTitle className="sr-only">프로필 이미지 갤러리</DialogTitle>
        <div className="relative w-full h-full">
          <Carousel 
            className="w-full h-full"
            opts={{
                startIndex: startIndex,
                loop: true,
            }}
            setApi={setApi}
          >
            <CarouselContent className="h-full">
              {images.map((src, index) => (
                <CarouselItem key={index} className="flex items-center justify-center">
                  <div className="relative w-full h-[90vh]">
                    <Image 
                      src={src} 
                      alt={`Profile image ${index + 1}`}
                      fill
                      className="object-contain"
                      data-ai-hint="person portrait"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white bg-black/50 hover:bg-black/80" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white bg-black/50 hover:bg-black/80" />
          </Carousel>
        </div>
      </DialogContent>
    </Dialog>
  );
}
