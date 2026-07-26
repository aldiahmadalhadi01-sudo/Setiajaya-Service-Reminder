import React, { useState, useMemo } from 'react';
import { Award, Trophy, Medal, Calendar, Filter, Users } from 'lucide-react';
import { SALeaderboard, ServiceCallRecord } from '../../types';

interface LeaderboardSAProps {
  leaderboard?: SALeaderboard[];
  serviceCallList?: ServiceCallRecord[];
}

const MONTH_OPTIONS = [
  { value: 0, label: 'Semua Bulan' },
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' }
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

function parseDateString(dateStr: string | undefined | null): { year: number; month: number } | null {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  if (!str) return null;

  // 1. Excel serial number (e.g. 45480)
  if (/^\d{5}(\.\d+)?$/.test(str)) {
    const num = parseFloat(str);
    if (num > 25000 && num < 60000) {
      const utc_days = Math.floor(num - 25569);
      const utc_value = utc_days * 86400;
      const d = new Date(utc_value * 1000);
      if (!isNaN(d.getTime())) {
        return {
          year: d.getUTCFullYear(),
          month: d.getUTCMonth() + 1
        };
      }
    }
  }

  // 2. YYYY-MM-DD
  const ymd = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymd) {
    const year = parseInt(ymd[1], 10);
    const month = parseInt(ymd[2], 10);
    if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
      return { year, month };
    }
  }

  // 3. DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmy) {
    const month = parseInt(dmy[2], 10);
    const year = parseInt(dmy[3], 10);
    if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
      return { year, month };
    }
  }

  // 4. Standard Date
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1
    };
  }

  return null;
}

export const LeaderboardSA: React.FC<LeaderboardSAProps> = ({ leaderboard = [], serviceCallList = [] }) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // Default: Bulan ini
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear()); // Default: Tahun ini

  // Extract available years from dataset
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    const currentYear = new Date().getFullYear();
    yearsSet.add(currentYear);

    if (serviceCallList && serviceCallList.length > 0) {
      serviceCallList.forEach((s) => {
        const parsed = parseDateString(getRecordEntryDate(s));
        if (parsed) {
          yearsSet.add(parsed.year);
        }
      });
    }

    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [serviceCallList]);

  // Compute filtered SA leaderboard
  const computedLeaderboard = useMemo<SALeaderboard[]>(() => {
    if (!serviceCallList || serviceCallList.length === 0) {
      return leaderboard;
    }

    // Filter calls by selected month & year (based on tanggal_entry)
    const filteredCalls = serviceCallList.filter((s) => {
      const parsed = parseDateString(getRecordEntryDate(s));
      if (!parsed) return false;

      if (selectedYear !== 0 && parsed.year !== selectedYear) return false;
      if (selectedMonth !== 0 && parsed.month !== selectedMonth) return false;

      return true;
    });

    const totalFiltered = filteredCalls.length;
    if (totalFiltered === 0) return [];

    const counts: Record<string, number> = {};
    filteredCalls.forEach((s) => {
      const sa = (s.service_advisor && s.service_advisor.trim() !== '' && s.service_advisor.trim() !== '-')
        ? s.service_advisor.trim()
        : 'Unassigned';
      counts[sa] = (counts[sa] || 0) + 1;
    });

    const list = Object.keys(counts)
      .map((sa) => ({
        name: sa,
        totalService: counts[sa],
        percentage: Math.round((counts[sa] / totalFiltered) * 100),
        rank: 0
      }))
      .sort((a, b) => b.totalService - a.totalService);

    list.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return list;
  }, [serviceCallList, leaderboard, selectedMonth, selectedYear]);

  const totalServicesInPeriod = useMemo(() => {
    return computedLeaderboard.reduce((sum, item) => sum + item.totalService, 0);
  }, [computedLeaderboard]);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xs shadow-xs shrink-0">
            <Trophy size={14} />
          </div>
        );
      case 2:
        return (
          <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center font-black text-xs shadow-xs shrink-0">
            <Medal size={14} />
          </div>
        );
      case 3:
        return (
          <div className="w-7 h-7 rounded-full bg-amber-700 text-amber-100 flex items-center justify-center font-black text-xs shadow-xs shrink-0">
            <Medal size={14} />
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200 shrink-0">
            {rank}
          </div>
        );
    }
  };

  const selectedMonthLabel = MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label || '';

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0">
            <Award size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Leaderboard Service Advisor
            </h3>
            <p className="text-xs text-slate-500">
              Performa SA berdasarkan tanggal_entry service
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Calendar size={13} className="text-slate-500 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-1"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer border-l border-slate-300 pl-1.5"
            >
              <option value={0}>Semua Tahun</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200/70 whitespace-nowrap">
            {computedLeaderboard.length} SA ({totalServicesInPeriod} Unit)
          </span>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="divide-y divide-slate-100 overflow-y-auto max-h-80 pr-1 flex-1">
        {computedLeaderboard.length > 0 ? (
          computedLeaderboard.map((item) => (
            <div
              key={item.name}
              className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                {getRankBadge(item.rank)}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {item.name}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Service Advisor Setiajaya
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right shrink-0">
                <div className="w-24 hidden sm:block">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                    <span>Kontribusi</span>
                    <span>{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col min-w-[50px]">
                  <span className="text-sm font-black text-blue-900">
                    {item.totalService}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">
                    Unit
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
              <Users size={20} />
            </div>
            <p className="text-xs font-bold text-slate-700">Tidak ada data Service Advisor</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Untuk periode {selectedMonthLabel} {selectedYear !== 0 ? selectedYear : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
