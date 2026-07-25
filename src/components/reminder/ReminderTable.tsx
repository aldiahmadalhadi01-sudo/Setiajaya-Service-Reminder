import React, { useState, useMemo } from 'react';
import {
  Search,
  MessageCircle,
  Filter,
  Download,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { ServiceReminder, ReminderStatus } from '../../types';
import {
  formatDateIndonesian,
  createWhatsAppReminderLink
} from '../../utils/formatters';
import { exportToCSV, exportToExcel } from '../../utils/excelParser';

interface ReminderTableProps {
  reminders: ServiceReminder[];
  loading: boolean;
}

export const ReminderTable: React.FC<ReminderTableProps> = ({ reminders, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof ServiceReminder>('selisih_hari');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleSort = (field: keyof ServiceReminder) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filtered = useMemo(() => {
    return reminders.filter((item) => {
      const matchSearch =
        item.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.no_polisi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nama_customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tipe_kendaraan.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;

      return matchSearch && matchStatus;
    }).sort((a, b) => {
      let valA = a[sortField] ?? '';
      let valB = b[sortField] ?? '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [reminders, searchTerm, statusFilter, sortField, sortAsc]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const getStatusBadge = (status: ReminderStatus) => {
    switch (status) {
      case 'AMAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 size={12} /> AMAN
          </span>
        );
      case 'H-7':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock size={12} /> H-7 (Siap Call)
          </span>
        );
      case 'HARI INI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-900 border border-orange-300 animate-pulse">
            <Calendar size={12} /> HARI INI
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <AlertCircle size={12} /> OVERDUE
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
      {/* Header Controls */}
      <div className="p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Jadwal Service Berkala (Realtime Calculation)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dihitung otomatis: Service 1 (+1 bln DEC), Service 2 (+6 bln DEC), selanjutnya (+6 bln)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari VIN, No Polisi, Nama..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent w-60 shadow-2xs"
            />
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <Filter size={14} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="HARI INI">Hari Ini</option>
              <option value="H-7">H-7</option>
              <option value="OVERDUE">Overdue</option>
              <option value="AMAN">Aman</option>
            </select>
          </div>

          {/* Export Buttons */}
          <button
            onClick={() => exportToCSV('Reminder_Service_Toyota', filtered)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <Download size={14} /> CSV
          </button>
          <button
            onClick={() => exportToExcel('Reminder_Service_Toyota', filtered)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <Download size={14} /> Excel
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto min-h-96">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-extrabold uppercase tracking-wider">
              <th className="p-3.5 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('vin')}>
                <div className="flex items-center gap-1">VIN <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-3.5 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('no_polisi')}>
                <div className="flex items-center gap-1">No. Polisi <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-3.5 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('nama_customer')}>
                <div className="flex items-center gap-1">Customer <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-3.5">Tipe Kendaraan</th>
              <th className="p-3.5">KM Terakhir</th>
              <th className="p-3.5">Service Terakhir</th>
              <th className="p-3.5 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('jadwal_berikutnya')}>
                <div className="flex items-center gap-1">Jadwal Berikutnya <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-3.5 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('selisih_hari')}>
                <div className="flex items-center gap-1">Selisih <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-center">Aksi WA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={10} className="p-4 bg-slate-50/50">
                    <div className="h-4 bg-slate-200 rounded-md w-full" />
                  </td>
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500 font-medium">
                  Tidak ada data reminder service yang cocok.
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const waLink = createWhatsAppReminderLink(
                  row.no_hp,
                  row.nama_customer,
                  row.tipe_kendaraan,
                  row.no_polisi,
                  row.jadwal_berikutnya,
                  row.service_ke
                );

                return (
                  <tr key={row.vin} className="hover:bg-slate-100/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{row.vin}</td>
                    <td className="p-3.5 font-bold text-slate-950">{row.no_polisi}</td>
                    <td className="p-3.5 font-black text-slate-950">
                      {row.nama_customer}
                      <div className="text-[10px] font-medium text-slate-600">{row.no_hp || '-'}</div>
                    </td>
                    <td className="p-3.5 text-slate-900 font-semibold">{row.tipe_kendaraan}</td>
                    <td className="p-3.5 text-slate-900 font-bold">{row.km_terakhir} KM</td>
                    <td className="p-3.5 text-slate-800 font-medium">{formatDateIndonesian(row.service_terakhir)}</td>
                    <td className="p-3.5 font-black text-slate-950">{formatDateIndonesian(row.jadwal_berikutnya)}</td>
                    <td className="p-3.5 font-black text-slate-900">
                      {row.selisih_hari < 0
                        ? `${Math.abs(row.selisih_hari)} hari terlambat`
                        : row.selisih_hari === 0
                        ? 'Hari Ini'
                        : `${row.selisih_hari} hari lagi`}
                    </td>
                    <td className="p-3.5">{getStatusBadge(row.status)}</td>
                    <td className="p-3.5 text-center">
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all"
                        title="Kirim Pesan WhatsApp Reminder"
                      >
                        <MessageCircle size={14} /> WA Customer
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          Menampilkan <span className="font-bold text-slate-900">{paginatedData.length}</span> dari{' '}
          <span className="font-bold text-slate-900">{filtered.length}</span> unit
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-semibold">
            Halaman {currentPage} dari {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
