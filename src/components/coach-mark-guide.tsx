
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { type CoachMarkGuideData } from '@/lib/coachmark-steps';

function getElementRect(selector: string): DOMRect | null {
  try {
    const element = document.querySelector(selector);
    return element ? element.getBoundingClientRect() : null;
  } catch (e) {
    console.error("Invalid selector for coach mark:", selector);
    return null;
  }
}

export default function CoachMarkGuide({ guide }: { guide: CoachMarkGuideData | null }) {
  const { user, updateUser, isLoaded } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});
  
  const step = guide?.steps[currentStepIndex];

  const updateSpotlight = useCallback(() => {
    if (!step) {
      setSpotlightStyle({ boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)' });
      return;
    }
    const rect = getElementRect(step.target);
    if (rect && rect.width > 0 && rect.height > 0) {
      setSpotlightStyle({
        width: `${rect.width + 16}px`,
        height: `${rect.height + 16}px`,
        top: `${rect.top - 8}px`,
        left: `${rect.left - 8}px`,
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
        transition: 'all 0.3s ease-in-out',
      });
    } else {
       // If target not found or has no dimensions, just darken the screen
       setSpotlightStyle({ 
         width: '100%',
         height: '100%',
         top: '0',
         left: '0',
         borderRadius: '0',
         boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
         transition: 'all 0.3s ease-in-out',
       });
    }
  }, [step]);
  
  useEffect(() => {
    if (isLoaded && user && guide) {
      const hasCompleted = user.completedCoachMarks?.includes(guide.guideId);
      if (!hasCompleted) {
        // Delay to ensure page elements are rendered
        const timer = setTimeout(() => {
            const firstStep = guide.steps[0];
            if (firstStep && getElementRect(firstStep.target)) {
                 setIsOpen(true);
            }
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoaded, user, guide]);

  useEffect(() => {
    if (isOpen) {
      updateSpotlight();
      window.addEventListener('resize', updateSpotlight);
      window.addEventListener('scroll', updateSpotlight, true); // Use capture to get scroll events early
      return () => {
        window.removeEventListener('resize', updateSpotlight);
        window.removeEventListener('scroll', updateSpotlight, true);
      };
    }
  }, [isOpen, updateSpotlight]);

  const handleNext = () => {
    if (guide && currentStepIndex < guide.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    if (user && guide) {
      const updatedMarks = [...(user.completedCoachMarks || []), guide.guideId];
      updateUser({ completedCoachMarks: updatedMarks });
    }
    setIsOpen(false);
  };
  
  if (!isOpen || !guide || !step) {
    return null;
  }
  
  const progressValue = ((currentStepIndex + 1) / guide.steps.length) * 100;

  return (
    <div className="fixed inset-0 z-[200]">
      <div 
        className="absolute rounded-lg border-2 border-dashed border-primary"
        style={spotlightStyle}
      />
      <div className="relative z-[201] h-full w-full flex flex-col justify-end pointer-events-none">
        <div className="p-4 sm:p-6 pointer-events-auto">
            <div className="bg-card text-card-foreground p-4 rounded-lg shadow-2xl max-w-sm mx-auto space-y-4">
                <Progress value={progressValue} className="w-full h-1" />
                <div>
                    <h3 className="font-bold text-lg text-primary">{step.title}</h3>
                    <p className="text-sm mt-1">{step.content}</p>
                </div>
                <div className="flex justify-between items-center">
                    <Button variant="ghost" onClick={handleFinish}>건너뛰기</Button>
                    <Button onClick={handleNext}>
                        {currentStepIndex === guide.steps.length - 1 ? '완료' : '다음'}
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
