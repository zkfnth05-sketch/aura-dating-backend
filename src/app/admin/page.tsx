'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
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
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AdminLayout from '@/components/admin-layout';
import Image from 'next/image';

export default function AdminPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Simple search will be client-side for now.
    // For a large user base, server-side search (e.g., with Algolia) would be better.
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection<User>(usersQuery);

  const filteredUsers = users?.filter(user => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(term) ||
      user.id.toLowerCase().includes(term) ||
      (user.phoneNumber && user.phoneNumber.includes(term))
    );
  });

  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">사용자 관리</h2>
          <div className="flex items-center space-x-2">
            <Button>사용자 추가</Button>
          </div>
        </div>
        
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="이름, ID 또는 전화번호로 검색" 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          {isLoading ? (
            <div className="flex h-96 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>나이</TableHead>
                  <TableHead>성별</TableHead>
                  <TableHead>도시</TableHead>
                  <TableHead>전화번호</TableHead>
                  <TableHead>사진</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers && filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-muted-foreground w-24">{user.id.substring(0, 8)}...</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.age}</TableCell>
                    <TableCell>
                      <Badge variant={user.gender === '여성' ? 'default' : 'secondary'}>
                        {user.gender}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.location}</TableCell>
                    <TableCell>{user.phoneNumber || '미입력'}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            {user.photoUrls && user.photoUrls.length > 0 ? (
                                <Image 
                                    src={user.photoUrls[0]} 
                                    alt={user.name}
                                    width={24}
                                    height={24}
                                    className="rounded-sm object-cover h-6 w-6"
                                />
                            ) : (
                                <Avatar className="h-6 w-6">
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            )}
                            <span className="text-muted-foreground text-xs">
                                ({user.photoUrls?.length || 0}개)
                            </span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white">수정</Button>
                      <Button variant="destructive" size="sm" className="ml-2 h-8">삭제</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
