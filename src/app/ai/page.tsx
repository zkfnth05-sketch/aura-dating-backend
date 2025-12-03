'use client';

import AiPageClient from '@/components/ai-page-client';
import { potentialMatches } from '@/lib/data';

export default function AiPage() {
  const recommendedUsers = potentialMatches.slice(0, 6);

  return <AiPageClient recommendedUsers={recommendedUsers} />;
}
