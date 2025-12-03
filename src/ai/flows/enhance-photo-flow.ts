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

const EnhancePhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  // Gender is no longer needed for the new prompt but we keep it in the schema 
  // to avoid breaking the calling component for now.
  // It can be removed in a future refactor.
  gender: z.enum(['남성', '여성', '기타']).describe('The gender of the user in the photo.'),
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

const enhancementPrompt = `고급 데이팅 앱에 어울리도록 조명과 구성을 개선하여 더 스타일리시하고, 자신감 있고, 성적으로 매력적이고, 균형있는,섹시한,매력적으로 보이게 하되, 본래의 주요 특징은 유지하면서 최고의 모습으로 만들어주세요. The output must be a photorealistic image.`;


const enhancePhotoFlow = ai.defineFlow(
  {
    name: 'enhancePhotoFlow',
    inputSchema: EnhancePhotoInputSchema,
    outputSchema: EnhancePhotoOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
            { media: { url: input.photoDataUri } },
            { text: enhancementPrompt },
        ],
        config: {
            responseModalities: ['IMAGE'],
        },
    });

    if (!media || !media.url) {
        throw new Error('Image enhancement failed to produce an image.');
    }

    return {
        enhancedPhotoDataUri: media.url,
    };
  }
);
