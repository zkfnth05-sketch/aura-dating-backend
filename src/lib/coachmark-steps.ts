export type CoachMarkStep = {
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
      title: '프로필 카드',
      content: '이곳에서 다른 사람의 프로필을 볼 수 있습니다. 카드를 스와이프하여 다음 프로필로 넘길 수 있습니다.',
    },
    {
      title: '액션 버튼',
      content: '하단의 버튼을 사용하여 좋아요, 싫어요, 또는 메시지를 보낼 수 있습니다. 이 버튼을 통해서만 상대방에게 마음을 표현할 수 있습니다.',
    },
    {
      title: 'AI 추천',
      content: '화면 상단의 AI 추천 버튼을 눌러 당신에게 꼭 맞는 상대를 추천받아보세요!',
    },
  ],
};

export const mapGuide: CoachMarkGuideData = {
  guideId: 'map',
  steps: [
    {
      title: '사용자 지도',
      content: '지도 위에 표시된 핀을 눌러 주변 사용자들의 프로필을 확인할 수 있습니다.',
    },
    {
      title: '거리 필터',
      content: '상단의 필터를 사용하여 원하는 거리 내의 사용자만 표시할 수 있습니다.',
    },
  ],
};

export const matchesGuide: CoachMarkGuideData = {
  guideId: 'matches',
  steps: [
    {
      title: '대화 목록',
      content: '이곳에서 매치된 상대와 나눈 대화 목록을 확인할 수 있습니다. 새로운 메시지가 오면 숫자로 표시됩니다.',
    },
    {
      title: '좋아요 목록',
      content: '상단의 탭을 눌러 나를 좋아한 사람과 내가 좋아한 사람 목록을 각각 확인할 수 있습니다.',
    },
  ],
};

export const profileGuide: CoachMarkGuideData = {
    guideId: 'profile',
    steps: [
      {
        title: '내 프로필',
        content: '이곳에서 당신의 프로필 정보를 확인하고, 알림 및 위치 공유 설정을 변경할 수 있습니다.',
      },
      {
        title: '프로필 수정',
        content: '프로필 수정 버튼을 눌러 사진, 자기소개, 관심사 등 모든 정보를 자유롭게 변경해보세요.',
      },
    ],
  };
