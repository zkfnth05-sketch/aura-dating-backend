'use client';

import { useMemo, useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from 'next/dynamic';

const DashboardChart = dynamic(() => import('@/components/dashboard-chart'), {
    ssr: false,
    loading: () => (
      <div className="flex h-[350px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
  });


export default function DashboardPage() {
    const firestore = useFirestore();
    const [genderFilter, setGenderFilter] = useState<'all' | '남성' | '여성'>('all');
    const [timePeriod, setTimePeriod] = useState<'daily' | 'monthly'>('daily');

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), orderBy('createdAt', 'asc'));
    }, [firestore]);

    const { data: users, isLoading } = useCollection<User>(usersQuery);

    const { chartData, totalUsers, last7DaysSignups } = useMemo(() => {
        if (!users) {
          return { chartData: [], totalUsers: 0, last7DaysSignups: 0 };
        }

        const filteredUsers = users.filter(user => {
            if (genderFilter === 'all') return true;
            return user.gender === genderFilter;
        });
        
        const signupsByDate: { [key: string]: number } = {};
        const signupsByMonth: { [key: string]: number } = {};
        let signupsInLast7Days = 0;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        filteredUsers.forEach(user => {
            if (user.createdAt) {
                const signupDate = user.createdAt.toDate();
                const date = format(signupDate, 'yyyy-MM-dd');
                const month = format(signupDate, 'yyyy-MM');
                
                signupsByDate[date] = (signupsByDate[date] || 0) + 1;
                signupsByMonth[month] = (signupsByMonth[month] || 0) + 1;

                if (signupDate >= sevenDaysAgo) {
                    signupsInLast7Days++;
                }
            }
        });
        
        const dailyData = Object.keys(signupsByDate).map(date => ({
            date,
            users: signupsByDate[date],
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const oneYearAgo = subMonths(new Date(), 12);
        const monthlyData = Object.keys(signupsByMonth)
            .map(month => ({
                date: month,
                users: signupsByMonth[month],
            }))
            .filter(item => new Date(item.date) >= oneYearAgo)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        return {
          chartData: timePeriod === 'daily' ? dailyData : monthlyData,
          totalUsers: filteredUsers.length,
          last7DaysSignups: signupsInLast7Days,
        };
    }, [users, genderFilter, timePeriod]);
    
    return (
        <AdminLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">대시보드</h2>
                        <p className="text-muted-foreground">일별/월별 신규 사용자 가입 현황을 확인하세요.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Tabs value={genderFilter} onValueChange={(value) => setGenderFilter(value as any)}>
                        <TabsList>
                            <TabsTrigger value="all">전체</TabsTrigger>
                            <TabsTrigger value="남성">남성</TabsTrigger>
                            <TabsTrigger value="여성">여성</TabsTrigger>
                        </TabsList>
                    </Tabs>
                     <Tabs value={timePeriod} onValueChange={(value) => setTimePeriod(value as any)}>
                        <TabsList>
                            <TabsTrigger value="daily">일별</TabsTrigger>
                            <TabsTrigger value="monthly">월별</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {genderFilter === 'all' ? '총 사용자' : genderFilter === '남성' ? '총 남성 사용자' : '총 여성 사용자'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalUsers}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                최근 7일 가입자 ({genderFilter === 'all' ? '전체' : genderFilter})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : last7DaysSignups}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{timePeriod === 'daily' ? '일별' : '월별'} 신규 가입자 수 ({genderFilter === 'all' ? '전체' : genderFilter})</CardTitle>
                        <CardDescription>
                            {timePeriod === 'daily' 
                                ? '지난 기간 동안의 일일 신규 사용자 가입 추이입니다.'
                                : '최근 1년 동안의 월간 신규 사용자 가입 추이입니다.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {isLoading ? (
                            <div className="flex h-[350px] items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <div className="h-[350px]">
                                <DashboardChart chartData={chartData} timePeriod={timePeriod} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    )
}
