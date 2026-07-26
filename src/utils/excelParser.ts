import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DECRecord, ServiceCallRecord, ImportResult } from '../types';
import { formatToDDMMYYYY } from './formatters';

export interface ParsedFileData {
  sheetNames: string[];
  selectedSheet: string;
  headers: string[];
  rows: any[];
}

export function parseFileToData(file: File): Promise<ParsedFileData> {
  return new Promise((resolve, reject) => {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          const headers = results.meta.fields || [];
          resolve({
            sheetNames: ['CSV Data'],
            selectedSheet: 'CSV Data',
            headers,
            rows: results.data
          });
        },
        error: (error) => {
          reject(new Error(`Gagal membaca file CSV: ${error.message}`));
        }
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetNames = workbook.SheetNames;
          const firstSheetName = sheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          if (jsonData.length === 0) {
            resolve({ sheetNames, selectedSheet: firstSheetName, headers: [], rows: [] });
            return;
          }

          const headers = (jsonData[0] || []).map(h => String(h || '').trim());
          const rawRows = jsonData.slice(1);
          
          const rows = rawRows.map(row => {
            const rowObj: Record<string, any> = {};
            headers.forEach((h, index) => {
              if (h) {
                rowObj[h] = row[index] !== undefined && row[index] !== null ? String(row[index]).trim() : '';
              }
            });
            return rowObj;
          }).filter(r => Object.values(r).some(v => v !== ''));

          resolve({
            sheetNames,
            selectedSheet: firstSheetName,
            headers,
            rows
          });
        } catch (err: any) {
          reject(new Error(`Gagal membaca file Excel: ${err.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Gagal membaca berkas.'));
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('Format file tidak didukung. Harap unggah .csv, .xlsx, atau .xls'));
    }
  });
}

export function parseSheetDataByName(file: File, sheetName: string): Promise<{ headers: string[]; rows: any[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
          reject(new Error(`Sheet ${sheetName} tidak ditemukan`));
          return;
        }
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        if (jsonData.length === 0) {
          resolve({ headers: [], rows: [] });
          return;
        }

        const headers = (jsonData[0] || []).map(h => String(h || '').trim());
        const rawRows = jsonData.slice(1);

        const rows = rawRows.map(row => {
          const rowObj: Record<string, any> = {};
          headers.forEach((h, index) => {
            if (h) {
              rowObj[h] = row[index] !== undefined && row[index] !== null ? String(row[index]).trim() : '';
            }
          });
          return rowObj;
        }).filter(r => Object.values(r).some(v => v !== ''));

        resolve({ headers, rows });
      } catch (err: any) {
        reject(new Error(`Gagal memuat sheet: ${err.message}`));
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export function validateAndProcessDECImport(
  rawRows: any[],
  mapping: Record<string, string>
): { validData: DECRecord[]; result: ImportResult } {
  const result: ImportResult = { total: rawRows.length, success: 0, failed: 0, duplicates: 0, errors: [] };
  const validData: DECRecord[] = [];

  rawRows.forEach((row, index) => {
    const rowIndex = index + 2; // header is row 1
    const vinRaw = String(row[mapping['vin'] || 'vin'] || '').trim();
    const namaCust = String(row[mapping['nama_customer'] || 'nama_customer'] || '').trim();
    const tipeKendaraan = String(row[mapping['tipe_kendaraan'] || 'tipe_kendaraan'] || '').trim();

    if (!vinRaw) {
      result.failed++;
      result.errors.push({ row: rowIndex, reason: 'VIN Wajib diisi', data: row });
      return;
    }

    if (!namaCust) {
      result.failed++;
      result.errors.push({ row: rowIndex, reason: 'Nama Customer Wajib diisi', data: row });
      return;
    }

    const item: DECRecord = {
      id: `DEC-${Date.now()}-${index}`,
      bulan: String(row[mapping['bulan'] || 'bulan'] || 'Januari 2025').trim(),
      tanggal_dec: formatToDDMMYYYY(row[mapping['tanggal_dec'] || 'tanggal_dec']),
      nama_customer: namaCust,
      payment: String(row[mapping['payment'] || 'payment'] || 'Cash').trim(),
      phone_customer: String(row[mapping['phone_customer'] || 'phone_customer'] || '').trim(),
      tipe_kendaraan: tipeKendaraan || 'Toyota Vehicle',
      vin: vinRaw,
      sales: String(row[mapping['sales'] || 'sales'] || '-').trim(),
      alamat: String(row[mapping['alamat'] || 'alamat'] || '-').trim(),
      kota: String(row[mapping['kota'] || 'kota'] || 'Depok').trim(),
    };

    validData.push(item);
    result.success++;
  });

  return { validData, result };
}

export function validateAndProcessServiceCallImport(
  rawRows: any[],
  mapping: Record<string, string>,
  existingData: ServiceCallRecord[],
  duplicateHandling: 'SKIP' | 'REPLACE' | 'IMPORT_ALL'
): { validData: ServiceCallRecord[]; result: ImportResult } {
  const result: ImportResult = { total: rawRows.length, success: 0, failed: 0, duplicates: 0, errors: [] };
  const validData: ServiceCallRecord[] = [];
  const existingInvoices = new Set(existingData.map(d => String(d.no_invoice).trim()));

  rawRows.forEach((row, index) => {
    const rowIndex = index + 2;
    const vinRaw = String(row[mapping['vin'] || 'vin'] || '').trim();
    const noInvoice = String(row[mapping['no_invoice'] || 'no_invoice'] || '').trim();
    const tglInvoice = String(row[mapping['tanggal_invoice'] || 'tanggal_invoice'] || '').trim();
    const rawTglEntry = row[mapping['tanggal_entry'] || 'tanggal_entry'] || row['tanggal_entry'] || row['tgl_entry'] || row['tanggal_masuk'];

    if (!vinRaw) {
      result.failed++;
      result.errors.push({ row: rowIndex, reason: 'VIN Wajib diisi', data: row });
      return;
    }

    if (noInvoice && existingInvoices.has(noInvoice)) {
      result.duplicates++;
      if (duplicateHandling === 'SKIP') {
        result.failed++;
        result.errors.push({ row: rowIndex, reason: `Duplikat Invoice: ${noInvoice} (Dilewati)`, data: row });
        return;
      }
    }

    const item: ServiceCallRecord = {
      id: `SVC-${Date.now()}-${index}`,
      week: String(row[mapping['week'] || 'week'] || 'W1').trim(),
      cabang: String(row[mapping['cabang'] || 'cabang'] || 'Setiajaya Toyota Depok').trim(),
      service_advisor: String(row[mapping['service_advisor'] || 'service_advisor'] || '-').trim(),
      tanggal_entry: rawTglEntry ? formatToDDMMYYYY(rawTglEntry) : (tglInvoice ? formatToDDMMYYYY(tglInvoice) : formatToDDMMYYYY(new Date())),
      call_id: String(row[mapping['call_id'] || 'call_id'] || `CALL-${index}`).trim(),
      kode_customer: String(row[mapping['kode_customer'] || 'kode_customer'] || '-').trim(),
      nama_customer: String(row[mapping['nama_customer'] || 'nama_customer'] || 'Customer').trim(),
      no_hp: String(row[mapping['no_hp'] || 'no_hp'] || '').trim(),
      no_wa: String(row[mapping['no_wa'] || 'no_wa'] || '').trim(),
      alamat: String(row[mapping['alamat'] || 'alamat'] || '-').trim(),
      kelurahan: String(row[mapping['kelurahan'] || 'kelurahan'] || '-').trim(),
      kecamatan: String(row[mapping['kecamatan'] || 'kecamatan'] || '-').trim(),
      kota: String(row[mapping['kota'] || 'kota'] || 'Depok').trim(),
      kode_pos: String(row[mapping['kode_pos'] || 'kode_pos'] || '-').trim(),
      ring_area: String(row[mapping['ring_area'] || 'ring_area'] || 'Ring 1').trim(),
      tipe_kendaraan: String(row[mapping['tipe_kendaraan'] || 'tipe_kendaraan'] || 'Toyota').trim(),
      vin: vinRaw,
      no_mesin: String(row[mapping['no_mesin'] || 'no_mesin'] || '-').trim(),
      no_polisi: String(row[mapping['no_polisi'] || 'no_polisi'] || '-').trim(),
      tahun_rakit: String(row[mapping['tahun_rakit'] || 'tahun_rakit'] || '2024').trim(),
      tanggal_do: row[mapping['tanggal_do'] || 'tanggal_do'] ? formatToDDMMYYYY(row[mapping['tanggal_do'] || 'tanggal_do']) : '',
      point_of_service: String(row[mapping['point_of_service'] || 'point_of_service'] || 'Bengkel Resmi').trim(),
      problem_definition: String(row[mapping['problem_definition'] || 'problem_definition'] || 'Service Berkala').trim(),
      estimasi_harga: Number(row[mapping['estimasi_harga'] || 'estimasi_harga']) || 0,
      no_voucher: String(row[mapping['no_voucher'] || 'no_voucher'] || '-').trim(),
      km_service: Number(row[mapping['km_service'] || 'km_service']) || 10000,
      jenis_pekerjaan: String(row[mapping['jenis_pekerjaan'] || 'jenis_pekerjaan'] || 'Periodic Maintenance').trim(),
      tipe_promo: String(row[mapping['tipe_promo'] || 'tipe_promo'] || 'T-Care').trim(),
      ssc: String(row[mapping['ssc'] || 'ssc'] || 'No').trim(),
      dealer_penjual: String(row[mapping['dealer_penjual'] || 'dealer_penjual'] || 'Setiajaya Toyota Depok').trim(),
      group: String(row[mapping['group'] || 'group'] || 'Retail').trim(),
      area_dealer: String(row[mapping['area_dealer'] || 'area_dealer'] || 'Jabodetabek').trim(),
      t_Care: String(row[mapping['t_Care'] || 't_Care'] || 'Ya').trim(),
      up_selling: String(row[mapping['up_selling'] || 'up_selling'] || '-').trim(),
      cross_selling: String(row[mapping['cross_selling'] || 'cross_selling'] || '-').trim(),
      no_so: String(row[mapping['no_so'] || 'no_so'] || '-').trim(),
      tanggal_so: row[mapping['tanggal_so'] || 'tanggal_so'] ? formatToDDMMYYYY(row[mapping['tanggal_so'] || 'tanggal_so']) : '',
      no_invoice: noInvoice || `INV-${Date.now()}-${index}`,
      tanggal_invoice: formatToDDMMYYYY(tglInvoice),
      next_service: row[mapping['next_service'] || 'next_service'] ? formatToDDMMYYYY(row[mapping['next_service'] || 'next_service']) : '',
      so_key: String(row[mapping['so_key'] || 'so_key'] || '').trim(),
      invoice_key: String(row[mapping['invoice_key'] || 'invoice_key'] || '').trim(),
      alamat_domisili: String(row[mapping['alamat_domisili'] || 'alamat_domisili'] || '-').trim(),
      ring_area_domisili: String(row[mapping['ring_area_domisili'] || 'ring_area_domisili'] || 'Ring 1').trim(),
      nama_laporan: String(row[mapping['nama_laporan'] || 'nama_laporan'] || 'Laporan Service').trim(),
      periode: String(row[mapping['periode'] || 'periode'] || '2026').trim(),
    };

    validData.push(item);
    result.success++;
  });

  return { validData, result };
}

export function exportToCSV(filename: string, rows: any[]) {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(filename: string, rows: any[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
