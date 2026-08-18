import { notFound } from "next/navigation";

import { OrderDetail } from "@/features/sales/components/order-detail";
import { getOrderDetail } from "@/features/sales/queries/get-order-detail";

type OrderDetailPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { orderId } =
    await params;

  const order =
    await getOrderDetail(
      orderId,
    );

  if (!order) {
    notFound();
  }

  return (
    <OrderDetail
      order={order}
    />
  );
}