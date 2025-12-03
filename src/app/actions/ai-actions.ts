'use server';

import {
  aiMatchEnhancement,
  AIMatchEnhancementInput,
  AIMatchEnhancementOutput,
} from '@/ai/flows/ai-match-enhancement';
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
import { User } from '@/lib/types';

// The AI flow expects a specific input structure defined in AIMatchEnhancementInputSchema.
// We map our application's User type to this structure.
function mapUserToAIProfile(user: User) {
    return {
        userId: user.id,
        name: user.name,
        age: user.age,
        location: user.location,
        hobbies: user.hobbies,
        interests: user.interests,
    };
}


export async function getAIMatchAnalysis(
  input: { userProfile1: User, userProfile2: User }
): Promise<AIMatchEnhancementOutput> {
  try {
    const aiInput: AIMatchEnhancementInput = {
        userProfile1: mapUserToAIProfile(input.userProfile1),
        userProfile2: mapUserToAIProfile(input.userProfile2),
    };
    
    const result = await aiMatchEnhancement(aiInput);
    return result;
  } catch (error) {
    console.error('AI Match Enhancement failed:', error);
    throw new Error('Failed to get AI match analysis.');
  }
}

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
