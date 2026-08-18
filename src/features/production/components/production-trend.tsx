import { Card } from "@/components/ui/card";
import type { ProductionTrendPoint } from "@/features/production/types/production";
import { parseDateOnly } from "@/features/daily-operations/utils/date";

type ProductionTrendProps = {
  points: ProductionTrendPoint[];
};

function formatShortDate(
  date: string,
): string {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      timeZone: "UTC",
    },
  ).format(
    parseDateOnly(date),
  );
}

export function ProductionTrend({
  points,
}: ProductionTrendProps) {
  const visiblePoints =
    points
      .filter(
        (point) =>
          point.totalProduction !==
          null,
      )
      .slice(-14);

  if (
    visiblePoints.length === 0
  ) {
    return (
      <Card className="p-5">
        <h2 className="font-semibold text-foreground">
          Trend Produksi
        </h2>

        <p className="mt-4 text-sm text-muted">
          Belum ada data produksi
          lengkap pada periode ini.
        </p>
      </Card>
    );
  }

  const maximum = Math.max(
    ...visiblePoints.map(
      (point) =>
        point.totalProduction ??
        0,
    ),
    1,
  );

  const coordinates =
    visiblePoints.map(
      (point, index) => {
        const x =
          visiblePoints.length === 1
            ? 50
            : (index /
                (visiblePoints.length -
                  1)) *
              100;

        const value =
          point.totalProduction ??
          0;

        const y =
          36 -
          (value / maximum) *
            30;

        return {
          x,
          y,
          point,
        };
      },
    );

  const polyline =
    coordinates
      .map(
        ({ x, y }) =>
          `${x},${y}`,
      )
      .join(" ");

  const latest =
    visiblePoints[
      visiblePoints.length - 1
    ];

  return (
    <Card className="min-w-0 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-foreground">
            Trend Produksi
          </h2>

          <p className="mt-1 text-xs text-muted">
            Maksimal 14 hari laporan
            terbaru dalam periode.
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-muted">
            Terakhir
          </p>

          <p className="text-sm font-semibold text-foreground">
            {latest.totalProduction?.toLocaleString(
              "id-ID",
              {
                maximumFractionDigits:
                  2,
              },
            )}{" "}
            kg
          </p>
        </div>
      </div>

      <div className="mt-5 w-full">
        <svg
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          role="img"
          aria-label="Trend total produksi telur"
          className="h-40 w-full overflow-visible text-primary"
        >
          <line
            x1="0"
            y1="36"
            x2="100"
            y2="36"
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeWidth="0.5"
          />

          {coordinates.length > 1 ? (
            <polyline
              points={polyline}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}

          {coordinates.map(
            ({
              x,
              y,
              point,
            }) => (
              <circle
                key={point.date}
                cx={x}
                cy={y}
                r="1.5"
                fill="currentColor"
              />
            ),
          )}
        </svg>

        <div className="mt-1 flex justify-between gap-4 text-[11px] text-muted">
          <span>
            {formatShortDate(
              visiblePoints[0].date,
            )}
          </span>

          <span>
            {formatShortDate(
              latest.date,
            )}
          </span>
        </div>
      </div>
    </Card>
  );
}