'use server';

/**
 * @fileOverview AI-powered match enhancement flow for suggesting potential matches based on shared interests and hobbies.
 *
 * - aiMatchEnhancement - A function that takes two user profiles as input and returns an analysis of their compatibility.
 * - AIMatchEnhancementInput - The input type for the aiMatchEnhancement function, representing two user profiles.
 * - AIMatchEnhancementOutput - The output type for the aiMatchEnhancement function, providing an analysis of their compatibility.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UserProfileSchema = z.object({
  userId: z.string().describe('Unique identifier for the user.'),
  name: z.string().describe('User name.'),
  age: z.number().describe('User age.'),
  location: z.string().describe('User location.'),
  hobbies: z.array(z.string()).describe('List of user hobbies.'),
  interests: z.array(z.string()).describe('List of user interests.'),
});

const AIMatchEnhancementInputSchema = z.object({
  userProfile1: UserProfileSchema.describe('The profile of the first user.'),
  userProfile2: UserProfileSchema.describe('The profile of the second user.'),
});

export type AIMatchEnhancementInput = z.infer<typeof AIMatchEnhancementInputSchema>;

const AIMatchEnhancementOutputSchema = z.object({
  compatibilityScore: z.number().describe('A score indicating the compatibility between the two users (0-100).'),
  sharedHobbies: z.array(z.string()).describe('List of shared hobbies between the two users.'),
  sharedInterests: z.array(z.string()).describe('List of shared interests between the two users.'),
  analysis: z.string().describe('A detailed analysis of the potential match, highlighting strengths and weaknesses.'),
  recommendInclude: z.boolean().describe('A recommendation whether or not to include these users as a potential match'),
});

export type AIMatchEnhancementOutput = z.infer<typeof AIMatchEnhancementOutputSchema>;

export async function aiMatchEnhancement(input: AIMatchEnhancementInput): Promise<AIMatchEnhancementOutput> {
  return aiMatchEnhancementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiMatchEnhancementPrompt',
  input: {schema: AIMatchEnhancementInputSchema},
  output: {schema: AIMatchEnhancementOutputSchema},
  prompt: `You are an AI dating matchmaker. You will analyze two user profiles and determine if they are a good match.
Your response must be in Korean.

User 1 Profile:
Name: {{{userProfile1.name}}}
Age: {{{userProfile1.age}}}
Location: {{{userProfile1.location}}}
Hobbies: {{#each userProfile1.hobbies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Interests: {{#each userProfile1.interests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

User 2 Profile:
Name: {{{userProfile2.name}}}
Age: {{{userProfile2.age}}}
Location: {{{userProfile2.location}}}
Hobbies: {{#each userProfile2.hobbies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Interests: {{#each userProfile2.interests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Analyze their profiles based on hobbies and interests, and provide a compatibility score between 0 and 100.
Also, generate a detailed analysis of the potential match, highlighting the strengths and weaknesses.
Finally, provide a boolean value recommendInclude, which suggests whether or not to include these users as a potential match. Set this to true if the compatibility score is above 60.

Output in JSON format as described by the schema. All text in the output must be in Korean.`,
});

const aiMatchEnhancementFlow = ai.defineFlow(
  {
    name: 'aiMatchEnhancementFlow',
    inputSchema: AIMatchEnhancementInputSchema,
    outputSchema: AIMatchEnhancementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
