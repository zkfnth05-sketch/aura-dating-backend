'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import type { FilterSettings } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

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
    const { t } = useLanguage();
    
    const [localFilters, setLocalFilters] = useState<FilterSettings | null>(null);

    const allValues = {
      relationship: [t('relationship_section_title_serious'), t('relationship_section_title_casual'), t('relationship_section_title_friends'), t('relationship_section_title_chat')],
      values: [t('values_section_title_adventure'), t('values_section_title_stability'), t('values_section_title_creativity'), t('values_section_title_growth'), t('values_section_title_authenticity'), t('values_section_title_passion'), t('values_section_title_calmness'), t('values_section_title_humor')],
      communication: [t('communication_section_title_deep'), t('communication_section_title_witty'), t('communication_section_title_sincere'), t('communication_section_title_warm'), t('communication_section_title_direct')],
      lifestyle: [t('lifestyle_section_title_active'), t('lifestyle_section_title_homebody'), t('lifestyle_section_title_artist'), t('lifestyle_section_title_wellness'), t('lifestyle_section_title_explorer'), t('lifestyle_section_title_minimalist')],
      hobbies: [t('hobbies_section_title_movies'), t('hobbies_section_title_music'), t('hobbies_section_title_exercise'), t('hobbies_section_title_cooking'), t('hobbies_section_title_reading'), t('hobbies_section_title_travel'), t('hobbies_section_title_games'), t('hobbies_section_title_camping'), t('hobbies_section_title_watercolor'), t('hobbies_section_title_baking'), t('hobbies_section_title_coding'), t('hobbies_section_title_piano'), t('hobbies_section_title_scuba'), t('hobbies_section_title_meditation')],
      interests: [t('interests_section_title_foodie'), t('interests_section_title_cafe'), t('interests_section_title_photo'), t('interests_section_title_fashion'), t('interests_section_title_beauty'), t('interests_section_title_finance'), t('interests_section_title_self_dev'), t('interests_section_title_drawing'), t('interests_section_title_reading'), t('interests_section_title_hiking'), t('interests_section_title_classical'), t('interests_section_title_yoga')]
    };
    const genderOptions: ('남성' | '여성' | '기타')[] = ['남성', '여성', '기타'];


    useEffect(() => {
        if (isLoaded) {
            setLocalFilters(filters);
        }
    }, [isLoaded, filters]);
    
    if (!isLoaded || !user || !localFilters) {
        return <main className="container pb-4 px-4 flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></main>;
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
        <main className="container pb-24 px-4">
            <Section title={t('filter_age')}>
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

            <Section title={t('filter_gender')}>
                <div className="flex flex-wrap gap-2">
                    <TagButton 
                        label={t('filter_gender_all')}
                        isSelected={localFilters.gender.length === 0 || localFilters.gender.length === genderOptions.length}
                        onClick={() => setLocalFilters(prev => prev ? {...prev, gender: []} : null)}
                    />
                    {genderOptions.map(gender => (
                        <TagButton 
                            key={gender} 
                            label={gender === '남성' ? t('gender_male') : gender === '여성' ? t('gender_female') : t('gender_other')}
                            isSelected={localFilters.gender.includes(gender)}
                            onClick={() => handleGenderSelect(gender)}
                        />
                    ))}
                </div>
            </Section>
            
            {Object.entries({
                'filter_relationship': 'relationship', 
                'filter_values': 'values', 
                'filter_communication': 'communication',
                'filter_lifestyle': 'lifestyle',
                'filter_hobbies': 'hobbies',
                'filter_interests': 'interests'
            }).map(([titleKey, key]) => (
                <Section key={key} title={t(titleKey as any)}>
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

             <div className="py-4">
                <div className="flex w-full gap-2">
                    <Button variant="secondary" onClick={handleReset} className="flex-1 h-12 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg">{t('filter_reset')}</Button>
                    <Button onClick={handleApply} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg">{t('filter_apply')}</Button>
                </div>
            </div>

        </main>
    );
}
