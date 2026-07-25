import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, FileSpreadsheet } from 'lucide-react';
import Swal from 'sweetalert2';
import { DECRecord } from '../../types';
import { formatToDDMMYYYY, formatToYYYYMMDD } from '../../utils/formatters';

interface DecFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: DECRecord) => Promise<void>;
  initialData?: DECRecord | null;
}

export const DecFormModal: React.FC<DecFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const defaultFormData: DECRecord = {
    bulan: 'Januari 2025',
    tanggal_dec: new Date().toISOString().split('T')[0],
    nama_customer: '',
    payment: 'Cash',
    phone_customer: '',
    tipe_kendaraan: 'Avanza 1.5 G CVT',
    vin: '',
    sales: '',
    alamat: '',
    kota: 'Depok'
  };

  const [formData, setFormData] = useState<DECRecord>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        tanggal_dec: formatToYYYYMMDD(initialData.tanggal_dec)
      });
    } else {
      setFormData({
        ...defaultFormData,
        tanggal_dec: formatToYYYYMMDD(defaultFormData.tanggal_dec)
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vin || formData.vin.trim() === '') {
      Swal.fire({
        icon: 'error',
        title: 'Validasi Gagal',
        text: 'Nomor VIN kendaraan wajib diisi!',
        confirmButtonColor: '#001E50'
      });
      return;
    }

    if (!formData.nama_customer || formData.nama_customer.trim() === '') {
      Swal.fire({
        icon: 'error',
        title: 'Validasi Gagal',
        text: 'Nama Customer wajib diisi!',
        confirmButtonColor: '#001E50'
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload: DECRecord = {
        ...formData,
        tanggal_dec: formatToDDMMYYYY(formData.tanggal_dec)
      };
      await onSave(payload);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil Disimpan',
        text: initialData ? 'Data DEC berhasil diperbarui.' : 'Data DEC baru berhasil ditambahkan.',
        timer: 1500,
        showConfirmButton: false
      });
      onClose();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err.message || 'Terjadi kesalahan saat menyimpan data DEC.',
        confirmButtonColor: '#001E50'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#0B192C] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet size={20} className="text-slate-300" />
            <h3 className="text-base font-bold">
              {initialData ? 'Edit Data DEC' : 'Tambah Data Delivery Certificate (DEC)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bulan Periode <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="bulan"
                value={formData.bulan}
                onChange={handleChange}
                placeholder="Contoh: Januari 2025"
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal DEC <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="tanggal_dec"
                value={formData.tanggal_dec}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Customer <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="nama_customer"
                value={formData.nama_customer}
                onChange={handleChange}
                placeholder="Nama Lengkap Customer"
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No. HP / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="phone_customer"
                value={formData.phone_customer}
                onChange={handleChange}
                placeholder="0812xxxxxxxx"
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Metode Payment
              </label>
              <select
                name="payment"
                value={formData.payment}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="Kredit - TAF">Kredit - TAF</option>
                <option value="Kredit - ACC">Kredit - ACC</option>
                <option value="Kredit - Mandiri Utama Finance">Kredit - Mandiri Utama Finance</option>
                <option value="Kredit - BCA Finance">Kredit - BCA Finance</option>
                <option value="Cash Corporate">Cash Corporate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tipe Kendaraan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="tipe_kendaraan"
                value={formData.tipe_kendaraan}
                onChange={handleChange}
                placeholder="Contoh: Innova Zenix 2.0 Q Hybrid"
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor VIN (Rangka) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="vin"
                value={formData.vin}
                onChange={handleChange}
                placeholder="MHKC123456789000"
                required
                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Sales
              </label>
              <input
                type="text"
                name="sales"
                value={formData.sales}
                onChange={handleChange}
                placeholder="Sales Executive"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kota / Wilayah
              </label>
              <input
                type="text"
                name="kota"
                value={formData.kota}
                onChange={handleChange}
                placeholder="Depok / Bogor"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alamat Lengkap
            </label>
            <textarea
              name="alamat"
              value={formData.alamat}
              onChange={handleChange}
              rows={2}
              placeholder="Alamat domisili customer"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* Form Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setFormData(defaultFormData)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0B192C] hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save size={14} /> {submitting ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
