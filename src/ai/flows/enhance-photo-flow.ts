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
    let specificInstruction = '';
    if (gender === '여성') {
        specificInstruction = 'Make the woman in the photo very beautiful. ';
    } else if (gender === '남성') {
        specificInstruction = 'Make the man in the photo very handsome. ';
    }

    return `${specificInstruction}Enhance this user's profile picture for a high-end dating app. Improve the lighting and composition to make the person look more stylish, sexy, have a balanced body, confident, and attractive. Give the photo a polished, professional, and slightly more glamorous feel, while ensuring the person's core features remain recognizable. Make them look their absolute best. The output must be a photorealistic image.`;
};


const enhancePhotoFlow = ai.defineFlow(
  {
    name: 'enhancePhotoFlow',
    inputSchema: EnhancePhotoInputSchema,
    outputSchema: EnhancePhotoOutputSchema,
  },
  async (input) => {
    const enhancementPrompt = generateEnhancementPrompt(input.gender);
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
