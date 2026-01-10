
'use server';

import {
    enhancePhoto,
    EnhancePhotoInput,
    EnhancePhotoOutput,
} from '@/ai/flows/enhance-photo-flow';
import {
    recommendDateCourse,
    streamDateCourse,
    DateCourseInput,
    DateCourseOutput,
} from '@/ai/flows/date-course-flow';
import {
    getRecommendationReason,
    RecommendationReasonInput,
    RecommendationReasonOutput,
} from '@/ai/flows/recommendation-reason-flow';
import { 
    getChatReplySuggestions,
    ChatReplyInput,
    ChatReplyOutput,
} from '@/ai/flows/chat-reply-flow';

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

export async function getAIRecommendationReason(
    input: RecommendationReasonInput
    ): Promise<RecommendationReasonOutput> {
    try {
        const result = await getRecommendationReason(input);
        return result;
    } catch (error) {
        console.error('AI Recommendation Reason generation failed:', error);
        throw new Error('Failed to get AI recommendation reason.');
    }
}

export async function getAIChatReplySuggestions(
    input: ChatReplyInput
    ): Promise<ChatReplyOutput> {
    try {
        const result = await getChatReplySuggestions(input);
        return result;
    } catch (error) {
        console.error('AI Chat Reply suggestion failed:', error);
        throw new Error('Failed to get AI chat reply suggestions.');
    }
}


export { streamDateCourse };

// This is now the primary action for the streaming UI.
export async function streamDateCourseAction(input: DateCourseInput) {
    return streamDateCourse(input);
}
