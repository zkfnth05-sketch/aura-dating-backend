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


export async function recommendDateCourse(input: DateCourseInput): Promise<DateCourseOutput> {
    const textResult = await dateCourseFlow(input);

    const imagePromises = textResult.steps.map(async (step) => {
        try {
            const { media } = await ai.generate({
                model: 'googleai/imagen-4.0-fast-generate-001',
                prompt: `${step.imagePrompt}, photorealistic, high quality`,
            });
            return {
                ...step,
                imageDataUri: media?.url,
            };
        } catch (error) {
            console.error(`Image generation failed for step: ${step.title}`, error);
            // In case of an error, return the step without an image
            return {
                ...step,
                imageDataUri: undefined,
            };
        }
    });

    const stepsWithImages = await Promise.all(imagePromises);

    return {
        ...textResult,
        steps: stepsWithImages,
    };
}


const prompt = ai.definePrompt({
  name: 'dateCourseTextPrompt',
  input: { schema: DateCourseInputSchema },
  output: { schema: DateCourseOutputSchema },
  prompt: `You are an expert date planner. Based on the user's preferences, create a perfect and detailed date course.
The response must be in Korean.

User Preferences:
- Destination/Atmosphere: {{{destination}}}
- Number of People: {{{partySize}}}
- Duration: {{{duration}}}
- Date: {{{date}}}
- Transportation: {{{transportation}}}
- Budget per person: {{{cost}}}
- Preferred Date Type: {{{dateType}}}

Please provide a detailed plan. The output must be a JSON object that follows the specified schema.
- Create a catchy overall title for the date course.
- Create at least 4-5 timeline entries in the 'steps' array.
- For each step, provide all the required fields: 'time', 'title', 'description', 'directions', 'cost', 'romanticTip', and a suitable 'imagePrompt'.
- Conclude with a summary of the total estimated cost in the 'totalCost' field.
- Finally, create a warm and encouraging summary message for the couple in the 'summaryAndMessage' field. This message should be a few sentences long and wish them a wonderful date.

Example for one step object in the array:
{
  "time": "21:00",
  "title": "야경이 보이는 루프탑 바",
  "description": "빛나는 도시 야경을 배경으로 달콤한 칵테일을 즐기며 하루를 마무리하는 시간입니다. 눈부신 야경처럼 두 분의 사랑도 영원히 빛나길 바랍니다.",
  "directions": "레스토랑에서 택시로 10분 거리에 있는 '더 그리핀' 바",
  "cost": "1인당 30,000원",
  "romanticTip": "서로에게 오늘 하루 중 가장 좋았던 순간을 이야기해주고, 다음 데이트를 기약하는 설레는 대화를 나눠보세요.",
  "imagePrompt": "A couple enjoying cocktails at a glamorous rooftop bar at night, with a sparkling city skyline in the background."
}

Generate the entire course now based on the user's preferences.`,
});


const dateCourseFlow = ai.defineFlow(
  {
    name: 'dateCourseTextFlow',
    inputSchema: DateCourseInputSchema,
    outputSchema: DateCourseOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
