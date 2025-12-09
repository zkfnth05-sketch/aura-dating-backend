'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';
import { getEnhancedPhoto } from '@/app/actions/ai-actions';
import Image from 'next/image';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import type { User } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const formSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.'),
  email: z.string().email('유효한 이메일 주소를 입력해주세요.'),
  age: z.coerce.number().min(18, '나이는 18세 이상이어야 합니다.'),
  gender: z.enum(['남성', '여성', '기타']),
  location: z.string().min(1, '도시를 입력해주세요.'),
});

type EditUserDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  user: User;
};

export default function EditUserDialog({ isOpen, onClose, onUserUpdated, user }: EditUserDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(user.photoUrls?.[0] || null);
  const [aiEnhancement, setAiEnhancement] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name,
      email: user.email || '',
      age: user.age,
      gender: user.gender,
      location: user.location,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email || '',
        age: user.age,
        gender: user.gender,
        location: user.location,
      });
      setPhotoUrl(user.photoUrls?.[0] || null);
    }
  }, [user, form]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUri = e.target?.result as string;
        if (!dataUri) return;

        setPhotoUrl(dataUri); // Show original preview immediately
        
        if (aiEnhancement) {
          setIsEnhancing(true);
          try {
            const result = await getEnhancedPhoto({ photoDataUri: dataUri, gender: form.getValues('gender') });
            setPhotoUrl(result.enhancedPhotoDataUri);
          } catch (error) {
             console.error("Photo enhancement failed:", error);
             toast({ variant: "destructive", title: "AI 보정 실패", description: "원본 이미지가 사용됩니다." });
             setPhotoUrl(dataUri); // Fallback to original
          } finally {
              setIsEnhancing(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !user) return;
    if(isEnhancing) {
        toast({ variant: "destructive", title: "AI 보정 중", description: "사진 보정이 완료될 때까지 기다려주세요." });
        return;
    }
    setIsSubmitting(true);

    const userRef = doc(firestore, 'users', user.id);
    
    const updatedPayload: Partial<User> = {
      ...values,
      photoUrls: photoUrl ? [photoUrl] : user.photoUrls,
    };

    updateDoc(userRef, updatedPayload)
      .then(() => {
        toast({
          title: "사용자 정보 수정됨",
          description: `${values.name} 님의 정보가 성공적으로 업데이트되었습니다.`,
        });
        onUserUpdated();
      })
      .catch((error) => {
         if (error.code === 'permission-denied') {
          const contextualError = new FirestorePermissionError({
            operation: 'update',
            path: userRef.path,
            requestResourceData: updatedPayload,
          });
          errorEmitter.emit('permission-error', contextualError);
        } else {
          console.error("Error updating user:", error);
          toast({
            variant: "destructive",
            title: "오류",
            description: "사용자 정보를 수정하는 데 실패했습니다.",
          });
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };
  
  if (!user) return null;

  const isProcessing = isSubmitting || isEnhancing;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>사용자 정보 수정</DialogTitle>
          <DialogDescription>
            '{user.name}'님의 정보를 수정합니다.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="flex flex-col gap-4">
               <FormItem>
                <FormLabel>사진</FormLabel>
                <FormControl>
                  <div
                    className="relative w-24 h-24 flex items-center justify-center border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer bg-zinc-900/50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {photoUrl ? (
                      <Image src={photoUrl} alt="Profile preview" layout="fill" className="object-cover rounded-lg" />
                    ) : (
                      <Plus className="w-8 h-8 text-zinc-500" />
                    )}
                    {isEnhancing && <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg"><Loader2 className="w-6 h-6 animate-spin"/></div>}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                      disabled={isProcessing}
                    />
                  </div>
                </FormControl>
              </FormItem>
              <div className="flex items-center space-x-2">
                <Switch id="ai-enhancement-edit" checked={aiEnhancement} onCheckedChange={setAiEnhancement} />
                <Label htmlFor="ai-enhancement-edit">AI 보정</Label>
              </div>
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이름</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>나이</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>도시</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>성별</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="여성" />
                        </FormControl>
                        <FormLabel className="font-normal">여성</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="남성" />
                        </FormControl>
                        <FormLabel className="font-normal">남성</FormLabel>
                      </FormItem>
                       <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="기타" />
                        </FormControl>
                        <FormLabel className="font-normal">기타</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter>
              <Button type="button" variant="secondary" onClick={onClose}>취소</Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                저장
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
