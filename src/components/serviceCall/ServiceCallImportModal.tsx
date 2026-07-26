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
  FileCheck,
  CopyX
} from 'lucide-react';
import Swal from 'sweetalert2';
import { ServiceCallRecord, ImportResult } from '../../types';
import {
  parseFileToData,
  parseSheetDataByName,
  validateAndProcessServiceCallImport,
  exportToCSV
} from '../../utils/excelParser';

interface ServiceCallImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingData: ServiceCallRecord[];
  onImportSuccess: (records: ServiceCallRecord[], mode: string) => Promise<void>;
}

export const ServiceCallImportModal: React.FC<ServiceCallImportModalProps> = ({
  isOpen,
  onClose,
  existingData,
  onImportSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [duplicateMode, setDuplicateMode] = useState<'SKIP' | 'REPLACE' | 'IMPORT_ALL'>('SKIP');
  const [step, setStep] = useState<1 | 2 | 3>(1);
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

      // Auto map key fields
      const autoMap: Record<string, string> = {
        vin: parsed.headers.find(h => /vin|rangka/i.test(h)) || 'vin',
        tanggal_entry: parsed.headers.find(h => /tanggal_entry|tgl_entry|entry_date|tanggal_masuk|tgl_masuk/i.test(h)) || 'tanggal_entry',
        no_invoice: parsed.headers.find(h => /invoice|no_inv/i.test(h)) || 'no_invoice',
        tanggal_invoice: parsed.headers.find(h => /tanggal_invoice|tgl_inv/i.test(h)) || 'tanggal_invoice',
        nama_customer: parsed.headers.find(h => /nama_customer|customer/i.test(h)) || 'nama_customer',
        no_polisi: parsed.headers.find(h => /no_polisi|nopol/i.test(h)) || 'no_polisi',
        tipe_kendaraan: parsed.headers.find(h => /tipe_kendaraan|model/i.test(h)) || 'tipe_kendaraan',
        km_service: parsed.headers.find(h => /km_service|km/i.test(h)) || 'km_service',
        service_advisor: parsed.headers.find(h => /service_advisor|sa/i.test(h)) || 'service_advisor'
      };
      setMapping(autoMap);
      setStep(1);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Membaca File',
        text: err.message,
        confirmButtonColor: '#001E50'
      });
    } finally {
      setLoading(false);
    }
  };

  const executeImport = async () => {
    if (!rows || rows.length === 0) return;
    try {
      setLoading(true);
      const { validData, result } = validateAndProcessServiceCallImport(
        rows,
        mapping,
        existingData,
        duplicateMode
      );
      setImportResult(result);

      if (validData.length > 0) {
        await onImportSuccess(validData, duplicateMode);
      }

      setStep(3);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Proses Import',
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
        {/* Header */}
        <div className="bg-[#0B192C] text-white p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Upload size={20} className="text-slate-300" />
            <div>
              <h3 className="text-base font-bold">Import Data Service Call (CSV / Excel)</h3>
              <p className="text-xs text-slate-300">
                Unggah data entri service kendaraan dengan opsi penanganan duplikat
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

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-4 border-b border-slate-200 pb-4">
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 1 ? 'text-slate-950' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? 'bg-[#0B192C] text-white font-bold' : 'bg-slate-200 text-slate-600'}`}>1</span>
              File & Opsi
            </div>
            <ArrowRight size={14} className="text-slate-300" />
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 2 ? 'text-slate-950' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'bg-[#0B192C] text-white font-bold' : 'bg-slate-200 text-slate-600'}`}>2</span>
              Header Mapping
            </div>
            <ArrowRight size={14} className="text-slate-300" />
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 3 ? 'text-slate-950' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 3 ? 'bg-[#0B192C] text-white font-bold' : 'bg-slate-200 text-slate-600'}`}>3</span>
              Laporan Hasil
            </div>
          </div>

          {/* STEP 1 */}
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
                    Unggah File Service Call (.csv, .xlsx, .xls)
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Mendukung auto-detect delimiter CSV dan multi-sheet Excel
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
                          {rows.length} Baris terdeteksi
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Duplicate Mode Option */}
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                      <CopyX size={16} /> Penanganan Jika Ditemukan Duplikat Invoice / VIN:
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'SKIP', label: 'Abaikan (Skip)', desc: 'Lewati jika invoice sudah ada' },
                        { id: 'REPLACE', label: 'Timpa Data', desc: 'Perbarui data lama' },
                        { id: 'IMPORT_ALL', label: 'Import Semua', desc: 'Tetap tambahkan semua baris' }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setDuplicateMode(opt.id as any)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            duplicateMode === opt.id
                              ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-xs font-bold">{opt.label}</div>
                          <div className={`text-[10px] mt-0.5 ${duplicateMode === opt.id ? 'text-blue-200' : 'text-slate-500'}`}>
                            {opt.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 font-medium">
                Pencocokan Kolom Kunci Service Call:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'vin', label: 'Nomor VIN (Rangka) *' },
                  { key: 'tanggal_entry', label: 'Tanggal Entry Service *' },
                  { key: 'no_invoice', label: 'Nomor Invoice *' },
                  { key: 'tanggal_invoice', label: 'Tanggal Invoice *' },
                  { key: 'nama_customer', label: 'Nama Customer' },
                  { key: 'no_polisi', label: 'Nomor Polisi' },
                  { key: 'tipe_kendaraan', label: 'Tipe Kendaraan' },
                  { key: 'km_service', label: 'KM Service' },
                  { key: 'service_advisor', label: 'Service Advisor (SA)' }
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

          {/* STEP 3 */}
          {step === 3 && importResult && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Import Service Call Selesai
                </h3>
              </div>

              <div className="grid grid-cols-4 gap-3 max-w-xl mx-auto">
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
                  <span className="block text-xl font-black text-slate-900">{importResult.total}</span>
                  <span className="text-[11px] text-slate-500 font-medium">Total Baris</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="block text-xl font-black text-emerald-700">{importResult.success}</span>
                  <span className="text-[11px] text-emerald-600 font-medium">Berhasil</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="block text-xl font-black text-amber-700">{importResult.duplicates}</span>
                  <span className="text-[11px] text-amber-600 font-medium">Duplikat</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="block text-xl font-black text-rose-700">{importResult.failed}</span>
                  <span className="text-[11px] text-rose-600 font-medium">Gagal</span>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div>
                  <button
                    onClick={() => exportToCSV('Error_Log_ServiceCall_Import', importResult.errors)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold hover:bg-rose-200 transition-colors cursor-pointer"
                  >
                    <Download size={14} /> Unduh Log Error ({importResult.errors.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
          >
            {step === 3 ? 'Tutup' : 'Batal'}
          </button>

          <div className="flex items-center gap-2">
            {step === 1 && file && (
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0B192C] text-white text-xs font-bold hover:bg-slate-800 cursor-pointer shadow-xs"
              >
                Mapping Header <ArrowRight size={14} />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={executeImport}
                disabled={loading}
                className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {loading ? 'Memproses Import...' : 'Eksekusi Import Data'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
