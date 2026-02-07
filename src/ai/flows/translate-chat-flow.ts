
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
  try {
    return await translateChatFlow(input);
  } catch (error) {
    console.error("AI chat translation failed, returning empty translation.", error);
    // Return a fallback response with an empty string.
    // The calling code is designed to handle this by not including a translation.
    return { translatedText: "" };
  }
}

const translateChatFlow = ai.defineFlow(
  {
    name: 'translateChatFlow',
    inputSchema: TranslateChatInputSchema,
    outputSchema: TranslateChatOutputSchema,
  },
  async (input) => {
    // Reverted to gemini-2.5-flash. While gemini-1.5-flash-latest is cost-effective,
    // gemini-2.5-flash provides better reliability for structured JSON output, which is crucial for this flow.
    // This model still offers a great balance of performance and cost.
    const { output } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash'),
        prompt: `You are a translation agent. Your task is to translate the given text into the specified target language.
Your response MUST be a valid JSON object that conforms to the provided schema, containing only the translated text. Do not include any extra explanations, formatting, or markdown.

Target Language: ${input.targetLanguage}
Text to translate: "${input.text}"`,
        output: { schema: TranslateChatOutputSchema },
        retries: 2, // Add retries for robustness
    });
    
    // If the model fails to produce valid output, it will throw an error which is caught by the calling function.
    return output!;
  }
);
