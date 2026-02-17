
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/user-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { CoachMarkGuideData } from '@/lib/coachmark-steps';

interface CoachMarkGuideProps {
  guide: CoachMarkGuideData;
}

export default function CoachMarkGuide({ guide }: CoachMarkGuideProps) {
  const { user, updateUser, isLoaded } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Only run when user data is fully loaded
    if (isLoaded && user) {
      // Check if this guide has already been completed
      const hasCompleted = user.completedCoachMarks?.includes(guide.guideId);
      if (!hasCompleted) {
        // If not completed, open the guide after a short delay
        setTimeout(() => setIsOpen(true), 500);
      }
    }
  }, [isLoaded, user, guide.guideId]);

  const handleNext = () => {
    if (currentStep < guide.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step, finish the guide
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    // Mark this guide as completed and save to user profile
    if (user) {
      const updatedMarks = [...(user.completedCoachMarks || []), guide.guideId];
      updateUser({ completedCoachMarks: updatedMarks });
    }
    setIsOpen(false);
  };
  
  if (!isOpen) {
    return null;
  }

  const step = guide.steps[currentStep];
  const progressValue = ((currentStep + 1) / guide.steps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleFinish(); }}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-primary">{step.title}</DialogTitle>
          <DialogDescription className="pt-4 text-base">
            {step.content}
          </DialogDescription>
        </DialogHeader>

        <Progress value={progressValue} className="w-full h-1 my-4" />

        <DialogFooter className="flex justify-between w-full">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            이전
          </Button>
          <Button onClick={handleNext}>
            {currentStep === guide.steps.length - 1 ? '완료' : '다음'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
