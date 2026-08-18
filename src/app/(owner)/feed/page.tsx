import { Card } from "@/components/ui/card";
import { FeedManagement } from "@/features/feed/components/feed-management";
import { getFeedPageData } from "@/features/feed/queries/get-feed-page-data";
import { getFeedUsage } from "@/features/feed/queries/get-feed-usage";
import { parseFeedUsageFilters } from "@/features/feed/schemas/feed-usage-filter";
import type { FeedTab } from "@/features/feed/types/feed";

type FeedPageProps = {
  searchParams: Promise<{
    tab?: string | string[];
    from?: string | string[];
    to?: string | string[];
    kandang?: string | string[];
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

export default async function FeedPage({
  searchParams,
}: FeedPageProps) {
  const params =
    await searchParams;

  const requestedTab =
    firstValue(params.tab);

  const initialTab: FeedTab =
    requestedTab === "usage" ||
    requestedTab === "ingredient"
      ? requestedTab
      : "formula";

  const usageFilters =
    parseFeedUsageFilters({
      from: firstValue(
        params.from,
      ),

      to: firstValue(
        params.to,
      ),

      kandangId: firstValue(
        params.kandang,
      ),
    });

  const [
    data,
    usage,
  ] = await Promise.all([
    getFeedPageData(),

    getFeedUsage(
      usageFilters,
    ),
  ]);

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
    <FeedManagement
      data={data}
      usage={usage}
      initialTab={initialTab}
    />
  );
}