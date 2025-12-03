'use server';
/**
 * @fileOverview AI flow to generate chat reply suggestions.
 *
 * - getChatReplySuggestions - A function that takes conversation context and returns three reply suggestions.
 * - ChatReplyInput - The input type for the getChatReplySuggestions function.
 * - ChatReplyOutput - The return type for the getChatReplySuggestions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const UserProfileSchema = z.object({
  name: z.string(),
  bio: z.string(),
  hobbies: z.array(z.string()),
  interests: z.array(z.string()),
});

const MessageSchema = z.object({
  senderName: z.string(),
  text: z.string(),
});

const ChatReplyInputSchema = z.object({
  currentUser: UserProfileSchema,
  matchUser: UserProfileSchema,
  messages: z.array(MessageSchema),
});
export type ChatReplyInput = z.infer<typeof ChatReplyInputSchema>;

const ChatReplyOutputSchema = z.object({
  suggestions: z.array(z.string()).length(3).describe("An array of three distinct, natural, and engaging chat reply suggestions in Korean."),
});
export type ChatReplyOutput = z.infer<typeof ChatReplyOutputSchema>;

export async function getChatReplySuggestions(input: ChatReplyInput): Promise<ChatReplyOutput> {
  return chatReplyFlow(input);
}

const chatReplyFlow = ai.defineFlow(
  {
    name: 'chatReplyFlow',
    inputSchema: ChatReplyInputSchema,
    outputSchema: ChatReplyOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
        prompt: `You are an AI dating assistant for a user named ${input.currentUser.name}. Your task is to generate three engaging and natural-sounding replies to a conversation. The replies must be in Korean.

Consider the profiles of both users and the recent conversation history to make the suggestions relevant, interesting, and likely to continue the conversation. The tone should be friendly, and slightly flirty or humorous where appropriate.

My Profile (${input.currentUser.name}):
- Bio: ${input.currentUser.bio}
- Hobbies: ${input.currentUser.hobbies.join(', ')}
- Interests: ${input.currentUser.interests.join(', ')}

Their Profile (${input.matchUser.name}):
- Bio: ${input.matchUser.bio}
- Hobbies: ${input.matchUser.hobbies.join(', ')}
- Interests: ${input.matchUser.interests.join(', ')}

Conversation History (most recent last):
${input.messages.map(m => `${m.senderName}: ${m.text}`).join('\n')}

Based on this context, generate three distinct reply suggestions for ${input.currentUser.name} to send. The suggestions should be short, single-sentence replies.
`,
        output: { schema: ChatReplyOutputSchema },
    });
    return output!;
  }
);
