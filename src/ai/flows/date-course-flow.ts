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
- Budget per person: {{{cost}}}
- Preferred Date Type: {{{dateType}}}

Please provide a detailed plan with the following structure for each timeline entry in Markdown:

- A catchy overall title for the date course.
- For each timeline entry, provide:
  - Time and Title (e.g., ### 14:00 - 아늑한 카페에서 여유로운 시작)
  - A placeholder image URL from unsplash. It should be relevant to the activity. Format: ![Description](https://images.unsplash.com/...)
  - A detailed description of the activity.
  - **찾아가는 길**: How to get there.
  - **예상 비용**: Estimated cost per person.
  - **💖 로맨틱 팁**: A romantic tip to make the moment special.
- Include at least 4-5 timeline entries.
- Conclude with a summary of the total estimated cost.

Example for one timeline entry:

### 21:00 - 야경이 보이는 루프탑 바 또는 로맨틱 디저트 카페
![루프탑 바](https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800)
빛나는 도시 야경을 배경으로 달콤한 칵테일이나 맛있는 디저트를 즐기며, 서로에게 속삭이듯 하루를 마무리하는 시간입니다. 눈부신 야경처럼 두 분의 사랑도 영원히 빛나길 바랍니다.

**찾아가는 길**: 레스토랑에서 택시나 대중교통으로 이동 가능한 거리에 있는, 야경이 아름다운 루프탑 바나 아늑하고 특별한 디저트 카페를 찾아보세요.

**예상 비용**: 1인당 20,000원 ~ 40,000원 (칵테일/음료 및 디저트 포함)

**💖 로맨틱 팁**: 서로에게 오늘 하루 중 가장 좋았던 순간을 이야기해주고, 다음 데이트를 기약하는 설레는 대화를 나눠보세요. 작은 약속들이 쌓여 큰 행복이 될 거예요.

Generate the entire course now based on the user's preferences.`,
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
