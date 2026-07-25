export interface DECRecord {
  id?: string;
  bulan: string;
  tanggal_dec: string;
  nama_customer: string;
  payment: string;
  phone_customer: string;
  tipe_kendaraan: string;
  vin: string;
  sales: string;
  alamat: string;
  kota: string;
}

export interface ServiceCallRecord {
  id?: string;
  week: string;
  cabang: string;
  service_advisor: string;
  tanggal_entry: string;
  call_id: string;
  kode_customer: string;
  nama_customer: string;
  no_hp: string;
  no_wa: string;
  alamat: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  kode_pos: string;
  ring_area: string;
  tipe_kendaraan: string;
  vin: string;
  no_mesin: string;
  no_polisi: string;
  tahun_rakit: string;
  tanggal_do: string;
  point_of_service: string;
  problem_definition: string;
  estimasi_harga: number | string;
  no_voucher: string;
  km_service: number | string;
  jenis_pekerjaan: string;
  tipe_promo: string;
  ssc: string;
  dealer_penjual: string;
  group: string;
  area_dealer: string;
  t_Care: string;
  up_selling: string;
  cross_selling: string;
  no_so: string;
  tanggal_so: string;
  no_invoice: string;
  tanggal_invoice: string;
  next_service: string;
  so_key: string;
  invoice_key: string;
  alamat_domisili: string;
  ring_area_domisili: string;
  nama_laporan: string;
  periode: string;
}

export type ReminderStatus = 'AMAN' | 'H-7' | 'HARI INI' | 'OVERDUE';

export interface ServiceReminder {
  vin: string;
  no_polisi: string;
  nama_customer: string;
  no_hp: string;
  tipe_kendaraan: string;
  km_terakhir: string | number;
  service_terakhir: string; // date string
  jadwal_berikutnya: string; // date string
  selisih_hari: number;
  status: ReminderStatus;
  service_ke: number; // 1st (+1 mo), 2nd (+6 mo), 3rd (+12 mo), etc.
  tanggal_dec?: string;
  dealer?: string;
}

export interface VehicleUnitSummary {
  vin: string;
  no_polisi: string;
  tipe_kendaraan: string;
  nama_customer: string;
  no_hp: string;
  dealer: string;
  total_kunjungan: number;
  service_terakhir: string;
  last_km: number | string;
  history: ServiceCallRecord[];
}

export interface DashboardKPI {
  totalUnitDEC: number;
  unitAktifService: number;
  jadwalHariIni: number;
  serviceOverdue: number;
  reminderH7: number;
  totalCustomer: number;
}

export interface TrendDataPoint {
  label: string;
  dateKey?: string;
  totalService: number;
}

export interface DealerDistribution {
  dealer: string;
  count: number;
}

export interface RingAreaDistribution {
  ring: string;
  count: number;
}

export interface SALeaderboard {
  rank: number;
  name: string;
  totalService: number;
  percentage: number;
}

export interface APIConfig {
  webAppUrl: string;
  useLocalStorageFallback: boolean;
  spreadsheetId: string;
}

export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  duplicates: number;
  errors: Array<{ row: number; reason: string; data?: any }>;
}
