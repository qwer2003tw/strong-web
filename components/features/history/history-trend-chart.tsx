"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useTranslations } from "next-intl";
import type { HistoryTrendPoint } from "@/lib/history";

interface HistoryTrendChartProps {
  data: HistoryTrendPoint[];
}

function formatXAxis(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

export function HistoryTrendChart({ data }: HistoryTrendChartProps) {
  const t = useTranslations("history");

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tickFormatter={formatXAxis} stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" tickFormatter={(value) => `${value}`} />
          <Tooltip
            formatter={(value: number) => [
              `${value.toLocaleString()} ${t("tooltip.volume")}`,
              t("tooltip.label"),
            ]}
            labelFormatter={(label) => formatXAxis(String(label))}
          />
          <Area
            type="monotone"
            dataKey="totalVolume"
            stroke="#1d4ed8"
            fill="url(#volumeGradient)"
            strokeWidth={2}
            name={t("trend.volume")}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
