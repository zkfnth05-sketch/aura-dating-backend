
'use server';
/**
 * @fileOverview AI-powered date course recommendation flow.
 *
 * - recommendDateCourse - A function that takes user preferences and returns a recommended date course.
 * - streamDateCourse - A function that streams the date course recommendation.
 * - DateCourseInput - The input type for the recommendDateCourse function.
 * - DateCourseOutput - The return type for the recommendDateCourse function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const DateCourseInputSchema = z.object({
  destination: z.string().describe('The desired travel destination or atmosphere.'),
  partySize: z.string().describe('The number of people for the date.'),
  duration: z.string().describe('The duration of the date.'),
  date: z.string().describe('The date of the date.'),
  transportation: z.string().describe('The mode of transportation.'),
  cost: z.string().describe('The budget per person for the date.'),
  dateType: z.string().describe('The preferred type of date.'),
});
export type DateCourseInput = z.infer<typeof DateCourseInputSchema>;

const DateCourseStepSchema = z.object({
    time: z.string().describe("The time for this step in the date course (e.g., '14:00')."),
    title: z.string().describe("The title of the activity for this step."),
    description: z.string().describe("A detailed description of the activity."),
    directions: z.string().describe("How to get there."),
    cost: z.string().describe("Estimated cost per person."),
    romanticTip: z.string().describe("A romantic tip to make the moment special."),
    imagePrompt: z.string().describe("A short, descriptive prompt for an AI image generator to create a relevant, photorealistic image for this activity. Example: 'A cozy cafe with warm lighting' or 'A couple walking on a beach at sunset'."),
});

const DateCourseOutputSchema = z.object({
    title: z.string().describe("A catchy overall title for the date course."),
    totalCost: z.string().describe("A summary of the total estimated cost for the date."),
    steps: z.array(DateCourseStepSchema).describe("An array of detailed steps for the date course. Include at least 4-5 steps."),
    summaryAndMessage: z.string().describe("A final warm and encouraging summary message for the couple's date."),
});

export type DateCourseOutput = z.infer<typeof DateCourseOutputSchema> & {
    steps: (z.infer<typeof DateCourseStepSchema> & { imageDataUri?: string })[];
};

function getSeason(dateString: string): string {
    const month = parseInt(dateString.split('-')[1], 10);
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
}

export const streamDateCourse = ai.defineFlow(
  {
    name: 'streamDateCourse',
    inputSchema: DateCourseInputSchema,
  },
  async function* (input) {
    const { stream } = await ai.generateStream({
        model: googleAI.model('gemini-2.5-flash'),
        prompt: `Based on the user's preferences, create a perfect and detailed date course in Korean, formatted as Markdown.
User Preferences:
- Destination/Atmosphere: ${input.destination}
- People: ${input.partySize}
- Duration: ${input.duration}
- Date: ${input.date}
- Transportation: ${input.transportation}
- Budget: ${input.cost}
- Vibe: ${input.dateType}
The Markdown should include a main title, several steps with time/title/description/directions/cost/tip, a total cost summary, and a final message.`,
    });
    
    for await (const chunk of stream) {
        if (chunk.text) {
          yield chunk.text;
        }
    }
  }
);

// This function is kept for potential non-streaming use or for image generation logic, but the streaming flow is now the primary way.
const dateCourseTextFlow = ai.defineFlow(
  {
    name: 'dateCourseTextFlow',
    inputSchema: DateCourseInputSchema,
    outputSchema: DateCourseOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `Create a date course JSON based on these preferences. The response must be in Korean.
- Destination: ${input.destination}
- People: ${input.partySize}
- Duration: ${input.duration}
- Date: ${input.date}
- Transportation: ${input.transportation}
- Budget: ${input.cost}
- Vibe: ${input.dateType}

The JSON should have a title, totalCost, steps (array of time, title, description, directions, cost, romanticTip, imagePrompt), and a summaryAndMessage.`,
      output: { schema: DateCourseOutputSchema },
    });
    return output!;
  }
);

const dateCourseImageFlow = ai.defineFlow(
  {
    name: 'dateCourseImageFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    try {
      if (!prompt) return '';
      const { media } = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: prompt,
      });
      return media?.url || '';
    } catch (error) {
      console.error('Image generation failed for prompt:', prompt, error);
      return '';
    }
  }
);


export async function recommendDateCourse(input: DateCourseInput): Promise<DateCourseOutput> {
    const textResult = await dateCourseTextFlow(input);
    const season = getSeason(input.date);

    const imagePromises = textResult.steps.map(step => {
        const imagePrompt = `${step.imagePrompt}, young Korean couple in their 20s-30s, ${season}, photorealistic, high quality`;
        return dateCourseImageFlow(imagePrompt);
    });

    const imageDataUris = await Promise.all(imagePromises);

    const stepsWithImages = textResult.steps.map((step, index) => ({
        ...step,
        imageDataUri: imageDataUris[index] || undefined,
    }));

    return {
        ...textResult,
        steps: stepsWithImages,
    };
}
