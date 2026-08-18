import { SalesManagement } from "@/features/sales/components/sales-management";
import { getOrderList } from "@/features/sales/queries/get-order-list";
import { getSalesPageData } from "@/features/sales/queries/get-sales-page-data";
import { parseOrderFilters } from "@/features/sales/schemas/sales";
import type { SalesTab } from "@/features/sales/types/sales";

type SalesPageProps = {
  searchParams: Promise<{
    tab?: string | string[];
    from?: string | string[];
    to?: string | string[];
    customer?: string | string[];
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
    firstValue(
      params.tab,
    );

  const initialTab: SalesTab =
    requestedTab ===
      "customer" ||
    requestedTab === "price"
      ? requestedTab
      : "order";

  const orderFilters =
    parseOrderFilters({
      from: firstValue(
        params.from,
      ),

      to: firstValue(
        params.to,
      ),

      customerId:
        firstValue(
          params.customer,
        ),
    });

  const [
    data,
    orders,
  ] = await Promise.all([
    getSalesPageData(),
    getOrderList(
      orderFilters,
    ),
  ]);

  return (
    <SalesManagement
      data={data}
      orders={orders}
      initialTab={initialTab}
    />
  );
}