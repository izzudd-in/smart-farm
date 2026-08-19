import {
  OwnerDashboard,
} from "@/features/dashboard/components/owner-dashboard";

import {
  getDashboardOverview,
} from "@/features/dashboard/queries/get-dashboard-overview";

export default async function DashboardPage() {
  const data =
    await getDashboardOverview();

  return (
    <OwnerDashboard
      data={data}
    />
  );
}