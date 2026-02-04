'use client';

import { useMemo } from 'react';
import AdminLayout from '@/components/admin-layout';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const chartConfig = {
  users: {
    label: "신규 가입자",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;


export default function DashboardPage() {
    const firestore = useFirestore();

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), orderBy('createdAt', 'asc'));
    }, [firestore]);

    const { data: users, isLoading } = useCollection<User>(usersQuery);

    const { dailySignups, totalUsers, last7DaysSignups } = useMemo(() => {
        if (!users) {
          return { dailySignups: [], totalUsers: 0, last7DaysSignups: 0 };
        }
        
        const signupsByDate: { [key: string]: number } = {};
        let signupsInLast7Days = 0;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        users.forEach(user => {
            if (user.createdAt) {
                const signupDate = user.createdAt.toDate();
                const date = format(signupDate, 'yyyy-MM-dd');
                
                signupsByDate[date] = (signupsByDate[date] || 0) + 1;

                if (signupDate >= sevenDaysAgo) {
                    signupsInLast7Days++;
                }
            }
        });
        
        const chartData = Object.keys(signupsByDate).map(date => ({
            date,
            users: signupsByDate[date],
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        return {
          dailySignups: chartData,
          totalUsers: users.length,
          last7DaysSignups: signupsInLast7Days,
        };
    }, [users]);
    
    return (
        <AdminLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <h2 className="text-3xl font-bold tracking-tight">대시보드</h2>
                <p className="text-muted-foreground">일별 신규 사용자 가입 현황을 확인하세요.</p>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalUsers}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">최근 7일 가입자</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : last7DaysSignups}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>일별 신규 가입자 수</CardTitle>
                        <CardDescription>지난 기간 동안의 일일 신규 사용자 가입 추이입니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {isLoading ? (
                            <div className="flex h-[350px] items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <div className="h-[350px]">
                                <ChartContainer config={chartConfig} className="w-full h-full">
                                    <BarChart data={dailySignups} margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tickLine={false}
                                            tickMargin={10}
                                            axisLine={false}
                                            tickFormatter={(value) => format(parseISO(value), 'MM-dd')}
                                        />
                                        <YAxis allowDecimals={false} />
                                        <ChartTooltip
                                            cursor={false}
                                            content={<ChartTooltipContent />}
                                        />
                                        <Bar dataKey="users" fill="var(--color-users)" radius={4} />
                                    </BarChart>
                                </ChartContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    )
}
