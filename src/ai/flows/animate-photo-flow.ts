'use server';
/**
 * @fileOverview An AI flow for animating a user's profile photo.
 *
 * - animatePhoto - A function that takes a photo and a prompt and generates a video.
 * - AnimatePhotoInput - The input type for the animatePhoto function.
 * - AnimatePhotoOutput - The return type for the animatePhoto function.
 */
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const AnimatePhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z.string().describe("A text prompt to guide the video generation."),
});
export type AnimatePhotoInput = z.infer<typeof AnimatePhotoInputSchema>;

const AnimatePhotoOutputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "The generated video as a data URI, including a MIME type and Base64 encoding."
    ),
});
export type AnimatePhotoOutput = z.infer<typeof AnimatePhotoOutputSchema>;

export async function animatePhoto(input: AnimatePhotoInput): Promise<AnimatePhotoOutput> {
  return animatePhotoFlow(input);
}

const animatePhotoFlow = ai.defineFlow(
  {
    name: 'animatePhotoFlow',
    inputSchema: AnimatePhotoInputSchema,
    outputSchema: AnimatePhotoOutputSchema,
  },
  async (input) => {
    // Check if the API key is available in the environment, which is required for fetching the generated video.
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is not set. This is required to download the generated video.");
    }

    // Start the video generation operation
    const { operation } = await ai.generate({
        model: googleAI.model('veo-2.0-generate-001'),
        prompt: [
            { text: input.prompt },
            { media: { url: input.photoDataUri } },
        ],
        config: {
            durationSeconds: 5,
            aspectRatio: '9:16', // Portrait for profile videos
            personGeneration: 'allow_adult',
        },
    });

    if (!operation) {
        throw new Error('Video generation operation did not start.');
    }

    // Poll for the result of the long-running operation
    let polledOperation = operation;
    while (!polledOperation.done) {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds between checks
        polledOperation = await ai.checkOperation(polledOperation);
    }

    if (polledOperation.error) {
        throw new Error(`Video generation failed: ${polledOperation.error.message}`);
    }

    const videoPart = polledOperation.output?.message?.content.find((p) => !!p.media);
    if (!videoPart || !videoPart.media?.url) {
        throw new Error('Failed to find the generated video in the operation output.');
    }
    
    // The media URL is temporary and requires the API key to download.
    const videoDownloadResponse = await fetch(
        `${videoPart.media.url}&key=${process.env.GEMINI_API_KEY}`
    );

    if (!videoDownloadResponse.ok) {
        throw new Error(`Failed to download generated video: ${videoDownloadResponse.statusText}`);
    }
    
    // Convert the downloaded video into a base64 data URI
    const videoBuffer = await videoDownloadResponse.arrayBuffer();
    const buffer = Buffer.from(videoBuffer);
    const base64Video = buffer.toString('base64');
    
    return {
        videoDataUri: `data:video/mp4;base64,${base64Video}`,
    };
  }
);
