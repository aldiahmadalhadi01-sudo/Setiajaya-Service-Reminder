import React from 'react';
import {
  Clock,
  Wrench,
  UserCheck,
  Building,
  FileText,
  Calendar,
  Gauge,
  X,
  AlertCircle
} from 'lucide-react';
import { ServiceCallRecord } from '../../types';
import { formatDateIndonesian, formatCurrencyIDR, parseAnyDate } from '../../utils/formatters';

interface ServiceTimelineProps {
  vin: string;
  customerName: string;
  vehicleType: string;
  noPol: string;
  history: ServiceCallRecord[];
  onClose: () => void;
}

export const ServiceTimeline: React.FC<ServiceTimelineProps> = ({
  vin,
  customerName,
  vehicleType,
  noPol,
  history,
  onClose
}) => {
  const sortedHistory = [...history].sort((a, b) => {
    const dateA = (parseAnyDate(a.tanggal_entry || a.tanggal_invoice) || new Date(0)).getTime();
    const dateB = (parseAnyDate(b.tanggal_entry || b.tanggal_invoice) || new Date(0)).getTime();
    return dateB - dateA; // Newest to oldest
  });

  const latestKM = sortedHistory.length > 0 ? sortedHistory[0].km_service : 0;
  const totalBiaya = sortedHistory.reduce((acc, curr) => acc + (Number(curr.estimasi_harga) || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3.5 pb-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-100 font-mono font-bold text-xs tracking-wide">
                {noPol}
              </span>
              <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70">
                VIN: {vin}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mt-1.5">
              {vehicleType}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Pemilik / Customer: <span className="font-semibold text-slate-800">{customerName}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Tutup Detail"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Summary Badges - Soft Colors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-slate-50/80 border border-slate-200/60 p-2.5 rounded-xl">
            <span className="text-[10px] font-semibold text-slate-500 block">Total Kunjungan</span>
            <span className="text-sm font-bold text-slate-800">{sortedHistory.length} Kali</span>
          </div>
          <div className="bg-slate-50/80 border border-slate-200/60 p-2.5 rounded-xl">
            <span className="text-[10px] font-semibold text-slate-500 block">KM Terakhir</span>
            <span className="text-sm font-bold text-slate-800">{latestKM ? `${latestKM.toLocaleString('id-ID')} KM` : '-'}</span>
          </div>
          <div className="bg-slate-50/80 border border-slate-200/60 p-2.5 rounded-xl">
            <span className="text-[10px] font-semibold text-slate-500 block">Service Terakhir</span>
            <span className="text-xs font-bold text-slate-800 truncate block mt-0.5">
              {sortedHistory.length > 0
                ? formatDateIndonesian(sortedHistory[0].tanggal_entry || sortedHistory[0].tanggal_invoice)
                : '-'}
            </span>
          </div>
          <div className="bg-slate-50/80 border border-slate-200/60 p-2.5 rounded-xl">
            <span className="text-[10px] font-semibold text-slate-500 block">Total Estimasi</span>
            <span className="text-xs font-bold text-slate-800 truncate block mt-0.5">{formatCurrencyIDR(totalBiaya)}</span>
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto pt-4 pr-1 space-y-5">
        {sortedHistory.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            Belum ada histori entri service call untuk unit ini.
          </div>
        ) : (
          sortedHistory.map((item, idx) => (
            <div key={item.id || idx} className="relative pl-6 border-l-2 border-slate-200 group hover:border-slate-300 transition-colors">
              {/* Timeline Bullet */}
              <div className="absolute -left-[7px] top-0.5 w-3.5 h-3.5 rounded-full bg-slate-400 border-2 border-white group-hover:bg-blue-600 transition-all" />

              <div className="bg-slate-50/60 rounded-xl p-3.5 sm:p-4 border border-slate-200/80 hover:border-slate-300 hover:bg-white transition-all shadow-2xs space-y-2.5">
                {/* Date & Invoice */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-slate-100 text-slate-600">
                      <Calendar size={13} />
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      {formatDateIndonesian(item.tanggal_entry || item.tanggal_invoice)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.no_invoice && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200/70">
                        INV: {item.no_invoice}
                      </span>
                    )}
                    {item.no_so && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100/70 text-slate-600 font-medium">
                        SO: {item.no_so}
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200/60 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">KM Service</span>
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Gauge size={12} className="text-slate-400" />
                      {item.km_service} KM
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Jenis Pekerjaan</span>
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1 mt-0.5 truncate">
                      <Wrench size={12} className="text-slate-400" />
                      {item.jenis_pekerjaan || 'Service Berkala'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Estimasi Biaya</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">
                      {formatCurrencyIDR(item.estimasi_harga)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Service Advisor (SA)</span>
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 mt-0.5 truncate">
                      <UserCheck size={12} className="text-slate-400" />
                      {item.service_advisor || '-'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Dealer Penjual</span>
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 mt-0.5 truncate">
                      <Building size={12} className="text-slate-400" />
                      {item.dealer_penjual || '-'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Kategori Model</span>
                    <span className="text-xs font-semibold text-slate-700 block mt-0.5">
                      {item.kategori_model || 'Toyota'}
                    </span>
                  </div>
                </div>

                {/* Problem Definition */}
                <div className="text-xs pt-0.5">
                  <div className="flex items-center gap-1 text-slate-400 font-medium mb-0.5 text-[11px]">
                    <AlertCircle size={12} className="text-slate-400" /> Keluhan / Problem Definition:
                  </div>
                  <p className="text-slate-700 bg-slate-100/70 p-2 rounded-lg border border-slate-200/50 text-xs leading-relaxed">
                    {item.problem_definition || 'Service Berkala Routine'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
