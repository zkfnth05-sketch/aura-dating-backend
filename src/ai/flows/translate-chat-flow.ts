
'use server';
/**
 * @fileOverview AI flow for real-time, cost-effective chat message translation.
 *
 * - translateChatText - A function that takes text and a target language, returning the translated text.
 * - TranslateChatInput - The input type for the translateChatText function.
 * - TranslateChatOutput - The return type for the translateChatText function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const TranslateChatInputSchema = z.object({
  text: z.string().describe('The chat message text to translate.'),
  targetLanguage: z.string().describe("The target language for translation (e.g., 'Korean', 'English', 'Spanish')."),
});
export type TranslateChatInput = z.infer<typeof TranslateChatInputSchema>;

const TranslateChatOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateChatOutput = z.infer<typeof TranslateChatOutputSchema>;

export async function translateChatText(input: TranslateChatInput): Promise<TranslateChatOutput> {
  return translateChatFlow(input);
}

const translateChatFlow = ai.defineFlow(
  {
    name: 'translateChatFlow',
    inputSchema: TranslateChatInputSchema,
    outputSchema: TranslateChatOutputSchema,
  },
  async (input) => {
    // Using gemini-1.5-flash-latest as it is highly cost-effective for simple translation tasks.
    const { output } = await ai.generate({
        model: googleAI.model('gemini-1.5-flash-latest'),
        prompt: `You are a translation agent. Your task is to translate the given text into the specified target language.
Your response MUST be a valid JSON object that conforms to the provided schema, containing only the translated text. Do not include any extra explanations, formatting, or markdown.

Target Language: ${input.targetLanguage}
Text to translate: "${input.text}"`,
        output: { schema: TranslateChatOutputSchema },
        retries: 2, // Add retries for robustness
    });
    
    // If the model fails to produce valid output, it will throw an error which is caught by the Server Action.
    // We expect the calling function to handle this gracefully.
    return output!;
  }
);
