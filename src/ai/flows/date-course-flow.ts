'use server';
/**
 * @fileOverview AI-powered date course recommendation flow.
 *
 * - recommendDateCourse - A function that takes user preferences and returns a recommended date course.
 * - DateCourseInput - The input type for the recommendDateCourse function.
 * - DateCourseOutput - The return type for the recommendDateCourse function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const DateCourseInputSchema = z.object({
  destination: z.string().describe('The desired travel destination or atmosphere.'),
  partySize: z.string().describe('The number of people for the date.'),
  duration: z.string().describe('The duration of the date.'),
  date: z.string().describe('The date of the date.'),
  transportation: z.string().describe('The mode of transportation.'),
});
export type DateCourseInput = z.infer<typeof DateCourseInputSchema>;

const DateCourseOutputSchema = z.object({
  recommendation: z.string().describe('The detailed date course recommendation, including places to visit, activities, and a timeline. The response must be in Markdown format.'),
});
export type DateCourseOutput = z.infer<typeof DateCourseOutputSchema>;


export async function recommendDateCourse(input: DateCourseInput): Promise<DateCourseOutput> {
    return dateCourseFlow(input);
}


const prompt = ai.definePrompt({
  name: 'dateCoursePrompt',
  input: { schema: DateCourseInputSchema },
  output: { schema: DateCourseOutputSchema },
  prompt: `You are an expert date planner. Based on the user's preferences, create a perfect and detailed date course.
The response must be in Korean and formatted in Markdown.

User Preferences:
- Destination/Atmosphere: {{{destination}}}
- Number of People: {{{partySize}}}
- Duration: {{{duration}}}
- Date: {{{date}}}
- Transportation: {{{transportation}}}

Please provide a detailed plan including:
- A catchy title for the date course.
- A timeline with specific activities and locations.
- Recommendations for restaurants or cafes if applicable.
- Any other tips to make the date special.

Generate the response in Markdown format.`,
});


const dateCourseFlow = ai.defineFlow(
  {
    name: 'dateCourseFlow',
    inputSchema: DateCourseInputSchema,
    outputSchema: DateCourseOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
