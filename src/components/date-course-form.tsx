
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import { Loader2, Bus, Car, Plane, Footprints } from 'lucide-react';
import Image from 'next/image';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { getDateCourse } from '@/actions/ai-actions';
import type { DateCourseOutput } from '@/ai/flows/date-course-flow';
import { useLanguage } from '@/contexts/language-context';

const formSchema = z.object({
  destination: z.string().min(1, '여행지를 입력해주세요.'),
  partySize: z.string(),
  duration: z.string().min(1, '데이트 기간을 입력해주세요.'),
  date: z.string().min(1, '데이트 날짜를 입력해주세요. (YYYY-MM-DD)'),
  transportation: z.string(),
  cost: z.string(),
  dateType: z.string(),
});

const transportationIcons = {
    '대중교통': <Bus className="mr-2 h-4 w-4" />,
    '렌터카': <Car className="mr-2 h-4 w-4" />,
    '자가용': <Car className="mr-2 h-4 w-4" />,
    '항공기': <Plane className="mr-2 h-4 w-4" />,
    '도보/자전거': <Footprints className="mr-2 h-4 w-4" />,
    '상관없음': <Car className="mr-2 h-4 w-4" />,
} as const;

export default function DateCourseForm() {
  const [result, setResult] = useState<DateCourseOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const { t } = useLanguage();

  const partySizes = [t('date_course_party_size_2'), t('date_course_party_size_3_4'), t('date_course_party_size_5_plus')];
  const transportations = [t('date_course_transport_public'), t('date_course_transport_rent'), t('date_course_transport_private'), t('date_course_transport_flight'), t('date_course_transport_walk'), t('date_course_transport_any')];
  const costs = [t('date_course_cost_30k'), t('date_course_cost_50k'), t('date_course_cost_70k'), t('date_course_cost_100k'), t('date_course_cost_200k'), t('date_course_cost_any')];
  const dateTypes = [t('date_course_vibe_drink'), t('date_course_vibe_adventure'), t('date_course_vibe_rest'), t('date_course_vibe_culture'), t('date_course_vibe_foodie'), t('date_course_vibe_any')];
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destination: '',
      partySize: partySizes[0],
      duration: '',
      date: '',
      transportation: transportations[5],
      cost: costs[5],
      dateType: dateTypes[5],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setShowForm(false);

    try {
        const response = await getDateCourse(values);
        setResult(response);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: t('ai_date_course_error_title'),
            description: t('ai_date_course_error_desc'),
        });
        setShowForm(true); // 에러 발생 시 폼을 다시 보여줌
    } finally {
        setIsLoading(false);
    }
  }
  
  const handleReset = () => {
    setResult(null);
    setIsLoading(false);
    setShowForm(true);
    form.reset();
  }

  if (isLoading) {
    return (
        <div className="mt-8 flex flex-col items-center justify-center text-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">{t('ai_generating_date_course_title')}<br/>{t('ai_generating_date_course_subtitle')}</p>
        </div>
    );
  }
  
  if (result) {
    return (
        <div className="pt-4">
            <h1 className="text-3xl font-bold mb-4">{result.title}</h1>
            
            {result.overallImageDataUri ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden my-4">
                    <Image src={result.overallImageDataUri} alt={result.title} fill className="object-cover" />
                </div>
            ) : (
                <div className="w-full aspect-video rounded-lg my-4 flex items-center justify-center bg-muted/50">
                    <p className="text-muted-foreground text-sm">{t('no_image_available')}</p>
                </div>
            )}
            
            {result.steps.map((step, index) => (
                <div key={index} className="my-6 border-t border-border/40 pt-6">
                    <h3 className="text-xl font-semibold text-primary">{step.time} - {step.title}</h3>
                    <p className="text-sm text-foreground/80 my-2">{step.description}</p>
                    <p className="text-xs text-muted-foreground"><strong>{t('date_course_travel_label')}:</strong> {step.directions}</p>
                    <p className="text-xs text-muted-foreground"><strong>{t('date_course_cost_per_person_label')}:</strong> {step.cost}</p>
                    <p className="text-xs text-amber-400 mt-2"><strong>{t('date_course_tip_label')}:</strong> {step.romanticTip}</p>
                </div>
            ))}
            
            <div className="mt-8 p-4 bg-card rounded-lg border">
                <p className="font-bold">{t('total_estimated_cost_label')}: {result.totalCost}</p>
                <p className="text-sm mt-2">{result.summaryAndMessage}</p>
            </div>
            
            <Button onClick={handleReset} className="w-full mt-8 h-12 text-base font-bold">
                {t('get_new_course_button')}
            </Button>
        </div>
    );
  }

  return (
    <>
      {showForm && (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-primary">{t('date_course_rec_title')}</h2>
                <p className="text-muted-foreground mt-2">
                    {t('date_course_rec_subtitle')}
                </p>
            </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('date_course_destination_label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('date_course_destination_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="partySize"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>{t('date_course_party_size_label')}</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {partySizes.map((size) => (
                          <Button
                            key={size}
                            type="button"
                            variant={field.value === size ? 'default' : 'secondary'}
                            onClick={() => field.onChange(size)}
                            className="rounded-full"
                          >
                            {size}
                          </Button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('date_course_duration_label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('date_course_duration_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('date_course_date_label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('date_course_date_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
                control={form.control}
                name="transportation"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>{t('date_course_transport_label')}</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {transportations.map((item) => (
                          <Button
                            key={item}
                            type="button"
                            variant={field.value === item ? 'default' : 'secondary'}
                            onClick={() => field.onChange(item)}
                            className="rounded-full"
                          >
                             {/* The icon logic needs to be aware of translations */}
                            {item}
                          </Button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
            <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>{t('date_course_cost_label')}</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {costs.map((item) => (
                          <Button
                            key={item}
                            type="button"
                            variant={field.value === item ? 'default' : 'secondary'}
                            onClick={() => field.onChange(item)}
                            className="rounded-full"
                          >
                            {item}
                          </Button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
                control={form.control}
                name="dateType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>{t('date_course_vibe_label')}</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {dateTypes.map((item) => (
                          <Button
                            key={item}
                            type="button"
                            variant={field.value === item ? 'default' : 'secondary'}
                            onClick={() => field.onChange(item)}
                            className="rounded-full"
                          >
                            {item}
                          </Button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="w-full h-12 text-base font-bold">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('get_ai_date_course_button')}
              </Button>
            </form>
          </Form>
        </div>
      )}
    </>
  );
}
