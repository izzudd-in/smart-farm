import { notFound } from "next/navigation";

import { ProductionKandangDetailView } from "@/features/production/components/production-kandang-detail";
import { getProductionKandangDetail } from "@/features/production/queries/get-production-kandang-detail";
import { parseProductionFilters } from "@/features/production/schemas/production-filter";

type ProductionKandangPageProps = {
  params: Promise<{
    kandangId: string;
  }>;

  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
    flock?: string | string[];
    mode?: string | string[];
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

export default async function ProductionKandangPage({
  params,
  searchParams,
}: ProductionKandangPageProps) {
  const [
    resolvedParams,
    resolvedSearchParams,
  ] = await Promise.all([
    params,
    searchParams,
  ]);

  const filters =
    parseProductionFilters({
      from: firstValue(
        resolvedSearchParams.from,
      ),

      to: firstValue(
        resolvedSearchParams.to,
      ),

      kandangId:
        resolvedParams.kandangId,

      mode: firstValue(
        resolvedSearchParams.mode,
      ),
    });

  const data =
    await getProductionKandangDetail(
      resolvedParams.kandangId,

      filters,

      firstValue(
        resolvedSearchParams.flock,
      ) ?? "",
    );

  if (!data) {
    notFound();
  }

  return (
    <ProductionKandangDetailView
      data={data}
    />
  );
}