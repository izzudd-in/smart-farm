import { Card } from "@/components/ui/card";
import { FarmManagement } from "@/features/farm/components/farm-management";
import { getFarmPageData } from "@/features/farm/queries/get-farm-page-data";

export default async function FarmPage() {
  const data = await getFarmPageData();

  if (!data) {
    return (
      <Card className="p-6">
        <h1 className="text-xl font-semibold text-foreground">
          Kandang & Flock
        </h1>

        <p className="mt-2 text-sm text-muted">
          Farm utama belum tersedia.
          Jalankan database seed terlebih
          dahulu.
        </p>
      </Card>
    );
  }

  return <FarmManagement data={data} />;
}