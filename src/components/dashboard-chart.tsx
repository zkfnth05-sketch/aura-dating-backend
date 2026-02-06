'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { format, parseISO } from 'date-fns';

const chartConfig = {
  users: {
    label: "신규 가입자",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

interface DashboardChartProps {
    chartData: { date: string; users: number }[];
    timePeriod: 'daily' | 'monthly';
}

export default function DashboardChart({ chartData, timePeriod }: DashboardChartProps) {
    return (
        <ChartContainer config={chartConfig} className="w-full h-full">
            <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => {
                        if (timePeriod === 'monthly') {
                            return format(parseISO(value), 'yyyy-MM');
                        }
                        return format(parseISO(value), 'MM-dd');
                    }}
                />
                <YAxis allowDecimals={false} />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                />
                <Bar dataKey="users" fill="var(--color-users)" radius={4} />
            </BarChart>
        </ChartContainer>
    );
}
