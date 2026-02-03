import { redirect } from "next/navigation";

interface WorkOrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkOrderPage({ params }: WorkOrderPageProps) {
  const { id } = await params;
  redirect(`/workorder/${id}/item`);
}
