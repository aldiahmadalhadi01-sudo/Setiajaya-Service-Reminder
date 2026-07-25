import React from 'react';
import {
  Car,
  Wrench,
  CalendarCheck,
  AlertTriangle,
  Clock,
  Users
} from 'lucide-react';
import { DashboardKPI } from '../../types';

interface KpiCardsProps {
  kpis: DashboardKPI;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ kpis }) => {
  const cards = [
    {
      title: 'Total Unit DEC',
      value: kpis.totalUnitDEC,
      unit: 'Unit',
      icon: Car,
      color: 'bg-slate-100 text-slate-800 border-slate-200',
      iconBg: 'bg-[#0B192C] text-white',
      desc: 'Sertifikat Delivery & Sales'
    },
    {
      title: 'Unit Aktif Service',
      value: kpis.unitAktifService,
      unit: 'Entri',
      icon: Wrench,
      color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
      iconBg: 'bg-emerald-600 text-white',
      desc: 'Total histori service masuk'
    },
    {
      title: 'Jadwal Hari Ini',
      value: kpis.jadwalHariIni,
      unit: 'Customer',
      icon: CalendarCheck,
      color: 'bg-amber-500/10 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-500 text-white',
      desc: 'Jadwal tepat hari ini'
    },
    {
      title: 'Service Overdue',
      value: kpis.serviceOverdue,
      unit: 'Unit',
      icon: AlertTriangle,
      color: 'bg-rose-500/10 text-rose-700 border-rose-200',
      iconBg: 'bg-rose-600 text-white',
      desc: 'Perlu segera diprioritaskan'
    },
    {
      title: 'Reminder H-7',
      value: kpis.reminderH7,
      unit: 'Unit',
      icon: Clock,
      color: 'bg-orange-500/10 text-orange-700 border-orange-200',
      iconBg: 'bg-orange-500 text-white',
      desc: 'Jadwal service 1 - 7 hari lagi'
    },
    {
      title: 'Total Customer',
      value: kpis.totalCustomer,
      unit: 'Orang',
      icon: Users,
      color: 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
      iconBg: 'bg-indigo-600 text-white',
      desc: 'Basis data pelanggan aktif'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2.5 rounded-xl ${card.iconBg} shadow-xs`}>
                <Icon size={18} />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-950 tracking-tight">
                  {card.value.toLocaleString('id-ID')}
                </span>
                <span className="text-xs font-bold text-slate-600">
                  {card.unit}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-600 mt-1 truncate">
                {card.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
