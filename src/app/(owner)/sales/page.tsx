import { SalesManagement } from "@/features/sales/components/sales-management";
import { getSalesPageData } from "@/features/sales/queries/get-sales-page-data";
import type { SalesTab } from "@/features/sales/types/sales";

type SalesPageProps = {
  searchParams: Promise<{
    tab?: string | string[];
  }>;
};

function firstValue(
  value:
    | string
    | string[]
    | undefined,
): string | undefined {
  return Array.isArray(value)
    ? value[0]
    : value;
}

export default async function SalesPage({
  searchParams,
}: SalesPageProps) {
  const params =
    await searchParams;

  const requestedTab =
    firstValue(params.tab);

  const initialTab: SalesTab =
    requestedTab === "price"
      ? "price"
      : "customer";

  const data =
    await getSalesPageData();

  return (
    <SalesManagement
      data={data}
      initialTab={initialTab}
    />
  );
}