import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "../../utils/cn";

export type ChartType = "line" | "bar" | "area" | "pie";

/** Palet warna default, diambil dari token CSS di index.css (ikut berubah di dark mode). */
const DEFAULT_PALETTE = [
  "var(--blue-700)",
  "var(--teal-700)",
  "var(--purple-700)",
  "var(--amber-700)",
  "var(--pink-700)",
  "var(--green-700)",
];

export interface ChartSeries {
  /** Key field di tiap objek `data` yang mau diplot. */
  dataKey: string;
  /** Label untuk legend/tooltip. Default pakai dataKey. */
  label?: string;
  /** Override warna (default ambil dari palette berurutan). */
  color?: string;
}

export interface ChartProps {
  type: ChartType;
  /** Array data, tiap objek merepresentasikan satu titik/kategori. */
  data: Record<string, string | number>[];
  /** Key di `data` yang dipakai sebagai label sumbu X (line/bar/area) atau nama slice (pie). */
  xKey: string;
  /** Satu atau lebih series yang mau diplot. Untuk pie, hanya series pertama yang dipakai. */
  series: ChartSeries[];
  height?: number;
  /** Tampilkan grid garis putus-putus di belakang chart. */
  showGrid?: boolean;
  /** Tampilkan legend di bawah chart. */
  showLegend?: boolean;
  className?: string;
}

function useSeriesColors(series: ChartSeries[]): ChartSeries[] {
  return useMemo(
    () =>
      series.map((s, idx) => ({
        ...s,
        color: s.color ?? DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length],
      })),
    [series],
  );
}

const TOOLTIP_STYLE = {
  backgroundColor: "var(--background-100)",
  border: "1px solid var(--gray-alpha-400)",
  borderRadius: "8px",
  fontSize: "12px",
  boxShadow: "var(--shadow-menu)",
};

export function Chart({
  type,
  data,
  xKey,
  series,
  height = 280,
  showGrid = true,
  showLegend = false,
  className,
}: ChartProps) {
  const resolvedSeries = useSeriesColors(series);

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {type === "line" ? (
          <LineChart
            data={data}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--gray-alpha-300)"
              />
            )}
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: "var(--gray-700)" }}
              axisLine={{ stroke: "var(--gray-alpha-400)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--gray-700)" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {resolvedSeries.map((s) => (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.label ?? s.dataKey}
                stroke={s.color}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 0, fill: s.color }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        ) : type === "bar" ? (
          <BarChart
            data={data}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--gray-alpha-300)"
              />
            )}
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: "var(--gray-700)" }}
              axisLine={{ stroke: "var(--gray-alpha-400)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--gray-700)" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "var(--gray-100)" }}
            />
            {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {resolvedSeries.map((s) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.label ?? s.dataKey}
                fill={s.color}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        ) : type === "area" ? (
          <AreaChart
            data={data}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--gray-alpha-300)"
              />
            )}
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: "var(--gray-700)" }}
              axisLine={{ stroke: "var(--gray-alpha-400)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--gray-700)" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {resolvedSeries.map((s) => (
              <Area
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.label ?? s.dataKey}
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        ) : (
          <PieChart>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
            <Pie
              data={data}
              dataKey={resolvedSeries[0]?.dataKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}>
              {data.map((_, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length]}
                />
              ))}
            </Pie>
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
