import React from 'react';
import { Award, User, Trophy, Medal } from 'lucide-react';
import { SALeaderboard } from '../../types';

interface LeaderboardSAProps {
  leaderboard: SALeaderboard[];
}

export const LeaderboardSA: React.FC<LeaderboardSAProps> = ({ leaderboard }) => {
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xs shadow-xs">
            <Trophy size={14} />
          </div>
        );
      case 2:
        return (
          <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center font-black text-xs shadow-xs">
            <Medal size={14} />
          </div>
        );
      case 3:
        return (
          <div className="w-7 h-7 rounded-full bg-amber-700 text-amber-100 flex items-center justify-center font-black text-xs shadow-xs">
            <Medal size={14} />
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200">
            {rank}
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
            <Award size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Leaderboard Service Advisor
            </h3>
            <p className="text-xs text-slate-500">
              Peringkat performa SA berdasarkan total unit service
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
          {leaderboard.length} SA Aktif
        </span>
      </div>

      <div className="divide-y divide-slate-100 overflow-y-auto max-h-80 pr-1">
        {leaderboard.map((item) => (
          <div
            key={item.name}
            className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-all"
          >
            <div className="flex items-center gap-3">
              {getRankBadge(item.rank)}
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900">
                  {item.name}
                </span>
                <span className="text-[11px] text-slate-500">
                  Service Advisor Setiajaya
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right">
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

              <div className="flex flex-col">
                <span className="text-sm font-black text-blue-900">
                  {item.totalService}
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Service
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
