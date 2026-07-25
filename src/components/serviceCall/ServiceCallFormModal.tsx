import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Wrench, User, Car, FileText } from 'lucide-react';
import Swal from 'sweetalert2';
import { ServiceCallRecord } from '../../types';
import { formatToDDMMYYYY, formatToYYYYMMDD } from '../../utils/formatters';

interface ServiceCallFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: ServiceCallRecord) => Promise<void>;
  initialData?: ServiceCallRecord | null;
}

export const ServiceCallFormModal: React.FC<ServiceCallFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const defaultRecord: ServiceCallRecord = {
    week: 'W1',
    cabang: 'Setiajaya Toyota Depok',
    service_advisor: 'Andi Wijaya',
    tanggal_entry: new Date().toISOString().split('T')[0],
    call_id: `CALL-${Date.now().toString().slice(-4)}`,
    kode_customer: 'CUST-001',
    nama_customer: '',
    no_hp: '',
    no_wa: '',
    alamat: '',
    kelurahan: 'Pondok Cina',
    kecamatan: 'Beji',
    kota: 'Depok',
    kode_pos: '16424',
    ring_area: 'Ring 1',
    tipe_kendaraan: 'Avanza 1.5 G CVT',
    vin: '',
    no_mesin: '',
    no_polisi: '',
    tahun_rakit: '2024',
    tanggal_do: '',
    point_of_service: 'Bengkel Resmi Depok',
    problem_definition: 'Service Berkala 10.000 KM & Ganti Oli Engine',
    estimasi_harga: 1250000,
    no_voucher: '-',
    km_service: 10000,
    jenis_pekerjaan: 'Periodic Maintenance',
    tipe_promo: 'T-Care',
    ssc: 'No',
    dealer_penjual: 'Setiajaya Toyota Depok',
    group: 'Retail',
    area_dealer: 'Jabodetabek',
    t_Care: 'Ya',
    up_selling: '-',
    cross_selling: '-',
    no_so: `SO-${Math.floor(10000 + Math.random() * 90000)}`,
    tanggal_so: new Date().toISOString().split('T')[0],
    no_invoice: `INV-${Date.now().toString().slice(-6)}`,
    tanggal_invoice: new Date().toISOString().split('T')[0],
    next_service: '',
    so_key: '',
    invoice_key: '',
    alamat_domisili: '',
    ring_area_domisili: 'Ring 1',
    nama_laporan: 'Laporan Service Harian',
    periode: '2026'
  };

  const [formData, setFormData] = useState<ServiceCallRecord>(defaultRecord);
  const [activeTab, setActiveTab] = useState<'customer' | 'vehicle' | 'service' | 'invoice'>('customer');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        tanggal_entry: formatToYYYYMMDD(initialData.tanggal_entry),
        tanggal_invoice: formatToYYYYMMDD(initialData.tanggal_invoice),
        tanggal_so: initialData.tanggal_so ? formatToYYYYMMDD(initialData.tanggal_so) : '',
        tanggal_do: initialData.tanggal_do ? formatToYYYYMMDD(initialData.tanggal_do) : '',
        next_service: initialData.next_service ? formatToYYYYMMDD(initialData.next_service) : '',
      });
    } else {
      setFormData({
        ...defaultRecord,
        tanggal_entry: formatToYYYYMMDD(defaultRecord.tanggal_entry),
        tanggal_invoice: formatToYYYYMMDD(defaultRecord.tanggal_invoice),
        tanggal_so: formatToYYYYMMDD(defaultRecord.tanggal_so),
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

    if (!formData.no_invoice || formData.no_invoice.trim() === '') {
      Swal.fire({
        icon: 'error',
        title: 'Validasi Gagal',
        text: 'Nomor Invoice wajib diisi!',
        confirmButtonColor: '#001E50'
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload: ServiceCallRecord = {
        ...formData,
        tanggal_entry: formatToDDMMYYYY(formData.tanggal_entry),
        tanggal_invoice: formatToDDMMYYYY(formData.tanggal_invoice),
        tanggal_so: formData.tanggal_so ? formatToDDMMYYYY(formData.tanggal_so) : '',
        tanggal_do: formData.tanggal_do ? formatToDDMMYYYY(formData.tanggal_do) : '',
        next_service: formData.next_service ? formatToDDMMYYYY(formData.next_service) : '',
      };
      await onSave(payload);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil Disimpan',
        text: initialData ? 'Data Service Call diperbarui.' : 'Data Service Call baru ditambahkan.',
        timer: 1500,
        showConfirmButton: false
      });
      onClose();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err.message,
        confirmButtonColor: '#001E50'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#001E50] text-white p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Wrench size={20} className="text-blue-300" />
            <h3 className="text-base font-bold">
              {initialData ? 'Edit Service Call Record' : 'Input Data Service Call Baru (46 Header)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('customer')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer ${
              activeTab === 'customer'
                ? 'bg-white text-blue-900 border-slate-200 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 border-transparent'
            }`}
          >
            <User size={14} /> Data Customer & Domisili
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vehicle')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer ${
              activeTab === 'vehicle'
                ? 'bg-white text-blue-900 border-slate-200 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 border-transparent'
            }`}
          >
            <Car size={14} /> Data Kendaraan & VIN
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('service')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer ${
              activeTab === 'service'
                ? 'bg-white text-blue-900 border-slate-200 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 border-transparent'
            }`}
          >
            <Wrench size={14} /> Pekerjaan & SA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('invoice')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer ${
              activeTab === 'invoice'
                ? 'bg-white text-blue-900 border-slate-200 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 border-transparent'
            }`}
          >
            <FileText size={14} /> SO, Invoice & Next Service
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: CUSTOMER */}
          {activeTab === 'customer' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Customer</label>
                <input type="text" name="kode_customer" value={formData.kode_customer} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Customer *</label>
                <input type="text" name="nama_customer" value={formData.nama_customer} onChange={handleChange} required className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. HP</label>
                <input type="text" name="no_hp" value={formData.no_hp} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp</label>
                <input type="text" name="no_wa" value={formData.no_wa} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kelurahan</label>
                <input type="text" name="kelurahan" value={formData.kelurahan} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kecamatan</label>
                <input type="text" name="kecamatan" value={formData.kecamatan} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kota / Kab</label>
                <input type="text" name="kota" value={formData.kota} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Pos</label>
                <input type="text" name="kode_pos" value={formData.kode_pos} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ring Area</label>
                <select name="ring_area" value={formData.ring_area} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white">
                  <option value="Ring 1">Ring 1</option>
                  <option value="Ring 2">Ring 2</option>
                  <option value="Ring 3">Ring 3</option>
                  <option value="Outer">Outer</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Domisili Lengkap</label>
                <textarea name="alamat" value={formData.alamat} onChange={handleChange} rows={2} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
            </div>
          )}

          {/* TAB 2: VEHICLE */}
          {activeTab === 'vehicle' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">VIN (Rangka) *</label>
                <input type="text" name="vin" value={formData.vin} onChange={handleChange} required className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 uppercase" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. Polisi *</label>
                <input type="text" name="no_polisi" value={formData.no_polisi} onChange={handleChange} required className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 uppercase" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Kendaraan</label>
                <input type="text" name="tipe_kendaraan" value={formData.tipe_kendaraan} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. Mesin</label>
                <input type="text" name="no_mesin" value={formData.no_mesin} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Rakit</label>
                <input type="text" name="tahun_rakit" value={formData.tahun_rakit} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal DO</label>
                <input type="date" name="tanggal_do" value={formData.tanggal_do} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dealer Penjual</label>
                <input type="text" name="dealer_penjual" value={formData.dealer_penjual} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Group / Segmen</label>
                <input type="text" name="group" value={formData.group} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Area Dealer</label>
                <input type="text" name="area_dealer" value={formData.area_dealer} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
            </div>
          )}

          {/* TAB 3: SERVICE */}
          {activeTab === 'service' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cabang Service</label>
                <input type="text" name="cabang" value={formData.cabang} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service Advisor (SA)</label>
                <input type="text" name="service_advisor" value={formData.service_advisor} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Entry</label>
                <input type="date" name="tanggal_entry" value={formData.tanggal_entry} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kilometer Service (KM)</label>
                <input type="number" name="km_service" value={formData.km_service} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Pekerjaan</label>
                <input type="text" name="jenis_pekerjaan" value={formData.jenis_pekerjaan} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">T-Care Status</label>
                <select name="t_Care" value={formData.t_Care} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white">
                  <option value="Ya">Ya</option>
                  <option value="Tidak">Tidak</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Keluhan / Problem Definition</label>
                <textarea name="problem_definition" value={formData.problem_definition} onChange={handleChange} rows={2} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
            </div>
          )}

          {/* TAB 4: INVOICE */}
          {activeTab === 'invoice' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. Invoice *</label>
                <input type="text" name="no_invoice" value={formData.no_invoice} onChange={handleChange} required className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Invoice *</label>
                <input type="date" name="tanggal_invoice" value={formData.tanggal_invoice} onChange={handleChange} required className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. SO</label>
                <input type="text" name="no_so" value={formData.no_so} onChange={handleChange} className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estimasi Harga (Rp)</label>
                <input type="number" name="estimasi_harga" value={formData.estimasi_harga} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jadwal Next Service</label>
                <input type="date" name="next_service" value={formData.next_service} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. Voucher</label>
                <input type="text" name="no_voucher" value={formData.no_voucher} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200" />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setFormData(defaultRecord)}
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
              className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save size={14} /> {submitting ? 'Menyimpan...' : 'Simpan Service Call'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
