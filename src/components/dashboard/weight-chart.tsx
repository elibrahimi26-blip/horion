"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { label: string; weightKg: number };

export function WeightChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Aucune mesure encore. Enregistre ton poids pour voir ta courbe.
      </p>
    );
  }

  if (data.length === 1) {
    const single = data[0]!;
    return (
      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Une seule mesure ({single.weightKg} kg, {single.label}). Reviens
        régulièrement pour voir ta courbe se dessiner.
      </p>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={["dataMin - 2", "dataMax + 2"]}
            tick={{ fontSize: 11 }}
            width={40}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 6,
              fontSize: 12,
              border: "1px solid hsl(var(--border))",
            }}
            formatter={(value: number) => [`${value} kg`, "Poids"]}
          />
          <Line
            type="monotone"
            dataKey="weightKg"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
