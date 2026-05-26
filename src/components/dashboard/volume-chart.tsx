"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { weekKey: string; weekLabel: string; volume: number };

export function VolumeChart({ data }: { data: Point[] }) {
  const allZero = data.every((d) => d.volume === 0);

  if (allZero) {
    return (
      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Aucun volume sur les {data.length} dernières semaines. Termine des
        séries (poids × reps) pour alimenter ce graphe.
      </p>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="weekLabel" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            width={50}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
            }
          />
          <Tooltip
            contentStyle={{
              borderRadius: 6,
              fontSize: 12,
              border: "1px solid hsl(var(--border))",
            }}
            formatter={(value: number) => [
              `${value.toLocaleString("fr-FR")} kg·reps`,
              "Volume",
            ]}
            labelFormatter={(label: string) => `Semaine du ${label}`}
          />
          <Bar
            dataKey="volume"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
