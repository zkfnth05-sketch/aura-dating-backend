'use server';

import {
    enhancePhoto,
    EnhancePhotoInput,
    EnhancePhotoOutput,
} from '@/ai/flows/enhance-photo-flow';
import {
    recommendDateCourse,
    DateCourseInput,
    DateCourseOutput,
} from '@/ai/flows/date-course-flow';

export async function getEnhancedPhoto(
    input: EnhancePhotoInput
  ): Promise<EnhancePhotoOutput> {
    try {
      const result = await enhancePhoto(input);
      return result;
    } catch (error) {
      console.error('AI Photo Enhancement failed:', error);
      throw new Error('Failed to get AI photo enhancement.');
    }
  }

export async function getDateCourse(
    input: DateCourseInput
    ): Promise<DateCourseOutput> {
    try {
        const result = await recommendDateCourse(input);
        return result;
    } catch (error) {
        console.error('AI Date Course recommendation failed:', error);
        throw new Error('Failed to get AI date course recommendation.');
    }
}
