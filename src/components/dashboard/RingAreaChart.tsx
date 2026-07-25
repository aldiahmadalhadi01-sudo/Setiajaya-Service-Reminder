import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { MapPin } from 'lucide-react';
import { RingAreaDistribution } from '../../types';

interface RingAreaChartProps {
  data: RingAreaDistribution[];
}

export const RingAreaChart: React.FC<RingAreaChartProps> = ({ data }) => {
  const COLORS: Record<string, string> = {
    'Ring 1': '#1D4ED8',
    'Ring 2': '#0284C7',
    'Ring 3': '#0D9488',
    'Outer': '#64748B'
  };

  const totalUnits = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-900">
          <MapPin size={18} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Distribusi Ring Area
          </h3>
          <p className="text-xs text-slate-500">
            Segmentasi lokasi berdasarkan Ring Area
          </p>
        </div>
      </div>

      <div className="relative w-full h-64 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="count"
              nameKey="ring"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.ring] || '#3B82F6'}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderRadius: '12px',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                fontSize: '12px'
              }}
              itemStyle={{ color: '#ffffff', fontWeight: 600 }}
              labelStyle={{ fontWeight: 'bold', color: '#ffffff' }}
              formatter={(val: any, name: any) => [
                `${val} Unit (${Math.round((val / (totalUnits || 1)) * 100)}%)`,
                name
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => (
                <span className="text-xs font-semibold text-slate-700 mr-2">
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Counter */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-6">
          <span className="text-xl font-black text-slate-900">
            {totalUnits}
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total Unit
          </span>
        </div>
      </div>
    </div>
  );
};
