'use client';

import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import type { AIMatchEnhancementOutput } from '@/ai/flows/ai-match-enhancement';
import { getAIMatchAnalysis } from '@/app/actions/ai-actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Heart, Users, BrainCircuit, Star } from 'lucide-react';
import { Progress } from './ui/progress';

type AIAnalysisDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  user1: User;
  user2: User;
};

export default function AIAnalysisDialog({ isOpen, onClose, user1, user2 }: AIAnalysisDialogProps) {
  const [analysis, setAnalysis] = useState<AIMatchEnhancementOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !analysis && !isLoading) {
      setIsLoading(true);
      setError(null);
      getAIMatchAnalysis({ userProfile1: user1, userProfile2: user2 })
        .then(setAnalysis)
        .catch(() => setError('AI 분석에 실패했습니다. 다시 시도해주세요.'))
        .finally(() => setIsLoading(false));
    }
    if(!isOpen) {
      // Reset state when dialog is closed
      setAnalysis(null);
    }
  }, [isOpen, user1, user2, analysis, isLoading]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <BrainCircuit />
            AI 매치 분석
          </DialogTitle>
          <DialogDescription>
            당신과 {user2.name}님에 대한 AI의 생각입니다.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-4 h-64">
              <p className="text-muted-foreground animate-pulse">궁합을 분석하는 중...</p>
            </div>
          )}
          {error && <p className="text-destructive text-center h-64 flex items-center justify-center">{error}</p>}
          {analysis && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                 <p className="text-sm font-medium text-muted-foreground">궁합 점수</p>
                 <p className="text-6xl font-bold text-primary">{analysis.compatibilityScore}</p>
                 <Progress value={analysis.compatibilityScore} className="w-full" />
              </div>
              
              {analysis.sharedHobbies.length > 0 && (
                <div>
                  <h3 className="font-semibold flex items-center gap-2"><Users className="text-primary"/> 공통 취미</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                      {analysis.sharedHobbies.map(hobby => (
                          <span key={hobby} className="text-sm bg-accent px-2 py-1 rounded">{hobby}</span>
                      ))}
                  </div>
                </div>
              )}

              {analysis.sharedInterests.length > 0 && (
                <div>
                    <h3 className="font-semibold flex items-center gap-2"><Heart className="text-primary"/> 공통 관심사</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {analysis.sharedInterests.map(interest => (
                            <span key={interest} className="text-sm bg-accent px-2 py-1 rounded">{interest}</span>
                        ))}
                    </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold flex items-center gap-2"><Star className="text-primary"/> AI 한마디</h3>
                <p className="text-sm text-muted-foreground mt-2">{analysis.analysis}</p>
              </div>

            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
