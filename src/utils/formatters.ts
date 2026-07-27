export function parseAnyDate(dateInput: string | Date | number | null | undefined): Date | null {
  if (dateInput === null || dateInput === undefined || dateInput === '') return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
  const str = String(dateInput).trim();
  if (!str) return null;

  // Handle Excel serial number (e.g. 45480 or 44500)
  if (/^\d{5}(\.\d+)?$/.test(str) || typeof dateInput === 'number') {
    const num = typeof dateInput === 'number' ? dateInput : parseFloat(str);
    if (num > 25000 && num < 60000) {
      const utc_days = Math.floor(num - 25569);
      const utc_value = utc_days * 86400;
      const d = new Date(utc_value * 1000);
      if (!isNaN(d.getTime())) {
        return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      }
    }
  }

  // Format DD/MM/YYYY, DD-MM-YYYY, or DD.MM.YYYY
  const dmy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10) - 1; // 0-indexed
    const year = parseInt(dmy[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Format YYYY-MM-DD, YYYY/MM/DD, or ISO strings
  const ymd = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymd) {
    const year = parseInt(ymd[1], 10);
    const month = parseInt(ymd[2], 10) - 1;
    const day = parseInt(ymd[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Fallback
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    if (str.includes('Z') || str.includes('T')) {
      return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    }
    return d;
  }
  return null;
}

export function formatToDDMMYYYY(dateInput: string | Date | number | null | undefined): string {
  if (dateInput === null || dateInput === undefined || dateInput === '') {
    return '';
  }

  const str = String(dateInput).trim();
  if (!str) return '';

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }

  const dmySingle = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmySingle) {
    const day = String(parseInt(dmySingle[1], 10)).padStart(2, '0');
    const month = String(parseInt(dmySingle[2], 10)).padStart(2, '0');
    const year = dmySingle[3];
    return `${day}/${month}/${year}`;
  }

  const parsed = parseAnyDate(dateInput);
  if (!parsed) {
    return str;
  }

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatToYYYYMMDD(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return new Date().toISOString().split('T')[0];
  const parsed = parseAnyDate(dateInput);
  if (!parsed) return new Date().toISOString().split('T')[0];

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${year}-${month}-${day}`;
}

export function formatDateIndonesian(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const date = parseAnyDate(dateInput);
  if (!date) return String(dateInput);
  
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatCurrencyIDR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return 'Rp 0';
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount;
  if (isNaN(num)) return 'Rp 0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatWhatsAppNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export function createWhatsAppReminderLink(
  phone: string,
  customerName: string,
  vehicleType: string,
  noPol: string,
  nextDateStr: string,
  serviceNum: number
): string {
  const formattedPhone = formatWhatsAppNumber(phone);
  const dateFormatted = formatDateIndonesian(nextDateStr);
  const message = `Halo Bapak/Ibu *${customerName}*,\n\nKami dari *SETIAJAYA TOYOTA* ingin menginfokan bahwa kendaraan Anda:\n🚘 *Tipe*: ${vehicleType}\n🔢 *No. Polisi*: ${noPol}\n\nJadwal Service Berkala (Service ke-${serviceNum}) jatuh pada tanggal *${dateFormatted}*.\n\nUntuk menjaga performa dan garansi kendaraan Toyota Anda, mari segera lakukan booking service melalui kami.\n\nApakah kami dapat membantu untuk menjadwalkan kunjungan service Anda hari ini?\n\nTerima kasih,\n*SETIAJAYA TOYOTA SERVICE TEAM*`;

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

export function getDaysDifference(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((utc2 - utc1) / oneDay);
}
