'use server';
/**
 * @fileOverview AI flow to generate a recommendation reason between two users.
 *
 * - getRecommendationReason - A function that takes two user profiles and returns a reason why they are a good match.
 * - RecommendationReasonInput - The input type for the getRecommendationReason function.
 * - RecommendationReasonOutput - The return type for the getRecommendationReason function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const UserProfileSchema = z.object({
  name: z.string(),
  age: z.number(),
  bio: z.string(),
  hobbies: z.array(z.string()),
  interests: z.array(z.string()),
  values: z.array(z.string()).optional(),
  communication: z.array(z.string()).optional(),
  lifestyle: z.array(z.string()).optional(),
});

const RecommendationReasonInputSchema = z.object({
  currentUser: UserProfileSchema,
  potentialMatch: UserProfileSchema,
});
export type RecommendationReasonInput = z.infer<typeof RecommendationReasonInputSchema>;

const RecommendationReasonOutputSchema = z.object({
  reason: z.string().describe("A personalized and compelling reason, in Korean, explaining why the two users are a good match, based on their shared interests, hobbies, and values. The tone should be friendly and encouraging."),
});
export type RecommendationReasonOutput = z.infer<typeof RecommendationReasonOutputSchema>;

export async function getRecommendationReason(input: RecommendationReasonInput): Promise<RecommendationReasonOutput> {
  return recommendationReasonFlow(input);
}

const recommendationReasonFlow = ai.defineFlow(
  {
    name: 'recommendationReasonFlow',
    inputSchema: RecommendationReasonInputSchema,
    outputSchema: RecommendationReasonOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
        model: 'gemini-1.5-flash-latest',
        prompt: `You are an AI dating assistant. Your task is to explain why two people would be a good match based on their profiles.
The explanation must be in Korean. Be specific, warm, and encouraging. Highlight 2-3 key commonalities.

User 1 Profile (${input.currentUser.name}):
- Bio: ${input.currentUser.bio}
- Hobbies: ${input.currentUser.hobbies.join(', ')}
- Interests: ${input.currentUser.interests.join(', ')}
- Values: ${input.currentUser.values?.join(', ') || 'Not specified'}
- Lifestyle: ${input.currentUser.lifestyle?.join(', ') || 'Not specified'}

User 2 Profile (${input.potentialMatch.name}):
- Bio: ${input.potentialMatch.bio}
- Hobbies: ${input.potentialMatch.hobbies.join(', ')}
- Interests: ${input.potentialMatch.interests.join(', ')}
- Values: ${input.potentialMatch.values?.join(', ') || 'Not specified'}
- Lifestyle: ${input.potentialMatch.lifestyle?.join(', ') || 'Not specified'}

Based on these profiles, generate a compelling reason for why they should connect.
Example Output:
{
  "reason": "${input.potentialMatch.name}님과 ${input.currentUser.name}님은 '음악 감상'과 '영화 감상'이라는 공통된 취미를 가지고 있어, 함께 문화생활을 즐기며 즐거운 시간을 보낼 수 있을 거예요. 두 분 모두 '진솔함'을 중요하게 생각하는 만큼, 깊고 의미 있는 대화를 나눌 수 있는 관계로 발전할 가능성이 높습니다. 새로운 인연을 시작해보는 건 어떠신가요?"
}
`,
        output: { schema: RecommendationReasonOutputSchema },
    });
    return output!;
  }
);
