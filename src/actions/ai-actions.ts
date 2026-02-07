
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
import {
    translateChatText,
    TranslateChatInput,
    TranslateChatOutput,
} from '@/ai/flows/translate-chat-flow';
import {
    animatePhoto,
    AnimatePhotoInput,
    AnimatePhotoOutput,
} from '@/ai/flows/animate-photo-flow';

export async function getEnhancedPhoto(
    input: EnhancePhotoInput
  ): Promise<EnhancePhotoOutput> {
    // The flow now handles its own errors and falls back, so we don't need a try/catch here.
    // This simplifies the action and lets the client-side decide what to do with the result.
    const result = await enhancePhoto(input);
    return result;
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

export async function getChatTranslation(
    input: TranslateChatInput
): Promise<TranslateChatOutput> {
    try {
        const result = await translateChatText(input);
        return result;
    } catch (error) {
        console.error('AI Chat Translation failed:', error);
        throw new Error('Failed to get chat translation.');
    }
}

export async function generateAnimatedPhoto(
    input: AnimatePhotoInput
): Promise<AnimatePhotoOutput> {
    try {
        const result = await animatePhoto(input);
        return result;
    } catch (error) {
        console.error('AI photo animation failed:', error);
        // Re-throw to let the client-side handle it with a toast
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error('An unknown error occurred during video generation.');
    }
}
