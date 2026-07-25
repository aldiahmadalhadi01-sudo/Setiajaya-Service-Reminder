import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Globe,
  Database,
  ExternalLink,
  ShieldCheck,
  X,
  Play
} from 'lucide-react';
import Swal from 'sweetalert2';
import { GOOGLE_APPS_SCRIPT_CODE } from '../../services/codeGsTemplate';
import { APIConfig } from '../../types';
import { apiService } from '../../services/api';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: APIConfig;
  onSaveConfig: (config: APIConfig) => void;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig
}) => {
  const [copied, setCopied] = useState(false);
  const [webAppUrl, setWebAppUrl] = useState(config.webAppUrl || '');
  const [spreadsheetId, setSpreadsheetId] = useState(config.spreadsheetId || '1hFjw0SOG2Y32pO6H3PkLnHJxBbLrnP7p');
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Swal.fire({
      icon: 'success',
      title: 'Tersalin!',
      text: 'Kode code.gs telah disalin ke clipboard.',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleTestConnection = async () => {
    if (!webAppUrl || !webAppUrl.startsWith('http')) {
      Swal.fire({
        icon: 'warning',
        title: 'URL Tidak Valid',
        text: 'Masukkan URL Google Apps Script Web App yang valid.',
        confirmButtonColor: '#001E50'
      });
      return;
    }

    try {
      setTesting(true);
      const isOk = await apiService.testConnection(webAppUrl);
      if (isOk) {
        Swal.fire({
          icon: 'success',
          title: 'Koneksi Berhasil!',
          text: 'Aplikasi terhubung dengan REST API Google Spreadsheet!',
          confirmButtonColor: '#001E50'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Koneksi Gagal',
          text: 'Pastikan Web App diset "Execute as: Me" dan "Who has access: Anyone".',
          confirmButtonColor: '#001E50'
        });
      }
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Terhubung',
        text: 'Terjadi kesalahan jaringan atau CORS pada Google Apps Script.',
        confirmButtonColor: '#001E50'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveConfig({
      webAppUrl,
      useLocalStorageFallback: true,
      spreadsheetId
    });
    Swal.fire({
      icon: 'success',
      title: 'Konfigurasi Disimpan',
      text: 'Pengaturan endpoint Google Apps Script berhasil diperbarui.',
      timer: 1500,
      showConfirmButton: false
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0B192C] text-white p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Code2 size={22} className="text-slate-300" />
            <div>
              <h3 className="text-base font-bold">Google Apps Script REST API Backend (code.gs)</h3>
              <p className="text-xs text-slate-300">
                Salin kode backend, paste di script.google.com & set Spreadsheet ID
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
          {/* Endpoint Setup Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Globe size={16} className="text-blue-600" /> Web App REST API Endpoint URL
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={webAppUrl}
                onChange={(e) => setWebAppUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 bg-white"
              />
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-all cursor-pointer flex-shrink-0 flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Play size={14} /> {testing ? 'Menguji...' : 'Uji Koneksi'}
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Database size={12} /> Spreadsheet ID Target:
              <input
                type="text"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                className="px-2 py-0.5 rounded border border-slate-200 font-mono text-[11px] w-72 bg-white"
              />
            </div>
          </div>

          {/* Quick Setup Instructions */}
          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200/80 text-xs text-blue-950 space-y-2">
            <div className="font-bold text-sm flex items-center gap-2 text-blue-900">
              <ShieldCheck size={16} /> Langkah Deploy Google Apps Script:
            </div>
            <ol className="list-decimal list-inside space-y-1 font-medium text-slate-700">
              <li>Buat Google Spreadsheet baru dengan 2 sheet bernama: <code className="font-bold text-blue-900 bg-white px-1 py-0.5 rounded border border-blue-200">DEC</code> dan <code className="font-bold text-blue-900 bg-white px-1 py-0.5 rounded border border-blue-200">SERVICE_CALL</code>.</li>
              <li>Buka <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-blue-700 underline font-bold inline-flex items-center gap-0.5">script.google.com <ExternalLink size={10} /></a> dan buat Project Baru.</li>
              <li>Salin seluruh kode <code className="font-mono font-bold">code.gs</code> di bawah ini dan tempelkan di Script Editor.</li>
              <li>Ganti <code className="font-mono text-blue-900">SPREADSHEET_ID</code> pada script dengan ID Google Spreadsheet Anda.</li>
              <li>Klik <span className="font-bold text-slate-900">Deploy -&gt; New deployment -&gt; Web app</span>. Pilih <span className="font-bold">Execute as: Me</span> dan <span className="font-bold">Who has access: Anyone</span>.</li>
              <li>Salin URL Web App yang dihasilkan dan tempelkan pada kolom Endpoint di atas.</li>
            </ol>
          </div>

          {/* Code Viewer Container */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Code2 size={16} className="text-blue-600" /> Source Code Backend (code.gs)
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? 'Tersalin!' : 'Salin Kode code.gs'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-72 leading-relaxed border border-slate-800 select-all">
              {GOOGLE_APPS_SCRIPT_CODE}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 cursor-pointer shadow-xs"
          >
            Simpan Konfigurasi
          </button>
        </div>
      </div>
    </div>
  );
};
