'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { collection } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

const formSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.'),
  email: z.string().email('유효한 이메일 주소를 입력해주세요.'),
  age: z.coerce.number().min(18, '나이는 18세 이상이어야 합니다.'),
  gender: z.enum(['남성', '여성', '기타'], {
    required_error: "성별을 선택해주세요.",
  }),
  location: z.string().min(1, '도시를 입력해주세요.'),
});

type AddUserDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
};

export default function AddUserDialog({ isOpen, onClose, onUserAdded }: AddUserDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      age: 25,
      gender: '여성',
      location: '서울',
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const resetForm = () => {
    form.reset();
    setPhotoPreview(null);
  }

  const handleClose = () => {
    resetForm();
    onClose();
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      const usersCol = collection(firestore, 'users');
      const newUserRef = doc(usersCol);
      
      let photoUrl: string;
      if (photoPreview) {
        photoUrl = photoPreview;
      } else {
        const randomImage = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)];
        photoUrl = randomImage.imageUrl;
      }

      await setDoc(newUserRef, {
        id: newUserRef.id,
        ...values,
        createdAt: serverTimestamp(),
        likeCount: 0,
        photoUrls: [photoUrl],
        bio: '새로운 만남을 기다립니다! 관리자에 의해 추가된 사용자입니다.',
        hobbies: ['독서', '영화 감상'],
        interests: ['맛집 탐방', '여행'],
        lat: 37.5665 + (Math.random() - 0.5) * 0.1, // Seoul with some randomness
        lng: 126.9780 + (Math.random() - 0.5) * 0.1,
        phoneNumber: '',
      });

      toast({
        title: "사용자 추가 성공",
        description: `${values.name} 님이 시스템에 추가되었습니다.`,
      });
      onUserAdded();
      resetForm();
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        variant: "destructive",
        title: "오류",
        description: "사용자를 추가하는 데 실패했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>새로운 사용자 추가</DialogTitle>
          <DialogDescription>
            새 사용자의 정보를 입력하세요. 정보는 나중에 수정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormItem>
              <FormLabel>사진</FormLabel>
              <FormControl>
                <div
                  className="relative w-24 h-24 flex items-center justify-center border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer bg-zinc-900/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <Image src={photoPreview} alt="Profile preview" layout="fill" className="object-cover rounded-lg" />
                  ) : (
                    <Plus className="w-8 h-8 text-zinc-500" />
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              </FormControl>
            </FormItem>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이름</FormLabel>
                  <FormControl>
                    <Input placeholder="홍길동" {...field} />
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
                    <Input placeholder="test@example.com" {...field} />
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
                    <Input placeholder="예: 서울" {...field} />
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
              <Button type="button" variant="secondary" onClick={handleClose}>취소</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                사용자 추가
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
