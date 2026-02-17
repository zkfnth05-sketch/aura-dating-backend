
export type CoachMarkStep = {
  target: string;
  title: string;
  content: string;
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
      title: '프로필 카드',
      content: '이곳에서 다른 사람의 프로필을 볼 수 있습니다. 카드를 좌우로 스와이프하여 다음 프로필을 볼 수 있습니다.',
    },
    {
      target: 'footer',
      title: '액션 버튼',
      content: '하단의 버튼을 사용하여 좋아요, 싫어요, 또는 메시지를 보낼 수 있습니다. 상대방에게 마음을 표현하려면 이 버튼들을 이용하세요.',
    },
    {
      target: 'header a[href="/ai"]',
      title: 'AI 추천',
      content: '화면 상단의 AI 추천 버튼을 눌러 당신에게 꼭 맞는 상대를 추천받아보세요!',
    },
  ],
};

export const mapGuide: CoachMarkGuideData = {
  guideId: 'map',
  steps: [
    {
      target: 'main > div.flex-1 > div',
      title: '사용자 지도',
      content: '지도 위에 표시된 핀을 눌러 주변 사용자들의 프로필을 확인할 수 있습니다.',
    },
    {
      target: 'main > div.flex-1 > div > div.absolute',
      title: '거리 필터',
      content: '상단의 필터를 사용하여 원하는 거리 내의 사용자만 표시할 수 있습니다.',
    },
  ],
};

export const matchesGuide: CoachMarkGuideData = {
  guideId: 'matches',
  steps: [
    {
      target: '[role="tabpanel"][data-state="active"]',
      title: '대화 목록',
      content: '이곳에서 매치된 상대와 나눈 대화 목록을 확인할 수 있습니다. 새로운 메시지가 오면 숫자로 표시됩니다.',
    },
    {
      target: '[role="tablist"]',
      title: '좋아요 목록',
      content: '상단의 탭을 눌러 나를 좋아한 사람과 내가 좋아한 사람 목록을 각각 확인할 수 있습니다.',
    },
  ],
};

export const profileGuide: CoachMarkGuideData = {
    guideId: 'profile',
    steps: [
      {
        target: 'main > div.container',
        title: '내 프로필',
        content: '이곳에서 당신의 프로필 정보를 확인하고, 알림 및 위치 공유 설정을 변경할 수 있습니다.',
      },
      {
        target: 'main > div.py-8 > a',
        title: '프로필 수정',
        content: '프로필 수정 버튼을 눌러 사진, 자기소개, 관심사 등 모든 정보를 자유롭게 변경해보세요.',
      },
    ],
};

export const aiGuide: CoachMarkGuideData = {
  guideId: 'ai',
  steps: [
    {
      target: '[role="tabpanel"][data-state="active"]',
      title: 'AI 추천 기능',
      content: 'AI가 회원님의 프로필을 분석하여 꼭 맞는 이상형을 추천해 드립니다. 새로운 추천을 보고 싶으면 하단의 버튼을 누르세요.',
    },
    {
      target: '[role="tablist"] [data-radix-collection-item]:nth-child(2)',
      title: '데이트 코스 추천',
      content: '상단의 "AI 추천 데이트 코스" 탭을 눌러 원하는 조건에 맞는 데이트 계획을 AI에게 추천받을 수 있습니다.',
    },
  ],
};

export const editProfileGuide: CoachMarkGuideData = {
  guideId: 'edit-profile',
  steps: [
    {
      target: 'main',
      title: '프로필 정보 수정',
      content: '이 페이지에서 사진, 자기소개, 관심사 등 모든 프로필 정보를 자유롭게 수정할 수 있습니다. 사진은 AI 사진 보정 토글을 켜고 끌 수 있어, 원본 사진을 그대로 올리거나 AI가 직접 멋지게 보정해주는 기능을 사용할 수 있습니다.',
    },
    {
      target: 'footer',
      title: '저장하기',
      content: '수정이 완료되면 화면 하단의 저장 버튼을 눌러 변경사항을 프로필에 반영하는 것을 잊지 마세요!',
    },
  ],
};
