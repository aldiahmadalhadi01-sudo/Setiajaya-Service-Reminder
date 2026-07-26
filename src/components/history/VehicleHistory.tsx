import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Car,
  History,
  ChevronRight,
  User,
  Building,
  Calendar,
  Gauge
} from 'lucide-react';
import { ServiceCallRecord, VehicleUnitSummary } from '../../types';
import { formatDateIndonesian, parseAnyDate } from '../../utils/formatters';
import { ServiceTimeline } from './ServiceTimeline';

interface VehicleHistoryProps {
  serviceCalls: ServiceCallRecord[];
  loading: boolean;
}

export const VehicleHistory: React.FC<VehicleHistoryProps> = ({
  serviceCalls,
  loading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedVin, setSelectedVin] = useState<string | null>(null);

  // Summarize units from service calls
  const unitSummaries = useMemo<VehicleUnitSummary[]>(() => {
    const map: Record<string, VehicleUnitSummary> = {};

    serviceCalls.forEach((s) => {
      if (!s.vin) return;

      if (!map[s.vin]) {
        map[s.vin] = {
          vin: s.vin,
          no_polisi: s.no_polisi || '-',
          tipe_kendaraan: s.tipe_kendaraan || 'Toyota',
          nama_customer: s.nama_customer || 'Customer',
          no_hp: s.no_hp || '',
          dealer: s.dealer_penjual || 'Setiajaya Depok',
          total_kunjungan: 0,
          service_terakhir: s.tanggal_entry || s.tanggal_invoice || '',
          last_km: s.km_service || 0,
          history: []
        };
      }

      map[s.vin].total_kunjungan++;
      map[s.vin].history.push(s);

      // Keep latest service date based on tanggal_entry
      const currentDate = parseAnyDate(s.tanggal_entry || s.tanggal_invoice) || new Date(0);
      const latestDate = parseAnyDate(map[s.vin].service_terakhir) || new Date(0);
      if (currentDate > latestDate) {
        map[s.vin].service_terakhir = s.tanggal_entry || s.tanggal_invoice || '';
        map[s.vin].last_km = s.km_service || 0;
        map[s.vin].no_polisi = s.no_polisi || map[s.vin].no_polisi;
      }
    });

    // Sort units by service_terakhir DESC automatically
    return Object.values(map).sort((a, b) => {
      const dateA = (parseAnyDate(a.service_terakhir) || new Date(0)).getTime();
      const dateB = (parseAnyDate(b.service_terakhir) || new Date(0)).getTime();
      return dateB - dateA;
    });
  }, [serviceCalls]);

  // Set default selected VIN on first render if available
  React.useEffect(() => {
    if (unitSummaries.length > 0 && !selectedVin) {
      setSelectedVin(unitSummaries[0].vin);
    }
  }, [unitSummaries, selectedVin]);

  // Filter units
  const filteredUnits = useMemo(() => {
    return unitSummaries.filter((unit) => {
      const matchSearch =
        unit.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.no_polisi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.nama_customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.tipe_kendaraan.toLowerCase().includes(searchTerm.toLowerCase());

      let matchMonth = true;
      let matchYear = true;

      if (unit.service_terakhir) {
        const d = parseAnyDate(unit.service_terakhir);
        if (d) {
          if (selectedMonth !== 'ALL') {
            matchMonth = (d.getMonth() + 1).toString() === selectedMonth;
          }
          if (selectedYear !== 'ALL') {
            matchYear = d.getFullYear().toString() === selectedYear;
          }
        }
      }

      return matchSearch && matchMonth && matchYear;
    });
  }, [unitSummaries, searchTerm, selectedMonth, selectedYear]);

  const selectedUnit = useMemo(() => {
    return unitSummaries.find((u) => u.vin === selectedVin) || null;
  }, [unitSummaries, selectedVin]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left List Column */}
      <div className={`space-y-4 ${selectedUnit ? 'lg:col-span-4' : 'lg:col-span-12'}`}>
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="flex flex-col gap-3 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Riwayat Kendaraan Unit
              </h2>
              <p className="text-xs text-slate-500">
                Pilih unit kendaraan untuk melihat riwayat service
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Cari VIN, No Polisi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Month filter */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Bulan: Semua</option>
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={(i + 1).toString()}>
                    Bln {i + 1}
                  </option>
                ))}
              </select>

              {/* Year filter */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Thn: Semua</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
          </div>

          {/* List of Units */}
          <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
              ))
            ) : filteredUnits.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-medium text-xs">
                Tidak ada unit kendaraan yang ditemukan.
              </div>
            ) : (
              filteredUnits.map((unit) => {
                const isSelected = selectedVin === unit.vin;
                return (
                  <div
                    key={unit.vin}
                    onClick={() => setSelectedVin(unit.vin)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-slate-100/90 border-slate-400 shadow-2xs ring-1 ring-slate-300/70'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 rounded-lg flex-shrink-0 transition-colors ${
                        isSelected ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Car size={16} />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-xs text-slate-800 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/70">
                            {unit.no_polisi}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 truncate max-w-[100px]">
                            {unit.vin}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-800 truncate">
                          {unit.tipe_kendaraan}
                        </h4>
                        <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                          <User size={11} className="text-slate-400 flex-shrink-0" />
                          <span className="truncate">{unit.nama_customer}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 text-right">
                      <div>
                        <div className="text-[11px] font-bold text-slate-700 flex items-center justify-end gap-1">
                          <History size={11} className="text-slate-400" />
                          <span>{unit.total_kunjungan}x</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatDateIndonesian(unit.service_terakhir)}
                        </div>
                      </div>

                      <ChevronRight
                        size={15}
                        className={`transition-transform ${
                          isSelected ? 'text-slate-700 translate-x-0.5' : 'text-slate-300'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right Timeline Column */}
      {selectedUnit && (
        <div className="lg:col-span-8 h-[760px] sticky top-20">
          <ServiceTimeline
            vin={selectedUnit.vin}
            customerName={selectedUnit.nama_customer}
            vehicleType={selectedUnit.tipe_kendaraan}
            noPol={selectedUnit.no_polisi}
            history={selectedUnit.history}
            onClose={() => setSelectedVin(null)}
          />
        </div>
      )}
    </div>
  );
};
