'use server';
/**
 * @fileOverview An AI flow for enhancing user profile photos.
 *
 * - enhancePhoto - A function that takes a photo and gender, and returns an enhanced photo.
 * - EnhancePhotoInput - The input type for the enhancePhoto function.
 * - EnhancePhotoOutput - The return type for the enhancePhoto function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EnhancePhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
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

const malePrompt = `Enhance the photo to make the man look more handsome and cool. Give him a more voluminous, well-balanced, and attractive body. The output must be a photorealistic image.`;
const femalePrompt = `Enhance the photo to make the woman's face prettier and sexier with smoother skin. Give her a more voluminous, well-balanced, and sexy body. The output must be a photorealistic image.`;
const otherPrompt = `Enhance the photo to make the person look more attractive. The output must be a photorealistic image.`;

const enhancePhotoFlow = ai.defineFlow(
  {
    name: 'enhancePhotoFlow',
    inputSchema: EnhancePhotoInputSchema,
    outputSchema: EnhancePhotoOutputSchema,
  },
  async (input) => {
    let enhancementInstruction = '';
    if (input.gender === '남성') {
        enhancementInstruction = malePrompt;
    } else if (input.gender === '여성') {
        enhancementInstruction = femalePrompt;
    } else {
        enhancementInstruction = otherPrompt;
    }

    const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
            { media: { url: input.photoDataUri } },
            { text: enhancementInstruction },
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
