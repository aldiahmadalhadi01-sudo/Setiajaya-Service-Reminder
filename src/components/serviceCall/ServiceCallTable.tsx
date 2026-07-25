import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Upload,
  Download,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Wrench,
  Gauge
} from 'lucide-react';
import Swal from 'sweetalert2';
import { ServiceCallRecord } from '../../types';
import { formatDateIndonesian, formatCurrencyIDR } from '../../utils/formatters';
import { exportToCSV, exportToExcel } from '../../utils/excelParser';

interface ServiceCallTableProps {
  data: ServiceCallRecord[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (record: ServiceCallRecord) => void;
  onDelete: (idOrInvoice: string) => Promise<void>;
  onOpenImport: () => void;
}

export const ServiceCallTable: React.FC<ServiceCallTableProps> = ({
  data,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onOpenImport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof ServiceCallRecord>('tanggal_invoice');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleSort = (field: keyof ServiceCallRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const q = searchTerm.toLowerCase();
      return (
        item.vin.toLowerCase().includes(q) ||
        item.no_invoice.toLowerCase().includes(q) ||
        item.no_polisi.toLowerCase().includes(q) ||
        item.nama_customer.toLowerCase().includes(q) ||
        item.service_advisor.toLowerCase().includes(q) ||
        item.tipe_kendaraan.toLowerCase().includes(q)
      );
    }).sort((a, b) => {
      let valA = a[sortField] ?? '';
      let valB = b[sortField] ?? '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [data, searchTerm, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleDeleteConfirm = (record: ServiceCallRecord) => {
    Swal.fire({
      title: 'Hapus Service Call?',
      text: `Apakah Anda yakin ingin menghapus invoice ${record.no_invoice} (${record.nama_customer})?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EB0A1E',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Ya, Hapus Data',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await onDelete(record.id || record.no_invoice);
          Swal.fire({
            icon: 'success',
            title: 'Terhapus',
            text: 'Data Service Call berhasil dihapus.',
            timer: 1500,
            showConfirmButton: false
          });
        } catch (err: any) {
          Swal.fire({
            icon: 'error',
            title: 'Gagal Menghapus',
            text: err.message,
            confirmButtonColor: '#001E50'
          });
        }
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
      {/* Table Controls */}
      <div className="p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="text-slate-800" size={20} />
            Data Activity Service Call (46 Column Enterprise)
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Manajemen lengkap histori service, SA, keluhan, dan billing kendaraan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari Invoice, VIN, No Pol..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 w-56 shadow-2xs"
            />
          </div>

          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition-all cursor-pointer border border-slate-300"
          >
            <Upload size={14} /> Import Data
          </button>

          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B192C] hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Plus size={16} /> Tambah Service Call
          </button>

          <button
            onClick={() => exportToCSV('ServiceCall_Data_Toyota', filteredData)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer border border-slate-200"
            title="Export CSV"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-h-96">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-extrabold uppercase tracking-wider">
              <th className="p-3.5 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('tanggal_invoice')}>
                <div className="flex items-center gap-1">Tgl Invoice <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-3.5 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('no_invoice')}>
                <div className="flex items-center gap-1">No Invoice <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-3.5">No. Polisi</th>
              <th className="p-3.5">Customer</th>
              <th className="p-3.5 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('vin')}>
                <div className="flex items-center gap-1">VIN <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-3.5">KM Service</th>
              <th className="p-3.5">Service Advisor</th>
              <th className="p-3.5">Pekerjaan</th>
              <th className="p-3.5">Biaya</th>
              <th className="p-3.5 text-center">Aksi</th>
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
                  Belum ada data Service Call. Silakan tambah atau import file.
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr key={row.id || row.no_invoice} className="hover:bg-slate-100/80 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900">{formatDateIndonesian(row.tanggal_invoice || row.tanggal_entry)}</td>
                  <td className="p-3.5 font-mono font-black text-slate-950">{row.no_invoice}</td>
                  <td className="p-3.5 font-mono font-bold text-slate-900">{row.no_polisi}</td>
                  <td className="p-3.5 font-black text-slate-950">{row.nama_customer}</td>
                  <td className="p-3.5 font-mono font-bold text-slate-800">{row.vin}</td>
                  <td className="p-3.5 font-bold text-slate-900">{row.km_service} KM</td>
                  <td className="p-3.5 text-slate-800 font-medium">{row.service_advisor}</td>
                  <td className="p-3.5 text-slate-800">{row.jenis_pekerjaan}</td>
                  <td className="p-3.5 font-black text-emerald-700">{formatCurrencyIDR(row.estimasi_harga)}</td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onEdit(row)}
                        className="p-1.5 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Edit Record"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteConfirm(row)}
                        className="p-1.5 rounded-lg text-slate-700 hover:text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                        title="Hapus Record"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          Menampilkan <span className="font-bold text-slate-900">{paginatedData.length}</span> dari{' '}
          <span className="font-bold text-slate-900">{filteredData.length}</span> data
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
