'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { getDateCourse } from '@/app/actions/ai-actions';
import { DateCourseOutput } from '@/ai/flows/date-course-flow';
import ReactMarkdown from 'react-markdown';

const formSchema = z.object({
  destination: z.string().min(1, '여행지를 입력해주세요.'),
  partySize: z.string(),
  duration: z.string().min(1, '데이트 기간을 입력해주세요.'),
  date: z.date({
    required_error: '데이트 날짜를 선택해주세요.',
  }),
  transportation: z.string(),
  cost: z.string(),
  dateType: z.string(),
});

const partySizes = ['2명', '3명~4명', '5명 이상'];
const transportations = ['대중교통', '렌터카', '자가용', '항공기', '도보/자전거', '상관없음'];
const costs = ['~3만원', '5만원', '7~8만원', '10만원', '20만원', '상관없음'];
const dateTypes = ['음주가무', '모험', '휴식', '문화체험', '맛집탐방', '상관없음'];

export default function DateCourseForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DateCourseOutput | null>(null);
  const [showForm, setShowForm] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destination: '',
      partySize: '2명',
      duration: '',
      transportation: '상관없음',
      cost: '상관없음',
      dateType: '상관없음',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setShowForm(false);
    try {
      const response = await getDateCourse({
          ...values,
          date: format(values.date, 'yyyy-MM-dd')
      });
      setResult(response);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류 발생',
        description: '데이트 코스를 생성하는 데 실패했습니다. 다시 시도해주세요.',
      });
      setShowForm(true); // Show form again on error
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
        <div className="mt-8 flex flex-col items-center justify-center text-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">AI가 두 분만을 위한<br/>완벽한 데이트를 계획하고 있어요...</p>
        </div>
    );
  }

  if (result) {
    return (
        <div>
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>AI 추천 데이트 코스</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown>{result.recommendation}</ReactMarkdown>
                </CardContent>
            </Card>
            <Button onClick={() => { setResult(null); setShowForm(true); }} className="w-full mt-4">
                새로운 코스 추천받기
            </Button>
        </div>
    );
  }

  return (
    <div style={{ display: showForm ? 'block' : 'none' }}>
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-primary">AI 데이트 코스 추천</h2>
            <p className="text-muted-foreground mt-2">
                가고 싶은 곳이나 원하는 분위기를 알려주시면, AI가 완벽한 데이트를 계획해드려요.
            </p>
        </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>가고싶은 여행지에 대해 알려주세요</FormLabel>
                <FormControl>
                  <Input placeholder="예: 서울" {...field} />
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
                <FormLabel>데이트 인원</FormLabel>
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
                <FormLabel>데이트 기간</FormLabel>
                <FormControl>
                  <Input placeholder="예: 6시간, 1박 2일" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>데이트 날짜</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'yyyy-MM-dd')
                        ) : (
                          <span>연도-월-일</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

        <FormField
            control={form.control}
            name="transportation"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>교통수단</FormLabel>
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
                <FormLabel>1인당 데이트 비용</FormLabel>
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
                <FormLabel>선호하는 데이트 유형</FormLabel>
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

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            AI 데이트 코스 추천받기
          </Button>
        </form>
      </Form>
    </div>
  );
}
