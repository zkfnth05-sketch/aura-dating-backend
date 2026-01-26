'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home } from 'lucide-react';

export default function DeleteAccountPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">계정 삭제 안내</CardTitle>
          <CardDescription>Aura 계정을 삭제하는 방법입니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 text-sm text-foreground/80">
            <p>
              저희 Aura 서비스를 이용해 주셔서 감사합니다. 계정 삭제는 앱 내에서 안전하게 진행하실 수 있습니다.
            </p>
            <p className="font-semibold">
              아래 단계에 따라 계정을 영구적으로 삭제할 수 있습니다.
            </p>
            <ol className="list-decimal list-inside space-y-2 pl-4 bg-card p-4 rounded-md border">
              <li>앱에 로그인합니다.</li>
              <li>하단 메뉴에서 <span className="font-bold text-primary">'내 프로필'</span> 탭으로 이동합니다.</li>
              <li>프로필 화면에서 <span className="font-bold text-primary">'프로필 수정'</span> 버튼을 누릅니다.</li>
              <li>프로필 수정 화면 가장 하단에 있는 <span className="font-bold text-destructive">'회원 탈퇴'</span> 링크를 누릅니다.</li>
              <li>안내에 따라 본인 인증을 완료하면 계정이 즉시 영구적으로 삭제됩니다.</li>
            </ol>
            <p>
              계정을 삭제하면 모든 프로필 정보, 사진, 대화 내역, 매칭 기록이 영구적으로 제거되며 복구할 수 없습니다.
            </p>
            <p>
              궁금한 점이 있으시면 고객 지원팀에 문의해 주세요.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              홈으로 돌아가기
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
