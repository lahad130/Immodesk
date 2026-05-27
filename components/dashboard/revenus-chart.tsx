'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface RevenusChartProps {
  data: { month: string; attendus: number; recus: number }[]
}

function formatK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

interface TooltipPayload {
  name: string
  value: number
  color: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1f1f1f] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs">
      <p className="text-[#888] mb-1.5 font-semibold uppercase tracking-wide">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
          <span className="text-[#aaa]">{entry.name === 'attendus' ? 'Attendus' : 'Reçus'} :</span>
          <span className="text-white font-semibold">{formatK(entry.value)} FCFA</span>
        </div>
      ))}
    </div>
  )
}

export default function RevenusChart({ data }: RevenusChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={4} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#555', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatK}
          tick={{ fill: '#555', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#666', paddingTop: 12 }}
          formatter={(value: string) => (value === 'attendus' ? 'Attendus' : 'Reçus')}
        />
        <Bar dataKey="attendus" fill="rgba(255,255,255,0.08)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="recus" fill="#3ECF8E" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
