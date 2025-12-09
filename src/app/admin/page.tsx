'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { User } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function AdminHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-sm items-center justify-between">
                <div className="flex-1">
                     <Button variant="link" asChild>
                        <Link href="/" className="text-muted-foreground">앱으로 돌아가기</Link>
                     </Button>
                </div>
                <h1 className="text-xl font-bold text-center flex-1">관리자 대시보드</h1>
                <div className="flex-1"></div>
            </div>
        </header>
    );
}


export default function AdminPage() {
  const firestore = useFirestore();
  
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection<User>(usersQuery);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader />
      <main className="flex-1 container py-8">
        <h2 className="text-2xl font-bold mb-6">전체 사용자 목록 ({users?.length || 0}명)</h2>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead className="hidden md:table-cell">이메일</TableHead>
                <TableHead>나이</TableHead>
                <TableHead>성별</TableHead>
                <TableHead>가입일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users && users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{user.id.substring(0, 15)}...</TableCell>
                  <TableCell>{user.age}</TableCell>
                  <TableCell>
                    <Badge variant={user.gender === '여성' ? 'default' : 'secondary'}>
                      {user.gender}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.createdAt
                      ? user.createdAt.toDate().toLocaleDateString('ko-KR')
                      : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
