'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function MapMapRedirectPage() {
  useEffect(() => {
    redirect('/map');
  }, []);

  return null; // 리디렉션하는 동안 아무것도 렌더링하지 않습니다.
}
