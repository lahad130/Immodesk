'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartPoint {
  month: string
  rate: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white shadow-lg border border-[#181818]/[0.08] rounded-xl px-3 py-2 text-xs">
      <p className="text-[#62605B] mb-0.5">{label}</p>
      <p className="text-[#1F8A5B] font-semibold">{payload[0].value}% occupé</p>
    </div>
  )
}

export default function OccupationChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
        <XAxis
          dataKey="month"
          stroke="#D9D7CC"
          tick={{ fill: '#91908C', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          stroke="#D9D7CC"
          tick={{ fill: '#91908C', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
          domain={[0, 100]}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(24,24,24,0.04)' }} />
        <Bar dataKey="rate" fill="#1F8A5B" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}
