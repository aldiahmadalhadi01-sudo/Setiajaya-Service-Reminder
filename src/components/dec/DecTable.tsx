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
  FileSpreadsheet
} from 'lucide-react';
import Swal from 'sweetalert2';
import { DECRecord } from '../../types';
import { formatDateIndonesian } from '../../utils/formatters';
import { exportToCSV, exportToExcel } from '../../utils/excelParser';

interface DecTableProps {
  data: DECRecord[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (record: DECRecord) => void;
  onDelete: (idOrVin: string) => Promise<void>;
  onOpenImport: () => void;
}

export const DecTable: React.FC<DecTableProps> = ({
  data,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onOpenImport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof DECRecord>('tanggal_dec');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleSort = (field: keyof DECRecord) => {
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
        item.nama_customer.toLowerCase().includes(q) ||
        item.tipe_kendaraan.toLowerCase().includes(q) ||
        item.phone_customer.toLowerCase().includes(q) ||
        item.sales.toLowerCase().includes(q)
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

  const handleDeleteConfirm = (record: DECRecord) => {
    Swal.fire({
      title: 'Hapus Data DEC?',
      text: `Apakah Anda yakin ingin menghapus DEC customer ${record.nama_customer} (${record.vin})?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EB0A1E',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Ya, Hapus Data',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await onDelete(record.id || record.vin);
          Swal.fire({
            icon: 'success',
            title: 'Terhapus',
            text: 'Data DEC berhasil dihapus.',
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
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="text-blue-600" size={20} />
            Data Delivery Certificate (DEC)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen data penyerahan kendaraan baru customer Setiajaya Toyota
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari VIN, Customer, Tipe..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 w-56 shadow-2xs"
            />
          </div>

          {/* Import Button */}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer border border-slate-200"
          >
            <Upload size={14} /> Import CSV/Excel
          </button>

          {/* Add DEC Button */}
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Plus size={16} /> Tambah DEC
          </button>

          {/* Export Buttons */}
          <button
            onClick={() => exportToCSV('DEC_Data_Toyota', filteredData)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            title="Export CSV"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-96">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <th className="p-3.5 cursor-pointer hover:bg-slate-200/60" onClick={() => handleSort('tanggal_dec')}>
                <div className="flex items-center gap-1">Tgl DEC <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-3.5 cursor-pointer hover:bg-slate-200/60" onClick={() => handleSort('nama_customer')}>
                <div className="flex items-center gap-1">Customer <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-3.5">Telepon</th>
              <th className="p-3.5 cursor-pointer hover:bg-slate-200/60" onClick={() => handleSort('tipe_kendaraan')}>
                <div className="flex items-center gap-1">Tipe Kendaraan <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-3.5 cursor-pointer hover:bg-slate-200/60" onClick={() => handleSort('vin')}>
                <div className="flex items-center gap-1">VIN <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-3.5">Pembayaran</th>
              <th className="p-3.5">Sales</th>
              <th className="p-3.5">Kota</th>
              <th className="p-3.5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={9} className="p-4 bg-slate-50/50">
                    <div className="h-4 bg-slate-200 rounded-md w-full" />
                  </td>
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500 font-medium">
                  Belum ada data DEC. Silakan tambah atau import data.
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr key={row.id || row.vin} className="hover:bg-blue-50/40 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900">{formatDateIndonesian(row.tanggal_dec)}</td>
                  <td className="p-3.5 font-bold text-blue-950">{row.nama_customer}</td>
                  <td className="p-3.5 font-medium text-slate-700">{row.phone_customer}</td>
                  <td className="p-3.5 text-slate-800 font-medium">{row.tipe_kendaraan}</td>
                  <td className="p-3.5 font-mono font-bold text-slate-900">{row.vin}</td>
                  <td className="p-3.5 text-slate-700">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-[11px]">
                      {row.payment}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-700 font-medium">{row.sales}</td>
                  <td className="p-3.5 text-slate-700">{row.kota}</td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onEdit(row)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-900 hover:bg-blue-100 transition-colors cursor-pointer"
                        title="Edit DEC"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteConfirm(row)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                        title="Hapus DEC"
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
