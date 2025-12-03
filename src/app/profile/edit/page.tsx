'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { currentUser } from '@/lib/data';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, PlusCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const profileSchema = z.object({
  bio: z.string().max(200, '소개는 200자 이내로 작성해주세요.'),
  hobbies: z.array(z.string()).max(5, '최대 5개의 취미를 선택할 수 있습니다.'),
  interests: z.array(z.string()).max(5, '최대 5개의 관심사를 선택할 수 있습니다.'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ItemInput = ({ items, onAdd, onRemove }: { items: string[], onAdd: (item: string) => void, onRemove: (item: string) => void }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue && !items.includes(inputValue)) {
      onAdd(inputValue);
      setInputValue('');
    }
  };
  
  return (
    <div>
       <div className="flex gap-2 mb-2">
            <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdd();
                    }
                }}
                placeholder="항목을 입력하고 +를 누르세요"
            />
            <Button type="button" size="icon" variant="ghost" onClick={handleAdd}>
                <PlusCircle className="h-5 w-5" />
            </Button>
        </div>
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <Badge key={item} variant="secondary" className="bg-accent text-accent-foreground font-normal text-sm flex items-center gap-1.5">
            {item}
            <button type="button" onClick={() => onRemove(item)}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}


export default function ProfileEditPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: currentUser.bio || '',
      hobbies: currentUser.hobbies || [],
      interests: currentUser.interests || [],
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    console.log('Updated Profile:', data);
    // In a real app, you would update the user data in your backend.
    // For now, we'll just show a toast notification.
    toast({
      title: '프로필 저장됨',
      description: '프로필이 성공적으로 업데이트되었습니다.',
    });
    router.push('/profile');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
         <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft />
        </Button>
        <h1 className="text-lg font-semibold">프로필 수정</h1>
        <Button form="profile-form" type="submit" variant="link" className="text-primary">
            저장
        </Button>
      </header>

      <main className="container py-8 px-4">
        <Form {...form}>
            <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-primary">소개</FormLabel>
                    <FormControl>
                    <Textarea
                        placeholder="자신을 소개해보세요."
                        className="resize-none"
                        {...field}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="hobbies"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-primary">취미</FormLabel>
                    <FormControl>
                        <ItemInput 
                            items={field.value}
                            onAdd={(item) => field.onChange([...field.value, item])}
                            onRemove={(item) => field.onChange(field.value.filter(i => i !== item))}
                        />
                    </FormControl>
                     <FormDescription>
                        최대 5개까지 입력할 수 있습니다.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="interests"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-primary">관심사</FormLabel>
                    <FormControl>
                        <ItemInput 
                            items={field.value}
                            onAdd={(item) => field.onChange([...field.value, item])}
                            onRemove={(item) => field.onChange(field.value.filter(i => i !== item))}
                        />
                    </FormControl>
                     <FormDescription>
                        최대 5개까지 입력할 수 있습니다.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
            </form>
        </Form>
      </main>
    </div>
  );
}
