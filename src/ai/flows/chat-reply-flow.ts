
'use server';
/**
 * @fileOverview AI flow to generate chat reply suggestions.
 *
 * - getChatReplySuggestions - A function that takes conversation context and returns three reply suggestions.
 * - ChatReplyInput - The input type for the getChatReplySuggestions function.
 * - ChatReplyOutput - The return type for the getChatReplySuggestions function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const UserProfileSchema = z.object({
  name: z.string(),
  bio: z.string().optional(),
  hobbies: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
});

const MessageSchema = z.object({
  senderName: z.string(),
  text: z.string().optional(),
});

const ChatReplyInputSchema = z.object({
  currentUser: UserProfileSchema,
  matchUser: UserProfileSchema,
  messages: z.array(MessageSchema),
  targetLanguage: z.string().describe("The language for the reply suggestions."),
});
export type ChatReplyInput = z.infer<typeof ChatReplyInputSchema>;

const ChatReplyOutputSchema = z.object({
  suggestions: z.array(z.string()).length(3).describe("An array of three distinct, natural, and engaging chat reply suggestions in the requested language."),
});
export type ChatReplyOutput = z.infer<typeof ChatReplyOutputSchema>;

export async function getChatReplySuggestions(input: ChatReplyInput): Promise<ChatReplyOutput> {
  try {
    return await chatReplyFlow(input);
  } catch (error) {
    console.error("AI chat reply suggestion failed, returning fallback.", error);
    // Return a fallback response in case of an error
    return {
      suggestions: [
        "안녕하세요! 프로필 잘 봤어요. 저희 공통점이 많네요. 😊",
        "반가워요! 어떤 계기로 저희 앱을 사용하게 되셨어요?",
        "대화 나눠보고 싶어서 메시지 드려요. 좋은 하루 보내고 계신가요?"
      ]
    };
  }
}

const chatReplyFlow = ai.defineFlow(
  {
    name: 'chatReplyFlow',
    inputSchema: ChatReplyInputSchema,
    outputSchema: ChatReplyOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash'),
        prompt: `You are an expert dating coach AI. Your goal is to help your client, ${input.currentUser.name}, win the heart of their match, ${input.matchUser.name}, and successfully arrange a date. This is a dating app where the ultimate goal is to meet in person.

Analyze the user profiles and conversation history to generate three highly effective, charming, and strategic replies. The replies must be in ${input.targetLanguage}.

Your strategy should adapt to the conversation stage:
1.  **Early Stage (Getting to know each other):** Build rapport. Ask thoughtful questions about their profile, share common interests, and give genuine compliments.
2.  **Mid Stage (Building attraction):** Inject humor, wit, and a bit of flirtation. Create inside jokes. Hint at future activities you could do together (e.g., "We should go there sometime!").
3.  **Late Stage (Moving towards a date):** If the vibe is right, suggest a specific, low-pressure date idea that connects to your shared interests. Make it easy for them to say yes.

My Profile (${input.currentUser.name}):
- Bio: ${input.currentUser.bio || '소개 없음'}
- Hobbies: ${(input.currentUser.hobbies || []).join(', ')}
- Interests: ${(input.currentUser.interests || []).join(', ')}

Their Profile (${input.matchUser.name}):
- Bio: ${input.matchUser.bio || '소개 없음'}
- Hobbies: ${(input.matchUser.hobbies || []).join(', ')}
- Interests: ${(input.matchUser.interests || []).join(', ')}

Conversation History (most recent last):
${input.messages.map(m => `${m.senderName}: ${m.text || '[음성 메시지]'}`).join('\n')}

Based on this context, generate three distinct and strategic reply suggestions for ${input.currentUser.name} to send. The suggestions should be short, impactful, and designed to move the relationship forward.
`,
        output: { schema: ChatReplyOutputSchema },
    });
    return output!;
  }
);
