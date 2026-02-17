
import { TranslationKeys } from './locales';

export type CoachMarkStep = {
  target: string;
  title: TranslationKeys;
  content: TranslationKeys;
};

export type CoachMarkGuideData = {
  guideId: string;
  steps: CoachMarkStep[];
};

export const homeGuide: CoachMarkGuideData = {
  guideId: 'home',
  steps: [
    {
      target: 'main > div.relative',
      title: 'coach_home_step1_title',
      content: 'coach_home_step1_content',
    },
    {
      target: 'footer',
      title: 'coach_home_step2_title',
      content: 'coach_home_step2_content',
    },
    {
      target: 'header a[href="/ai"]',
      title: 'coach_home_step3_title',
      content: 'coach_home_step3_content',
    },
  ],
};

export const mapGuide: CoachMarkGuideData = {
  guideId: 'map',
  steps: [
    {
      target: 'main > div.flex-1 > div',
      title: 'coach_map_step1_title',
      content: 'coach_map_step1_content',
    },
    {
      target: 'main > div.flex-1 > div > div.absolute',
      title: 'coach_map_step2_title',
      content: 'coach_map_step2_content',
    },
  ],
};

export const matchesGuide: CoachMarkGuideData = {
  guideId: 'matches',
  steps: [
    {
      target: '[role="tabpanel"][data-state="active"]',
      title: 'coach_matches_step1_title',
      content: 'coach_matches_step1_content',
    },
    {
      target: '[role="tablist"]',
      title: 'coach_matches_step2_title',
      content: 'coach_matches_step2_content',
    },
  ],
};

export const profileGuide: CoachMarkGuideData = {
    guideId: 'profile',
    steps: [
      {
        target: 'main > div.container',
        title: 'coach_profile_step1_title',
        content: 'coach_profile_step1_content',
      },
      {
        target: 'main > div.py-8 > a',
        title: 'coach_profile_step2_title',
        content: 'coach_profile_step2_content',
      },
    ],
};

export const aiGuide: CoachMarkGuideData = {
  guideId: 'ai',
  steps: [
    {
      target: '[role="tabpanel"][data-state="active"]',
      title: 'coach_ai_step1_title',
      content: 'coach_ai_step1_content',
    },
    {
      target: '[role="tablist"] [data-radix-collection-item]:nth-child(2)',
      title: 'coach_ai_step2_title',
      content: 'coach_ai_step2_content',
    },
  ],
};

export const editProfileGuide: CoachMarkGuideData = {
  guideId: 'edit-profile',
  steps: [
    {
      target: 'main',
      title: 'coach_editProfile_step1_title',
      content: 'coach_editProfile_step1_content',
    },
    {
      target: 'main > section:nth-of-type(2)',
      title: 'coach_editProfile_step2_title',
      content: 'coach_editProfile_step2_content',
    },
    {
      target: 'footer',
      title: 'coach_editProfile_step3_title',
      content: 'coach_editProfile_step3_content',
    },
  ],
};

export const hotGuide: CoachMarkGuideData = {
  guideId: 'hot',
  steps: [
    {
      target: '[role="tabpanel"][data-state="active"] > div.grid',
      title: 'coach_hot_step1_title',
      content: 'coach_hot_step1_content',
    },
    {
      target: '[role="tabpanel"][data-state="active"]',
      title: 'coach_hot_step2_title',
      content: 'coach_hot_step2_content',
    },
    {
      target: '[role="tablist"]',
      title: 'coach_hot_step3_title',
      content: 'coach_hot_step3_content',
    },
  ],
};

export const chatGuide: CoachMarkGuideData = {
  guideId: 'chat',
  steps: [
    {
      target: 'main .bg-blue-900\\/50',
      title: 'coach_chat_step1_title',
      content: 'coach_chat_step1_content',
    },
    {
      target: 'footer form input',
      title: 'coach_chat_step2_title',
      content: 'coach_chat_step2_content',
    },
    {
      target: 'footer form button:first-child',
      title: 'coach_chat_step3_title',
      content: 'coach_chat_step3_content',
    },
    {
      target: 'footer form button[type=button]:last-child',
      title: 'coach_chat_step4_title',
      content: 'coach_chat_step4_content',
    },
    {
      target: 'header button:last-child',
      title: 'coach_chat_step5_title',
      content: 'coach_chat_step5_content',
    },
  ],
};
