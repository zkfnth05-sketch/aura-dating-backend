
'use server';
/**
 * @fileOverview AI flow for transcribing and translating audio messages.
 *
 * - getAudioTranslation - A function that takes an audio file URL and returns the translated text.
 * - AudioTranslationInput - The input type for the getAudioTranslation function.
 * - AudioTranslationOutput - The return type for the getAudioTranslation function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const AudioTranslationInputSchema = z.object({
  audioUrl: z.string().describe('The URL of the audio message.'),
  targetLanguage: z.string().describe("The target language for translation (e.g., 'Korean', 'English')."),
});
export type AudioTranslationInput = z.infer<typeof AudioTranslationInputSchema>;

const AudioTranslationOutputSchema = z.object({
  translatedText: z.string().describe('The translated text from the audio.'),
});
export type AudioTranslationOutput = z.infer<typeof AudioTranslationOutputSchema>;

export async function getAudioTranslation(input: AudioTranslationInput): Promise<AudioTranslationOutput> {
    return transcribeAndTranslateAudioFlow(input);
}

const transcribeAndTranslateAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAndTranslateAudioFlow',
    inputSchema: AudioTranslationInputSchema,
    outputSchema: AudioTranslationOutputSchema,
  },
  async (input) => {
    // 1. Fetch audio from URL and convert to data URI
    const response = await fetch(input.audioUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch audio file: ${response.statusText}`);
    }
    const audioBuffer = await response.arrayBuffer();
    const mimeType = response.headers.get('content-type') || 'audio/webm';
    const audioDataUri = `data:${mimeType};base64,${Buffer.from(audioBuffer).toString('base64')}`;
    
    // 2. Transcribe and Translate in one step.
    const { output } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash'), // Using flash for speed and multimodality
        prompt: [
            { text: `First, transcribe the provided audio recording. Second, translate the transcribed text into ${input.targetLanguage}. Provide ONLY the final translated text.` },
            { media: { url: audioDataUri, contentType: mimeType } }
        ],
        output: { schema: AudioTranslationOutputSchema },
        retries: 2,
    });
    
    return output!;
  }
);
