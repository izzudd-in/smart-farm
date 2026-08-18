import { Card } from "@/components/ui/card";
import { FeedManagement } from "@/features/feed/components/feed-management";
import { getFeedPageData } from "@/features/feed/queries/get-feed-page-data";

export default async function FeedPage() {
  const data =
    await getFeedPageData();

  if (!data) {
    return (
      <Card className="p-6">
        <h1 className="text-xl font-semibold text-foreground">
          Pakan
        </h1>

        <p className="mt-2 text-sm text-muted">
          Farm utama belum tersedia.
          Jalankan database seed.
        </p>
      </Card>
    );
  }

  return (
    <FeedManagement data={data} />
  );
}