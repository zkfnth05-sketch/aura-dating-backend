
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
import { getEnhancedPhoto } from '@/actions/ai-actions';
import Image from 'next/image';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import type { User } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { compressImage } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';


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
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [originalPhotoUri, setOriginalPhotoUri] = useState<string | null>(null);
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
      const currentPhoto = user.photoUrls?.[0] || null;
      setPhotoPreview(currentPhoto);
      setOriginalPhotoUri(currentPhoto);
    }
  }, [user, form]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUri = e.target?.result as string;
        if (!dataUri) return;
        setPhotoPreview(dataUri); // Show original preview immediately
        setOriginalPhotoUri(dataUri);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !user) return;
    
    setIsSubmitting(true);
    setIsEnhancing(true);

    let finalPhotoUrl = photoPreview;

    try {
        if (originalPhotoUri && originalPhotoUri !== user.photoUrls?.[0]) { // Only enhance if photo changed
            const compressedUri = await compressImage(originalPhotoUri);
            if (aiEnhancement) {
              try {
                const result = await getEnhancedPhoto({ photoDataUri: compressedUri, gender: values.gender });
                finalPhotoUrl = await compressImage(result.enhancedPhotoDataUri);
              } catch (error: any) {
                console.error("AI photo enhancement failed:", error);
                toast({
                    variant: "destructive",
                    title: t('ai_enhance_failed_title'),
                    description: t('ai_enhance_failed_desc'),
                });
                finalPhotoUrl = compressedUri; // Fallback
              }
            } else {
                finalPhotoUrl = compressedUri;
            }
        }

        const userRef = doc(firestore, 'users', user.id);
        const updatedPayload: Partial<User> = {
            ...values,
            photoUrls: finalPhotoUrl ? [finalPhotoUrl] : user.photoUrls,
        };

        await updateDoc(userRef, updatedPayload);

        toast({
            title: t('admin_edit_user_success_title'),
            description: t('admin_edit_user_success_desc').replace('%s', values.name),
        });
        onUserUpdated();

    } catch (error: any) {
        if (error.code === 'permission-denied') {
            const contextualError = new FirestorePermissionError({
                operation: 'update',
                path: doc(firestore, 'users', user.id).path,
                requestResourceData: { /* payload */ },
            });
            errorEmitter.emit('permission-error', contextualError);
        } else {
            console.error("Error updating user:", error);
            toast({
                variant: "destructive",
                title: t('admin_edit_user_failed_title'),
                description: t('admin_edit_user_failed_desc'),
            });
        }
    } finally {
        setIsEnhancing(false);
        setIsSubmitting(false);
    }
  };
  
  if (!user) return null;

  const isProcessing = isSubmitting || isEnhancing;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('admin_edit_user_dialog_title')}</DialogTitle>
          <DialogDescription>
            {t('admin_edit_user_dialog_desc').replace('%s', user.name)}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="flex flex-col gap-4">
               <FormItem>
                <FormLabel>{t('admin_add_photo_label')}</FormLabel>
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
                    {isProcessing && <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg"><Loader2 className="w-6 h-6 animate-spin"/></div>}
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
                <Label htmlFor="ai-enhancement-edit">{t('ai_enhancement')}</Label>
              </div>
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('name_label')}</FormLabel>
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
                  <FormLabel>{t('admin_table_email')}</FormLabel>
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
                  <FormLabel>{t('age_label')}</FormLabel>
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
                  <FormLabel>{t('city_label')}</FormLabel>
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
                  <FormLabel>{t('gender_label')}</FormLabel>
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
                        <FormLabel className="font-normal">{t('gender_female')}</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="남성" />
                        </FormControl>
                        <FormLabel className="font-normal">{t('gender_male')}</FormLabel>
                      </FormItem>
                       <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="기타" />
                        </FormControl>
                        <FormLabel className="font-normal">{t('gender_other')}</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter>
              <Button type="button" variant="secondary" onClick={onClose}>{t('cancel_button')}</Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('save_button')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
