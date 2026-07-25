import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowRight,
  Layers,
  FileCheck
} from 'lucide-react';
import Swal from 'sweetalert2';
import { DECRecord, ImportResult } from '../../types';
import {
  parseFileToData,
  parseSheetDataByName,
  validateAndProcessDECImport,
  exportToCSV
} from '../../utils/excelParser';

interface DecImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (records: DECRecord[]) => Promise<void>;
}

export const DecImportModal: React.FC<DecImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload & Preview, 2: Mapping, 3: Result
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = async (selectedFile: File) => {
    try {
      setLoading(true);
      setFile(selectedFile);
      const parsed = await parseFileToData(selectedFile);
      setSheets(parsed.sheetNames);
      setSelectedSheet(parsed.selectedSheet);
      setHeaders(parsed.headers);
      setRows(parsed.rows);

      // Auto header mapping
      const autoMap: Record<string, string> = {
        bulan: parsed.headers.find(h => /bulan/i.test(h)) || 'bulan',
        tanggal_dec: parsed.headers.find(h => /tanggal_dec|tgl_dec|dec_date/i.test(h)) || 'tanggal_dec',
        nama_customer: parsed.headers.find(h => /nama_customer|customer|nama/i.test(h)) || 'nama_customer',
        payment: parsed.headers.find(h => /payment|pembayaran/i.test(h)) || 'payment',
        phone_customer: parsed.headers.find(h => /phone|hp|wa|telepon/i.test(h)) || 'phone_customer',
        tipe_kendaraan: parsed.headers.find(h => /tipe|kendaraan|model/i.test(h)) || 'tipe_kendaraan',
        vin: parsed.headers.find(h => /vin|rangka|chassis/i.test(h)) || 'vin',
        sales: parsed.headers.find(h => /sales|wiraniaga/i.test(h)) || 'sales',
        alamat: parsed.headers.find(h => /alamat|domisili/i.test(h)) || 'alamat',
        kota: parsed.headers.find(h => /kota|kabupaten/i.test(h)) || 'kota'
      };
      setMapping(autoMap);
      setStep(1);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Membaca File',
        text: err.message || 'File tidak valid atau rusak.',
        confirmButtonColor: '#001E50'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSheetChange = async (sheetName: string) => {
    if (!file) return;
    try {
      setLoading(true);
      setSelectedSheet(sheetName);
      const parsed = await parseSheetDataByName(file, sheetName);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const executeImport = async () => {
    if (!rows || rows.length === 0) return;
    try {
      setLoading(true);
      const { validData, result } = validateAndProcessDECImport(rows, mapping);
      setImportResult(result);

      if (validData.length > 0) {
        await onImportSuccess(validData);
      }

      setStep(3);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Proses Import Gagal',
        text: err.message,
        confirmButtonColor: '#001E50'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#0B192C] text-white p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Upload size={20} className="text-slate-300" />
            <div>
              <h3 className="text-base font-bold">Import Data DEC (CSV / Excel)</h3>
              <p className="text-xs text-slate-300">
                Unggah berkas CSV/XLSX untuk menambahkan data DEC secara otomatis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-4 border-b border-slate-200 pb-4">
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 1 ? 'text-slate-950' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? 'bg-[#0B192C] text-white font-bold' : 'bg-slate-200 text-slate-600'}`}>1</span>
              File & Preview
            </div>
            <ArrowRight size={14} className="text-slate-300" />
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 2 ? 'text-slate-950' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'bg-[#0B192C] text-white font-bold' : 'bg-slate-200 text-slate-600'}`}>2</span>
              Header Mapping
            </div>
            <ArrowRight size={14} className="text-slate-300" />
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 3 ? 'text-slate-950' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 3 ? 'bg-[#0B192C] text-white font-bold' : 'bg-slate-200 text-slate-600'}`}>3</span>
              Hasil Import
            </div>
          </div>

          {/* STEP 1: Upload & Preview */}
          {step === 1 && (
            <div className="space-y-4">
              {!file ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-slate-300 bg-slate-50/60 rounded-2xl p-10 text-center flex flex-col items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet size={48} className="text-slate-800 mb-3" />
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    Tarik & Lepas File CSV / Excel (.xlsx, .xls) di sini
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Atau klik tombol di bawah untuk memilih file dari perangkat Anda
                  </p>
                  <label className="px-5 py-2.5 rounded-xl bg-[#0B192C] text-white text-xs font-bold cursor-pointer hover:bg-slate-800 shadow-xs">
                    Pilih File
                    <input
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileCheck size={24} className="text-emerald-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">{file.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {(file.size / 1024).toFixed(1)} KB • {rows.length} Baris terdeteksi
                        </div>
                      </div>
                    </div>

                    {/* Sheet Selector if multi-sheet Excel */}
                    {sheets.length > 1 && (
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-slate-400" />
                        <select
                          value={selectedSheet}
                          onChange={(e) => handleSheetChange(e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
                        >
                          {sheets.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Table Preview */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-700 mb-2">
                      Pratinjau Data File (5 Baris Pertama)
                    </h5>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100 font-bold border-b border-slate-200">
                            {headers.map((h, i) => (
                              <th key={i} className="p-2.5">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                              {headers.map((h, j) => (
                                <td key={j} className="p-2.5">{row[h] || '-'}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Header Mapping */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 font-medium">
                Sesuaikan nama kolom dari file Anda dengan header resmi spreadsheet DEC:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'bulan', label: 'Bulan' },
                  { key: 'tanggal_dec', label: 'Tanggal DEC' },
                  { key: 'nama_customer', label: 'Nama Customer' },
                  { key: 'phone_customer', label: 'No. HP / WA' },
                  { key: 'payment', label: 'Metode Pembayaran' },
                  { key: 'tipe_kendaraan', label: 'Tipe Kendaraan' },
                  { key: 'vin', label: 'Nomor VIN (Rangka)' },
                  { key: 'sales', label: 'Sales Wiraniaga' },
                  { key: 'alamat', label: 'Alamat' },
                  { key: 'kota', label: 'Kota / Kabupaten' }
                ].map((field) => (
                  <div key={field.key} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-800">{field.label}</span>
                    <select
                      value={mapping[field.key] || ''}
                      onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold w-48"
                    >
                      <option value="">-- Pilih Kolom File --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Result Summary */}
          {step === 3 && importResult && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Proses Import Selesai
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Data DEC telah berhasil diproses dan ditambahkan ke spreadsheet.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
                  <span className="block text-2xl font-black text-slate-900">{importResult.total}</span>
                  <span className="text-xs text-slate-500 font-medium">Total Baris</span>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="block text-2xl font-black text-emerald-700">{importResult.success}</span>
                  <span className="text-xs text-emerald-600 font-medium">Berhasil</span>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="block text-2xl font-black text-rose-700">{importResult.failed}</span>
                  <span className="text-xs text-rose-600 font-medium">Gagal</span>
                </div>
              </div>

              {/* Error log download if any failed */}
              {importResult.errors.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => exportToCSV('Error_Log_Import_DEC', importResult.errors)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold hover:bg-rose-200 transition-colors"
                  >
                    <Download size={14} /> Unduh Log Error ({importResult.errors.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
          >
            {step === 3 ? 'Tutup' : 'Batal'}
          </button>

          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
              >
                Kembali
              </button>
            )}

            {step === 1 && file && (
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0B192C] text-white text-xs font-bold hover:bg-slate-800 cursor-pointer shadow-xs"
              >
                Lanjut Mapping <ArrowRight size={14} />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={executeImport}
                disabled={loading}
                className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {loading ? 'Memproses...' : 'Mulai Import Data'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
