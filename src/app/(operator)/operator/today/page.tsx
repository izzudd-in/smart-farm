import { OperatorToday } from "@/features/daily-operations/components/operator-today";
import { getOperatorTodayData } from "@/features/daily-operations/queries/get-operator-today";

export default async function OperatorTodayPage() {
  const data =
    await getOperatorTodayData();

  return <OperatorToday data={data} />;
}