'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
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
import { Loader2, Search, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AdminLayout from '@/components/admin-layout';
import Image from 'next/image';
import ImageCarouselDialog from '@/components/image-carousel-dialog';
import AddUserDialog from '@/components/add-user-dialog';
import EditUserDialog from '@/components/edit-user-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const ADMIN_ID = 'admin';
const ADMIN_PASS = 'rlaghddlf0411*';

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (id === ADMIN_ID && password === ADMIN_PASS) {
      setError('');
      sessionStorage.setItem('isAdminAuthenticated', 'true');
      onLogin();
    } else {
      setError('아이디 또는 비밀번호가 잘못되었습니다.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary"/>
            관리자 로그인
          </CardTitle>
          <CardDescription>관리자만 접근할 수 있는 페이지입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id">아이디</Label>
              <Input
                id="id"
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">
              로그인
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAdminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoadingAuth(false);
  }, []);


  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection<User>(usersQuery);

  const filteredUsers = users?.filter(user => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(term) ||
      user.id.toLowerCase().includes(term) ||
      (user.email && user.email.toLowerCase().includes(term)) ||
      (user.phoneNumber && user.phoneNumber.includes(term))
    );
  });

  const handleImageClick = (images: string[], index: number) => {
    setSelectedImages(images);
    setSelectedImageIndex(index);
    setIsCarouselOpen(true);
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setIsEditUserDialogOpen(true);
  }
  
  const handleDeleteUser = async (userId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'users', userId));
      toast({
        title: "사용자 삭제됨",
        description: `사용자(ID: ${userId.substring(0,8)})가 성공적으로 삭제되었습니다.`,
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        variant: "destructive",
        title: "삭제 실패",
        description: "사용자를 삭제하는 데 실패했습니다.",
      });
    }
  };

  const handleUserAdded = () => {
    setIsAddUserDialogOpen(false);
  }

  const handleUserUpdated = () => {
    setIsEditUserDialogOpen(false);
    setEditingUser(null);
  }

  if (isLoadingAuth) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <>
      <AdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">사용자 관리</h2>
            <div className="hidden md:flex items-center space-x-2">
              <Button onClick={() => setIsAddUserDialogOpen(true)}>사용자 추가</Button>
            </div>
          </div>
          
          <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                  placeholder="이름, ID, 이메일 또는 전화번호로 검색" 
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>이름</TableHead>
                      <TableHead>이메일</TableHead>
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
                        <TableCell className="font-medium text-muted-foreground w-24 truncate">{user.id.substring(0, 8)}...</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email || '미입력'}</TableCell>
                        <TableCell>{user.age}</TableCell>
                        <TableCell>
                          <Badge variant={user.gender === '여성' ? 'default' : 'secondary'}>
                            {user.gender}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.location}</TableCell>
                        <TableCell>{user.phoneNumber || '미입력'}</TableCell>
                        <TableCell>
                            <Button 
                              variant="ghost" 
                              className="flex items-center gap-2 p-1 h-auto"
                              onClick={() => handleImageClick(user.photoUrls || [], 0)}
                              disabled={!user.photoUrls || user.photoUrls.length === 0}
                            >
                                {user.photoUrls && user.photoUrls.length > 0 ? (
                                    <Image 
                                        src={user.photoUrls[0]} 
                                        alt={user.name}
                                        width={24}
                                        height={24}
                                        className="rounded-sm object-cover h-6 w-6"
                                    />
                                ) : (
                                    <div className="w-6 h-6 flex items-center justify-center">
                                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                )}
                                <span className="text-muted-foreground text-xs">
                                    ({user.photoUrls?.length || 0}개)
                                </span>
                            </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleEditClick(user)}>수정</Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="ml-2 h-8">삭제</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  이 작업은 되돌릴 수 없습니다. 사용자 '{user.name}'의 모든 데이터가 영구적으로 삭제됩니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className={cn(buttonVariants({ variant: "destructive" }))}>
                                  삭제
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
      <ImageCarouselDialog 
        isOpen={isCarouselOpen}
        onClose={() => setIsCarouselOpen(false)}
        images={selectedImages}
        startIndex={selectedImageIndex}
      />
      <AddUserDialog 
        isOpen={isAddUserDialogOpen}
        onClose={() => setIsAddUserDialogOpen(false)}
        onUserAdded={handleUserAdded}
      />
       {editingUser && (
        <EditUserDialog
          isOpen={isEditUserDialogOpen}
          onClose={() => { setIsEditUserDialogOpen(false); setEditingUser(null); }}
          onUserUpdated={handleUserUpdated}
          user={editingUser}
        />
      )}
    </>
  );
}
