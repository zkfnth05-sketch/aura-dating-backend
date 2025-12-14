'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import type { FilterSettings } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const allValues = {
  relationship: ['진지한 관계', '가벼운 만남', '새로운 친구', '대화 상대'],
  values: ['모험', '안정', '창의성', '성장', '진정성', '열정', '평온함', '유머'],
  communication: ['깊은 대화', '유머러스', '진솔함', '따뜻함', '직설적'],
  lifestyle: ['활동적', '집순이', '예술가', '웰빙', '탐험가', '미니멀리스트'],
  hobbies: ['영화 감상', '음악 듣기', '운동', '요리', '독서', '여행', '게임', '캠핑', '수채화', '베이킹', '코딩', '피아노 연주', '스쿠버 다이빙', '명상'],
  interests: ['맛집 탐방', '카페 투어', '사진 촬영', '패션', '뷰티', '재테크', '자기계발', '그림 그리기', '독서', '등산', '클래식 음악', '요가']
};
const genderOptions: ('남성' | '여성' | '기타')[] = ['남성', '여성', '기타'];


const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="py-5">
      <h2 className="text-sm font-semibold text-muted-foreground mb-3">{title}</h2>
      <div>{children}</div>
    </div>
);
  
const TagButton = ({ label, isSelected, onClick }: { label: string, isSelected: boolean, onClick: () => void }) => (
    <Button
      variant={isSelected ? 'default' : 'secondary'}
      onClick={onClick}
      className={cn(
          "rounded-full h-auto py-2 px-4 text-sm font-normal",
          isSelected ? "bg-primary text-primary-foreground" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
      )}
    >
      {label}
    </Button>
);

export default function FilterClient() {
    const router = useRouter();
    const { filters, updateFilters, resetFilters: resetGlobalFilters, isLoaded, user } = useUser();
    
    // Initialize local state with a default and then update from context when loaded.
    const [localFilters, setLocalFilters] = useState<FilterSettings | null>(null);

    useState(() => {
        if (isLoaded) {
            setLocalFilters(filters);
        }
    });
    
    if (!isLoaded || !user) {
        return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!localFilters) {
         // This can happen briefly before the effect runs
        return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }


    const handleMultiSelect = (field: keyof FilterSettings, value: string) => {
        setLocalFilters(prev => {
            if (!prev) return null;
            const currentValues = prev[field] as string[];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [field]: newValues };
        });
    };
    
    const handleGenderSelect = (value: '남성' | '여성' | '기타') => {
        setLocalFilters(prev => {
            if (!prev) return null;
            const currentValues = prev.gender;
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, gender: newValues };
        });
    };

    const handleAgeChange = (field: 'min' | 'max', value: string) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
            setLocalFilters(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    ageRange: { ...prev.ageRange, [field]: numValue }
                }
            });
        }
    };

    const handleApply = () => {
        if (localFilters) {
            updateFilters(localFilters);
        }
        router.push('/');
    };
    
    const handleReset = () => {
        const defaultFilters: FilterSettings = {
            ageRange: { min: 18, max: 99 },
            gender: [],
            relationship: [],
            values: [],
            communication: [],
            lifestyle: [],
            hobbies: [],
            interests: [],
        };
        resetGlobalFilters();
        setLocalFilters(defaultFilters);
    };

    return (
        <>
            <main className="container pb-24 px-4">
                <Section title="나이">
                    <div className="flex items-center gap-4">
                        <Input 
                            type="number"
                            value={localFilters.ageRange.min}
                            onChange={e => handleAgeChange('min', e.target.value)}
                            className="bg-zinc-900 border-zinc-800 text-center"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input 
                            type="number"
                            value={localFilters.ageRange.max}
                            onChange={e => handleAgeChange('max', e.target.value)}
                            className="bg-zinc-900 border-zinc-800 text-center"
                        />
                    </div>
                </Section>

                <Section title="성별">
                    <div className="flex flex-wrap gap-2">
                        <TagButton 
                            label="전체"
                            isSelected={localFilters.gender.length === 0 || localFilters.gender.length === genderOptions.length}
                            onClick={() => setLocalFilters(prev => prev ? {...prev, gender: []} : null)}
                        />
                        {genderOptions.map(gender => (
                            <TagButton 
                                key={gender} 
                                label={gender}
                                isSelected={localFilters.gender.includes(gender)}
                                onClick={() => handleGenderSelect(gender)}
                            />
                        ))}
                    </div>
                </Section>
                
                {Object.entries({
                    '찾는 관계': 'relationship', 
                    '가치관': 'values', 
                    '소통 스타일': 'communication',
                    '라이프스타일': 'lifestyle',
                    '취미': 'hobbies',
                    '관심사': 'interests'
                }).map(([title, key]) => (
                    <Section key={key} title={title}>
                        <div className="flex flex-wrap gap-2">
                            {allValues[key as keyof typeof allValues].map(item => (
                                <TagButton 
                                    key={item}
                                    label={item}
                                    isSelected={(localFilters[key as keyof typeof localFilters] as string[]).includes(item)}
                                    onClick={() => handleMultiSelect(key as keyof FilterSettings, item)}
                                />
                            ))}
                        </div>
                    </Section>
                ))}

            </main>

            <footer className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-sm border-t border-zinc-800 z-50">
                <div className="flex w-full gap-2">
                    <Button variant="secondary" onClick={handleReset} className="flex-1 h-12 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg">초기화</Button>
                    <Button onClick={handleApply} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg">적용하기</Button>
                </div>
            </footer>
        </>
    );
}