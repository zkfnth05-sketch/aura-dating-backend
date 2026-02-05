
'use server';
/**
 * @fileOverview AI-powered date course recommendation flow.
 *
 * - recommendDateCourse - A function that takes user preferences and returns a recommended date course with images.
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
  targetLanguage: z.string().describe('The language for the date course.'),
});
export type DateCourseInput = z.infer<typeof DateCourseInputSchema>;

const DateCourseStepSchema = z.object({
    time: z.string().describe("The time for this step in the date course (e.g., '14:00')."),
    title: z.string().describe("The title of the activity for this step."),
    description: z.string().describe("A detailed description of the activity."),
    directions: z.string().describe("How to get there."),
    cost: z.string().describe("Estimated cost per person."),
    romanticTip: z.string().describe("A romantic tip to make the moment special."),
});

const DateCourseOutputSchema = z.object({
    title: z.string().describe("A catchy overall title for the date course."),
    totalCost: z.string().describe("A summary of the total estimated cost for the date."),
    steps: z.array(DateCourseStepSchema).describe("An array of detailed steps for the date course. Include at least 4-5 steps."),
    summaryAndMessage: z.string().describe("A final warm and encouraging summary message for the couple's date."),
    overallImagePrompt: z.string().describe("A single, short, descriptive prompt for an AI image generator to create one representative, photorealistic image for the entire date course. Example: 'A happy couple enjoying a romantic picnic in a park with Seoul skyline in the background'."),
});

export type DateCourseOutput = z.infer<typeof DateCourseOutputSchema> & {
    steps: z.infer<typeof DateCourseStepSchema>[];
    overallImageDataUri?: string;
};

function getSeason(dateString: string): string {
    const month = parseInt(dateString.split('-')[1], 10);
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
}

const dateCourseTextFlow = ai.defineFlow(
  {
    name: 'dateCourseTextFlow',
    inputSchema: DateCourseInputSchema,
    outputSchema: DateCourseOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `Create a date course JSON based on these preferences. The response must be in ${input.targetLanguage}.
- Destination: ${input.destination}
- People: ${input.partySize}
- Duration: ${input.duration}
- Date: ${input.date}
- Transportation: ${input.transportation}
- Budget: ${input.cost}
- Vibe: ${input.dateType}

The JSON should have a title, totalCost, steps (array of time, title, description, directions, cost, romanticTip), a summaryAndMessage, and an overallImagePrompt for the entire course. Do NOT include image prompts for individual steps.`,
      output: { schema: DateCourseOutputSchema },
      retries: 3,
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
        retries: 3,
      });
      return media?.url || '';
    } catch (error) {
      console.error('Image generation failed for prompt:', prompt, error);
      return '';
    }
  }
);


export async function recommendDateCourse(input: DateCourseInput): Promise<DateCourseOutput> {
  try {
      const textResult = await dateCourseTextFlow(input);
      const season = getSeason(input.date);

      const imagePrompt = `${textResult.overallImagePrompt}, photorealistic high quality image of a young Korean man and woman couple enjoying a date as the main focus, ${season}`;
      const imageDataUri = await dateCourseImageFlow(imagePrompt);

      return {
          ...textResult,
          steps: textResult.steps,
          overallImageDataUri: imageDataUri || undefined,
      };
  } catch (error) {
      console.error("AI date course recommendation failed, returning fallback.", error);
      // Return a fallback response
      return {
          title: "도심 속 힐링 데이트",
          totalCost: "약 5만원",
          summaryAndMessage: "AI 추천에 오류가 발생했지만, 이 로맨틱한 데이트로 즐거운 시간을 보내세요!",
          overallImagePrompt: "A couple enjoying coffee at a cafe",
          overallImageDataUri: "https://picsum.photos/seed/date/1280/720",
          steps: [
              {
                  time: "14:00",
                  title: "아늑한 카페에서 커피 한잔",
                  description: "분위기 좋은 카페에 앉아 담소를 나누며 데이트를 시작하세요.",
                  directions: "가까운 평점 좋은 카페 검색",
                  cost: "1인당 약 1만원",
                  romanticTip: "서로의 눈을 바라보며 이야기하는 시간을 가져보세요."
              },
              {
                  time: "16:00",
                  title: "공원 산책",
                  description: "가까운 공원을 찾아 손을 잡고 걸으며 여유를 만끽하세요.",
                  directions: "도보 5분",
                  cost: "무료",
                  romanticTip: "예쁜 꽃이나 풍경을 배경으로 함께 사진을 찍어보세요."
              }
          ]
      };
  }
}
