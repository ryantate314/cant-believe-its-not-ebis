"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkOrderCountsByCity } from "@/hooks/use-work-order-counts-by-city";

const chartConfig = {
  open_count: {
    label: "Open Work Orders",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function OpenWorkOrdersChart() {
  const { counts, isLoading, error } = useWorkOrderCountsByCity();

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Open Work Orders by Location</CardTitle>
          <CardDescription>Failed to load chart data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Unable to load work order counts. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Open Work Orders by Location</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (counts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Open Work Orders by Location</CardTitle>
          <CardDescription>No open work orders</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            There are currently no open work orders across any locations.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = counts.map((item) => ({
    city: item.city_name,
    open_count: item.open_count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Open Work Orders by Location</CardTitle>
        <CardDescription>
          Count of work orders currently in open status by city
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{ left: 0, right: 16, bottom: 20 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              dataKey="open_count"
              tickLine={true}
              axisLine={true}
              tickMargin={8}
              allowDecimals={false}
            />
            <YAxis
              dataKey="city"
              type="category"
              tickLine={true}
              tickMargin={10}
              axisLine={true}
              width={120}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="open_count"
              fill="var(--color-open_count)"
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
