
'use server';
/**
 * @fileOverview An AI flow for enhancing user profile photos.
 *
 * - enhancePhoto - A function that takes a photo and returns an enhanced photo.
 * - EnhancePhotoInput - The input type for the enhancePhoto function.
 * - EnhancePhotoOutput - The return type for the enhancePhoto function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {googleAI} from '@genkit-ai/google-genai';

const EnhancePhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
    gender: z.enum(['남성', '여성', '기타']).describe('The gender of the user.'),
});
export type EnhancePhotoInput = z.infer<typeof EnhancePhotoInputSchema>;

const EnhancePhotoOutputSchema = z.object({
    enhancedPhotoDataUri: z
    .string()
    .describe(
      "The enhanced photo as a data URI, including a MIME type and Base64 encoding."
    ),
});
export type EnhancePhotoOutput = z.infer<typeof EnhancePhotoOutputSchema>;

export async function enhancePhoto(input: EnhancePhotoInput): Promise<EnhancePhotoOutput> {
  return enhancePhotoFlow(input);
}

const generateEnhancementPrompt = (gender: '남성' | '여성' | '기타') => {
    let basePrompt = "이 사용자의 프로필 사진을 고급 데이팅 앱에 맞게 보정해 주세요. 조명과 구도를 개선하여 사람을 더 스타일리시하고, 자신감 넘치며, 매력적으로 보이게 만들어 주세요. 사용자의 본래 이목구비(핵심 특징)는 그대로 유지하면서, 사진에 세련되고 전문적이며 아주 화려함과 고급스러움을 더해 주세요. 그들의 모습이 가장 돋보이도록 만들어 주세요. The output must be a photorealistic image.";
    
    let genderSpecificInstruction = '';
    if (gender === '여성') {
        genderSpecificInstruction = '여자의 얼굴은 아주 섹시하고 아름답게, 몸매는 아주 볼륨 있고 매력적으로 만들어주세요.';
    } else if (gender === '남성') {
        genderSpecificInstruction = '남자의 얼굴을 아주 핸섬하고 스타일리시하게 만들어주세요.';
    }

    return `${genderSpecificInstruction} ${basePrompt}`;
};


const enhancePhotoFlow = ai.defineFlow(
  {
    name: 'enhancePhotoFlow',
    inputSchema: EnhancePhotoInputSchema,
    outputSchema: EnhancePhotoOutputSchema,
  },
  async (input) => {
    const enhancementPrompt = generateEnhancementPrompt(input.gender);
    
    try {
        const { media } = await ai.generate({
            model: googleAI.model('imagen-3.0-generate-001'),
            prompt: [
                { text: enhancementPrompt },
                { media: { url: input.photoDataUri } },
            ],
            config: {
                responseModalities: ['IMAGE'],
                safetySettings: [
                  {
                    category: 'HARM_CATEGORY_HATE_SPEECH',
                    threshold: 'BLOCK_ONLY_HIGH',
                  },
                  {
                    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    threshold: 'BLOCK_NONE',
                  },
                  {
                    category: 'HARM_CATEGORY_HARASSMENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                  },
                  {
                    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                  },
                ],
            },
            retries: 3,
        });

        if (media && media.url) {
            return {
                enhancedPhotoDataUri: media.url,
            };
        }
        
        throw new Error("AI photo enhancement did not return a valid image.");
    } catch (error) {
        console.error("AI photo enhancement failed in flow:", error);
        throw error;
    }
  }
);
