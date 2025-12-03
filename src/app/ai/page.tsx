'use client';

import { useState, useEffect } from 'react';
import AiPageClient from '@/components/ai-page-client';
import { potentialMatches } from '@/lib/data';
import { useUser } from '@/contexts/user-context';
import type { User } from '@/lib/types';

export default function AiPage() {
  const { user: currentUser } = useUser();
  const [recommendedUsers, setRecommendedUsers] = useState<User[]>([]);

  useEffect(() => {
    const filteredUsers = potentialMatches.filter(user => {
        if (currentUser.gender === '남성') return user.gender === '여성';
        if (currentUser.gender === '여성') return user.gender === '남성';
        // '기타' 성별의 경우 일단 모두 표시하거나 다른 규칙을 적용할 수 있습니다.
        // 여기서는 이성만 보여주는 기본 규칙을 따릅니다.
        return false; 
    });
    setRecommendedUsers(filteredUsers.slice(0, 6));
  }, [currentUser.gender]);

  return <AiPageClient recommendedUsers={recommendedUsers} />;
}
