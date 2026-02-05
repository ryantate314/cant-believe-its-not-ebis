import { OpenWorkOrdersChart } from "@/components/features/dashboard/open-work-orders-chart";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <OpenWorkOrdersChart />
      </div>
    </div>
  );
}
