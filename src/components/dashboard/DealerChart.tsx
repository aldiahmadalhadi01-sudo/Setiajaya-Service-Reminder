import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { Store } from 'lucide-react';
import { DealerDistribution } from '../../types';

interface DealerChartProps {
  data: DealerDistribution[];
}

export const DealerChart: React.FC<DealerChartProps> = ({ data }) => {
  const COLORS = ['#001E50', '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA'];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-blue-100 text-blue-900">
          <Store size={18} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Top 5 Dealer Penjual
          </h3>
          <p className="text-xs text-slate-500">
            Distribusi berdasarkan kolom <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">dealer_penjual</code>
          </p>
        </div>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="dealer"
              axisLine={false}
              tickLine={false}
              width={130}
              tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderRadius: '12px',
                color: '#fff',
                border: 'none',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                fontSize: '12px'
              }}
              formatter={(val: any) => [`${val} Unit`, 'Penjualan']}
            />
            <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={22}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
