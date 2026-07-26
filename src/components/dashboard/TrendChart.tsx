import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, Calendar, Filter } from 'lucide-react';
import { ServiceCallRecord, TrendDataPoint } from '../../types';

interface TrendChartProps {
  data?: TrendDataPoint[];
  serviceCallList?: ServiceCallRecord[];
  period?: 'daily' | 'weekly' | 'monthly';
  setPeriod?: (period: 'daily' | 'weekly' | 'monthly') => void;
}

const MONTH_NAMES = [
  { value: 1, label: 'Januari', short: 'Jan' },
  { value: 2, label: 'Februari', short: 'Feb' },
  { value: 3, label: 'Maret', short: 'Mar' },
  { value: 4, label: 'April', short: 'Apr' },
  { value: 5, label: 'Mei', short: 'Mei' },
  { value: 6, label: 'Juni', short: 'Jun' },
  { value: 7, label: 'Juli', short: 'Jul' },
  { value: 8, label: 'Agustus', short: 'Agt' },
  { value: 9, label: 'September', short: 'Sep' },
  { value: 10, label: 'Oktober', short: 'Okt' },
  { value: 11, label: 'November', short: 'Nov' },
  { value: 12, label: 'Desember', short: 'Des' }
];

function getRecordEntryDate(s: ServiceCallRecord): string {
  if (s.tanggal_entry && String(s.tanggal_entry).trim() !== '') {
    return String(s.tanggal_entry).trim();
  }
  if (s.tanggal_invoice && String(s.tanggal_invoice).trim() !== '') {
    return String(s.tanggal_invoice).trim();
  }
  if (s.tanggal_so && String(s.tanggal_so).trim() !== '') {
    return String(s.tanggal_so).trim();
  }
  return '';
}

function parseDateString(dateStr: string | undefined | null): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  if (!str) return null;

  // 1. Handle Excel serial numbers (e.g. 45480)
  if (/^\d{5}(\.\d+)?$/.test(str)) {
    const num = parseFloat(str);
    if (num > 25000 && num < 60000) {
      const utc_days = Math.floor(num - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      if (!isNaN(date_info.getTime())) {
        return {
          year: date_info.getUTCFullYear(),
          month: date_info.getUTCMonth() + 1,
          day: date_info.getUTCDate()
        };
      }
    }
  }

  // 2. Format YYYY-MM-DD or YYYY/MM/DD or ISO like 2026-07-20T00:00:00
  const ymd = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymd) {
    const year = parseInt(ymd[1], 10);
    const month = parseInt(ymd[2], 10);
    const day = parseInt(ymd[3], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  // 3. Format DD-MM-YYYY or DD/MM/YYYY
  const dmy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10);
    const year = parseInt(dmy[3], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  // 4. JS Date fallback
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate()
    };
  }

  return null;
}

function normalizeWeek(weekStr: string | undefined | null): 'W1' | 'W2' | 'W3' | 'W4' | 'W5' | null {
  if (!weekStr) return null;
  const str = String(weekStr).trim().toUpperCase();
  if (str === 'W1' || str === '1' || str === 'WEEK 1' || str === 'MINGGU 1' || str === 'W-1') return 'W1';
  if (str === 'W2' || str === '2' || str === 'WEEK 2' || str === 'MINGGU 2' || str === 'W-2') return 'W2';
  if (str === 'W3' || str === '3' || str === 'WEEK 3' || str === 'MINGGU 3' || str === 'W-3') return 'W3';
  if (str === 'W4' || str === '4' || str === 'WEEK 4' || str === 'MINGGU 4' || str === 'W-4') return 'W4';
  if (str === 'W5' || str === '5' || str === 'WEEK 5' || str === 'MINGGU 5' || str === 'W-5') return 'W5';

  const m = str.match(/([1-5])/);
  if (m) {
    return `W${m[1]}` as 'W1' | 'W2' | 'W3' | 'W4' | 'W5';
  }

  return null;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data: propsData,
  serviceCallList = [],
  period: propsPeriod,
  setPeriod: propsSetPeriod
}) => {
  const [internalPeriod, setInternalPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const period = propsPeriod || internalPeriod;

  const setPeriod = (p: 'daily' | 'weekly' | 'monthly') => {
    setInternalPeriod(p);
    if (propsSetPeriod) propsSetPeriod(p);
  };

  // Extract available years from dataset using tanggal_entry
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    const currentYear = new Date().getFullYear();
    yearsSet.add(currentYear);

    serviceCallList.forEach((s) => {
      const parsed = parseDateString(getRecordEntryDate(s));
      if (parsed) {
        yearsSet.add(parsed.year);
      }
    });

    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [serviceCallList]);

  // Determine latest year and month for initial filter state using tanggal_entry
  const latestDateInfo = useMemo(() => {
    let latestYr = new Date().getFullYear();
    let latestMo = new Date().getMonth() + 1;
    let maxTimestamp = 0;

    serviceCallList.forEach((s) => {
      const dateStr = getRecordEntryDate(s);
      if (!dateStr) return;
      const parsed = parseDateString(dateStr);
      if (parsed) {
        const timeVal = Date.UTC(parsed.year, parsed.month - 1, parsed.day);
        if (timeVal > maxTimestamp) {
          maxTimestamp = timeVal;
          latestYr = parsed.year;
          latestMo = parsed.month;
        }
      }
    });

    return { year: latestYr, month: latestMo };
  }, [serviceCallList]);

  const [selectedMonth, setSelectedMonth] = useState<number>(latestDateInfo.month);
  const [selectedYear, setSelectedYear] = useState<number>(latestDateInfo.year);

  // Sync initial selections if dataset loads
  useEffect(() => {
    if (serviceCallList.length > 0) {
      setSelectedMonth(latestDateInfo.month);
      setSelectedYear(latestDateInfo.year);
    }
  }, [latestDateInfo.month, latestDateInfo.year, serviceCallList.length]);

  // Compute filtered trend data strictly from tanggal_entry
  const calculatedTrendData = useMemo<TrendDataPoint[]>(() => {
    if ((!serviceCallList || serviceCallList.length === 0) && propsData && propsData.length > 0) {
      return propsData;
    }

    if (period === 'daily') {
      // Harian: Filter by selectedMonth & selectedYear from tanggal_entry
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      const dailyCounts: Record<number, number> = {};

      serviceCallList.forEach((s) => {
        const parsed = parseDateString(getRecordEntryDate(s));
        if (parsed && parsed.year === selectedYear && parsed.month === selectedMonth) {
          dailyCounts[parsed.day] = (dailyCounts[parsed.day] || 0) + 1;
        }
      });

      const monthInfo = MONTH_NAMES.find((m) => m.value === selectedMonth);
      const shortMonth = monthInfo ? monthInfo.short : '';

      const result: TrendDataPoint[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        result.push({
          label: `${String(day).padStart(2, '0')} ${shortMonth}`,
          totalService: dailyCounts[day] || 0
        });
      }
      return result;
    }

    if (period === 'weekly') {
      // Mingguan: Filter by selectedMonth & selectedYear from tanggal_entry,
      // and aggregate by week column (strictly W1, W2, W3, W4, W5)
      const weekCounts: Record<string, number> = {
        W1: 0,
        W2: 0,
        W3: 0,
        W4: 0,
        W5: 0
      };

      serviceCallList.forEach((s) => {
        const parsed = parseDateString(getRecordEntryDate(s));
        if (parsed && parsed.year === selectedYear && parsed.month === selectedMonth) {
          const w = normalizeWeek(s.week);
          if (w && weekCounts[w] !== undefined) {
            weekCounts[w]++;
          }
        }
      });

      return (['W1', 'W2', 'W3', 'W4', 'W5'] as const).map((w) => ({
        label: w,
        totalService: weekCounts[w] || 0
      }));
    }

    if (period === 'monthly') {
      // Bulanan: Filter by selectedYear from tanggal_entry, aggregate by 12 months
      const monthlyCounts: Record<number, number> = {};
      for (let m = 1; m <= 12; m++) monthlyCounts[m] = 0;

      serviceCallList.forEach((s) => {
        const parsed = parseDateString(getRecordEntryDate(s));
        if (parsed && parsed.year === selectedYear) {
          monthlyCounts[parsed.month] = (monthlyCounts[parsed.month] || 0) + 1;
        }
      });

      return MONTH_NAMES.map((m) => ({
        label: m.short,
        totalService: monthlyCounts[m.value] || 0
      }));
    }

    return propsData || [];
  }, [serviceCallList, period, selectedMonth, selectedYear, propsData]);

  const totalFilteredServices = useMemo(() => {
    return calculatedTrendData.reduce((sum, item) => sum + item.totalService, 0);
  }, [calculatedTrendData]);

  const selectedMonthLabel = MONTH_NAMES.find((m) => m.value === selectedMonth)?.label || '';

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col h-full">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <TrendingUp size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Trend Service Kendaraan
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Total: {totalFilteredServices} Unit
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {period === 'daily' && `Grafik harian entry service bulan ${selectedMonthLabel} ${selectedYear}`}
            {period === 'weekly' && `Grafik mingguan (W1-W5) entry service bulan ${selectedMonthLabel} ${selectedYear}`}
            {period === 'monthly' && `Grafik bulanan entry service tahun ${selectedYear}`}
          </p>
        </div>

        {/* Filter & Period Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Month Filter Dropdown (Daily & Weekly) */}
          {(period === 'daily' || period === 'weekly') && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-700 transition-all shadow-2xs">
              <Calendar size={14} className="text-blue-600 flex-shrink-0" />
              <span className="text-[11px] text-slate-500 font-semibold hidden xs:inline">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                {MONTH_NAMES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Year Filter Dropdown (All periods) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-700 transition-all shadow-2xs">
            <Filter size={14} className="text-blue-600 flex-shrink-0" />
            <span className="text-[11px] text-slate-500 font-semibold hidden xs:inline">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Period Buttons */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setPeriod('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                period === 'daily'
                  ? 'bg-white text-blue-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Harian
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                period === 'weekly'
                  ? 'bg-white text-blue-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mingguan
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                period === 'monthly'
                  ? 'bg-white text-blue-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulanan
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={calculatedTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorService" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748B', fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tick={{ fill: '#64748B', fontSize: 11 }}
            />
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
              formatter={(val: any) => [`${val} Service`, 'Total']}
            />
            <Area
              type="monotone"
              dataKey="totalService"
              stroke="#1D4ED8"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorService)"
              activeDot={{ r: 6, fill: '#EB0A1E', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

