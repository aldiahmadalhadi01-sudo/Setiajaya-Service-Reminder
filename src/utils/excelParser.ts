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

export function formatCellValue(header: string, val: any): string {
  if (val === undefined || val === null || val === '') return '';

  const strVal = String(val).trim();
  if (!strVal) return '';

  const isDateHeader = /tanggal|tgl|date|masuk|dec|entry|invoice|so|do|next/i.test(header);
  const isNumericExcelDate = typeof val === 'number' && val > 25000 && val < 60000;
  const isStringExcelDate = /^\d{5}(\.\d+)?$/.test(strVal);
  const isIsoDateString = /^\d{4}[-/. ]\d{1,2}[-/. ]\d{1,2}/.test(strVal);

  if (isDateHeader || isNumericExcelDate || isStringExcelDate || isIsoDateString || val instanceof Date) {
    const formatted = formatToDDMMYYYY(val);
    if (formatted && /^\d{2}\/\d{2}\/\d{4}$/.test(formatted)) {
      return formatted;
    }
  }

  return strVal;
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
          const rows = (results.data as any[]).map((row) => {
            const rowObj: Record<string, any> = {};
            headers.forEach((h) => {
              rowObj[h] = formatCellValue(h, row[h]);
            });
            return rowObj;
          });
          resolve({
            sheetNames: ['CSV Data'],
            selectedSheet: 'CSV Data',
            headers,
            rows
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
                rowObj[h] = formatCellValue(h, row[index]);
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
              rowObj[h] = formatCellValue(h, row[index]);
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

export function getFlexibleValue(row: Record<string, any>, mappedKey?: string, searchRegexes: RegExp[] = []): any {
  if (!row) return '';

  // 1. Try explicit mapped key
  if (mappedKey && row[mappedKey] !== undefined && row[mappedKey] !== null && String(row[mappedKey]).trim() !== '') {
    return row[mappedKey];
  }

  // 2. Try normalized string match against keys in row
  const rowKeys = Object.keys(row);
  if (mappedKey) {
    const cleanMapped = mappedKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundKey = rowKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanMapped);
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && String(row[foundKey]).trim() !== '') {
      return row[foundKey];
    }
  }

  // 3. Try searchRegexes against keys in row
  for (const regex of searchRegexes) {
    const matchedKey = rowKeys.find(k => regex.test(k) || regex.test(k.replace(/[_.\-\s]+/g, ' ')));
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && String(row[matchedKey]).trim() !== '') {
      return row[matchedKey];
    }
  }

  return '';
}

export function validateAndProcessDECImport(
  rawRows: any[],
  mapping: Record<string, string>
): { validData: DECRecord[]; result: ImportResult } {
  const result: ImportResult = { total: rawRows.length, success: 0, failed: 0, duplicates: 0, errors: [] };
  const validData: DECRecord[] = [];

  rawRows.forEach((row, index) => {
    const rowIndex = index + 2; // header is row 1
    let vinRaw = String(getFlexibleValue(row, mapping['vin'], [/vin/i, /rangka/i, /chassis/i, /frame/i])).trim();
    const namaCust = String(getFlexibleValue(row, mapping['nama_customer'], [
      /nama[\s._]*customer/i,
      /nama[\s._]*cust/i,
      /customer[\s._]*name/i,
      /nama[\s._]*pelanggan/i,
      /^(nama|customer)$/i,
      /^nama/i
    ])).trim();
    const tipeKendaraan = String(getFlexibleValue(row, mapping['tipe_kendaraan'], [/tipe|kendaraan|model/i])).trim();
    const rawTglDec = getFlexibleValue(row, mapping['tanggal_dec'], [
      /tanggal[\s._]*dec/i,
      /tgl[\s._]*dec/i,
      /dec[\s._]*date/i,
      /tanggal/i,
      /tgl/i
    ]);

    if (!namaCust && !vinRaw) {
      result.failed++;
      result.errors.push({ row: rowIndex, reason: 'Baris Kosong / Tidak Memiliki Data Customer & VIN', data: row });
      return;
    }

    if (!vinRaw) {
      vinRaw = `DEC-VIN-${Date.now()}-${index}`;
    }

    const item: DECRecord = {
      id: `DEC-${Date.now()}-${index}`,
      bulan: String(getFlexibleValue(row, mapping['bulan'], [/bulan/i]) || 'Januari 2025').trim(),
      tanggal_dec: rawTglDec ? formatToDDMMYYYY(rawTglDec) : formatToDDMMYYYY(new Date()),
      nama_customer: namaCust || 'Customer',
      payment: String(getFlexibleValue(row, mapping['payment'], [/payment|pembayaran/i]) || 'Cash').trim(),
      phone_customer: String(getFlexibleValue(row, mapping['phone_customer'], [/phone|hp|wa|telepon/i])).trim(),
      tipe_kendaraan: tipeKendaraan || 'Toyota Vehicle',
      vin: vinRaw,
      sales: String(getFlexibleValue(row, mapping['sales'], [/sales|wiraniaga/i]) || '-').trim(),
      alamat: String(getFlexibleValue(row, mapping['alamat'], [/alamat|domisili/i]) || '-').trim(),
      kota: String(getFlexibleValue(row, mapping['kota'], [/kota|kabupaten/i]) || 'Depok').trim(),
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
  const existingInvoices = new Set(existingData.map(d => String(d.no_invoice).trim().toLowerCase()));

  rawRows.forEach((row, index) => {
    const rowIndex = index + 2;
    let vinRaw = String(getFlexibleValue(row, mapping['vin'], [/vin/i, /rangka/i, /chassis/i, /frame/i])).trim();
    let noInvoice = String(getFlexibleValue(row, mapping['no_invoice'], [/invoice/i, /no[\s._]*inv/i])).trim();
    const noPolisi = String(getFlexibleValue(row, mapping['no_polisi'], [/no[\s._]*polisi|nopol|no[\s._]*pol/i])).trim();
    const namaCustomer = String(getFlexibleValue(row, mapping['nama_customer'], [
      /nama[\s._]*customer/i,
      /nama[\s._]*cust/i,
      /customer[\s._]*name/i,
      /nama[\s._]*pelanggan/i,
      /^(nama|customer)$/i,
      /^nama/i
    ])).trim();

    const rawTglInvoice = getFlexibleValue(row, mapping['tanggal_invoice'], [/tanggal[\s._]*invoice/i, /tgl[\s._]*inv/i, /invoice[\s._]*date/i]);
    const rawTglEntry = getFlexibleValue(row, mapping['tanggal_entry'], [
      /tanggal[\s._]*entry/i,
      /tgl[\s._]*entry/i,
      /entry[\s._]*date/i,
      /tanggal[\s._]*masuk/i,
      /tgl[\s._]*masuk/i,
      /tanggal[\s._]*service/i,
      /tgl[\s._]*service/i,
      /tanggal/i,
      /tgl/i
    ]);
    const rawTglDo = getFlexibleValue(row, mapping['tanggal_do'], [/tanggal[\s._]*do/i, /tgl[\s._]*do/i, /do[\s._]*date/i]);
    const rawTglSo = getFlexibleValue(row, mapping['tanggal_so'], [/tanggal[\s._]*so/i, /tgl[\s._]*so/i, /so[\s._]*date/i]);
    const rawNextService = getFlexibleValue(row, mapping['next_service'], [/next[\s._]*service/i, /layanan[\s._]*berikut/i]);

    if (!vinRaw && !noPolisi && !noInvoice && !namaCustomer) {
      result.failed++;
      result.errors.push({ row: rowIndex, reason: 'Baris kosong tanpa identitas kendaraan / customer', data: row });
      return;
    }

    if (!vinRaw) {
      vinRaw = noPolisi ? `VIN-${noPolisi.replace(/\s+/g, '')}` : `VIN-SVC-${Date.now()}-${index}`;
    }

    if (!noInvoice) {
      noInvoice = `INV-${Date.now()}-${index}`;
    }

    if (existingInvoices.has(noInvoice.toLowerCase())) {
      result.duplicates++;
      if (duplicateHandling === 'SKIP') {
        result.failed++;
        result.errors.push({ row: rowIndex, reason: `Duplikat Invoice: ${noInvoice} (Dilewati)`, data: row });
        return;
      }
    }

    const item: ServiceCallRecord = {
      id: `SVC-${Date.now()}-${index}`,
      week: String(getFlexibleValue(row, mapping['week'], [/week|minggu/i]) || 'W1').trim(),
      cabang: String(getFlexibleValue(row, mapping['cabang'], [/cabang|branch/i]) || 'Setiajaya Toyota Depok').trim(),
      service_advisor: String(getFlexibleValue(row, mapping['service_advisor'], [/service[\s._]*advisor|sa\b|advisor/i]) || '-').trim(),
      tanggal_entry: rawTglEntry ? formatToDDMMYYYY(rawTglEntry) : (rawTglInvoice ? formatToDDMMYYYY(rawTglInvoice) : formatToDDMMYYYY(new Date())),
      call_id: String(getFlexibleValue(row, mapping['call_id'], [/call[\s._]*id/i]) || `CALL-${index}`).trim(),
      kode_customer: String(getFlexibleValue(row, mapping['kode_customer'], [/kode[\s._]*customer|kode[\s._]*cust/i]) || '-').trim(),
      nama_customer: namaCustomer || 'Customer',
      no_hp: String(getFlexibleValue(row, mapping['no_hp'], [/no[\s._]*hp|hp|phone/i])).trim(),
      no_wa: String(getFlexibleValue(row, mapping['no_wa'], [/no[\s._]*wa|wa|whatsapp/i])).trim(),
      alamat: String(getFlexibleValue(row, mapping['alamat'], [/alamat|address/i]) || '-').trim(),
      kelurahan: String(getFlexibleValue(row, mapping['kelurahan'], [/kelurahan/i]) || '-').trim(),
      kecamatan: String(getFlexibleValue(row, mapping['kecamatan'], [/kecamatan/i]) || '-').trim(),
      kota: String(getFlexibleValue(row, mapping['kota'], [/kota|kabupaten/i]) || 'Depok').trim(),
      kode_pos: String(getFlexibleValue(row, mapping['kode_pos'], [/kode[\s._]*pos|zip/i]) || '-').trim(),
      ring_area: String(getFlexibleValue(row, mapping['ring_area'], [/ring[\s._]*area|ring/i]) || 'Ring 1').trim(),
      tipe_kendaraan: String(getFlexibleValue(row, mapping['tipe_kendaraan'], [/tipe[\s._]*kendaraan|tipe|model|deskripsi/i]) || 'Toyota').trim(),
      vin: vinRaw,
      no_mesin: String(getFlexibleValue(row, mapping['no_mesin'], [/no[\s._]*mesin|engine/i]) || '-').trim(),
      no_polisi: noPolisi || '-',
      tahun_rakit: String(getFlexibleValue(row, mapping['tahun_rakit'], [/tahun[\s._]*rakit|tahun/i]) || '2024').trim(),
      tanggal_do: rawTglDo ? formatToDDMMYYYY(rawTglDo) : '',
      point_of_service: String(getFlexibleValue(row, mapping['point_of_service'], [/point[\s._]*of[\s._]*service|pos/i]) || 'Bengkel Resmi').trim(),
      problem_definition: String(getFlexibleValue(row, mapping['problem_definition'], [/problem|keluhan/i]) || 'Service Berkala').trim(),
      estimasi_harga: Number(getFlexibleValue(row, mapping['estimasi_harga'], [/estimasi|harga|total/i])) || 0,
      no_voucher: String(getFlexibleValue(row, mapping['no_voucher'], [/voucher/i]) || '-').trim(),
      km_service: Number(getFlexibleValue(row, mapping['km_service'], [/km/i])) || 10000,
      jenis_pekerjaan: String(getFlexibleValue(row, mapping['jenis_pekerjaan'], [/jenis[\s._]*pekerjaan|job|pekerjaan/i]) || 'Periodic Maintenance').trim(),
      tipe_promo: String(getFlexibleValue(row, mapping['tipe_promo'], [/promo/i]) || 'T-Care').trim(),
      ssc: String(getFlexibleValue(row, mapping['ssc'], [/ssc/i]) || 'No').trim(),
      dealer_penjual: String(getFlexibleValue(row, mapping['dealer_penjual'], [/dealer/i]) || 'Setiajaya Toyota Depok').trim(),
      group: String(getFlexibleValue(row, mapping['group'], [/group/i]) || 'Retail').trim(),
      area_dealer: String(getFlexibleValue(row, mapping['area_dealer'], [/area/i]) || 'Jabodetabek').trim(),
      t_Care: String(getFlexibleValue(row, mapping['t_Care'], [/t[\s._]*care/i]) || 'Ya').trim(),
      up_selling: String(getFlexibleValue(row, mapping['up_selling'], [/up[\s._]*selling/i]) || '-').trim(),
      cross_selling: String(getFlexibleValue(row, mapping['cross_selling'], [/cross[\s._]*selling/i]) || '-').trim(),
      no_so: String(getFlexibleValue(row, mapping['no_so'], [/no[\s._]*so/i]) || '-').trim(),
      tanggal_so: rawTglSo ? formatToDDMMYYYY(rawTglSo) : '',
      no_invoice: noInvoice,
      tanggal_invoice: rawTglInvoice ? formatToDDMMYYYY(rawTglInvoice) : (rawTglEntry ? formatToDDMMYYYY(rawTglEntry) : formatToDDMMYYYY(new Date())),
      next_service: rawNextService ? formatToDDMMYYYY(rawNextService) : '',
      so_key: String(getFlexibleValue(row, mapping['so_key'], [/so[\s._]*key/i])).trim(),
      invoice_key: String(getFlexibleValue(row, mapping['invoice_key'], [/invoice[\s._]*key/i])).trim(),
      alamat_domisili: String(getFlexibleValue(row, mapping['alamat_domisili'], [/alamat[\s._]*domisili/i]) || '-').trim(),
      ring_area_domisili: String(getFlexibleValue(row, mapping['ring_area_domisili'], [/ring[\s._]*area[\s._]*domisili/i]) || 'Ring 1').trim(),
      nama_laporan: String(getFlexibleValue(row, mapping['nama_laporan'], [/nama[\s._]*laporan|laporan/i]) || 'Laporan Service').trim(),
      periode: String(getFlexibleValue(row, mapping['periode'], [/periode/i]) || '2026').trim(),
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
