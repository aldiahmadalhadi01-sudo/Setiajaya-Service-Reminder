import { DECRecord, ServiceCallRecord, ServiceReminder, ReminderStatus } from '../types';
import { getDaysDifference, parseAnyDate } from './formatters';

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const targetMonth = d.getMonth() + months;
  d.setMonth(targetMonth);
  return d;
}

export function calculateReminders(
  decList: DECRecord[],
  serviceCalls: ServiceCallRecord[],
  currentDate: Date = new Date()
): ServiceReminder[] {
  const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

  // Group service calls by VIN to get latest service info
  const latestServiceByVin: Record<string, ServiceCallRecord> = {};
  for (const call of serviceCalls) {
    if (!call.vin) continue;
    const existing = latestServiceByVin[call.vin];
    if (!existing) {
      latestServiceByVin[call.vin] = call;
    } else {
      const existingDate = parseAnyDate(existing.tanggal_invoice || existing.tanggal_entry) || new Date(0);
      const currentDate = parseAnyDate(call.tanggal_invoice || call.tanggal_entry) || new Date(0);
      if (currentDate > existingDate) {
        latestServiceByVin[call.vin] = call;
      }
    }
  }

  const reminders: ServiceReminder[] = [];

  for (const dec of decList) {
    if (!dec.vin || !dec.tanggal_dec) continue;

    const decDate = parseAnyDate(dec.tanggal_dec);
    if (!decDate) continue;

    const latestSvc = latestServiceByVin[dec.vin];

    // Determine target next reminder schedule from DEC date
    // Milestones: +1 month, +6 months, +12 months, +18 months, +24 months, +30 months, +36 months...
    const milestonesMonths = [1, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60];
    let nextMilestoneDate: Date = addMonths(decDate, 1);
    let serviceNum = 1;

    // Find the relevant upcoming/overdue milestone relative to today or latest service
    for (let i = 0; i < milestonesMonths.length; i++) {
      const mMonths = milestonesMonths[i];
      const mDate = addMonths(decDate, mMonths);
      
      // If customer already serviced after or on this milestone, skip to next milestone
      if (latestSvc) {
        const lastSvcDate = parseAnyDate(latestSvc.tanggal_invoice || latestSvc.tanggal_entry) || new Date(0);
        if (lastSvcDate >= mDate) {
          continue;
        }
      }

      nextMilestoneDate = mDate;
      serviceNum = i + 1;

      // If this milestone is in future or overdue, we pick it as the primary reminder focus
      const diffDays = getDaysDifference(today, mDate);
      if (diffDays >= -60) { // Keep focus up to 60 days overdue before shifting or showing overdue
        break;
      }
    }

    const nextDateClean = new Date(
      nextMilestoneDate.getFullYear(),
      nextMilestoneDate.getMonth(),
      nextMilestoneDate.getDate()
    );

    const selisihHari = getDaysDifference(today, nextDateClean);

    let status: ReminderStatus = 'AMAN';
    if (selisihHari < 0) {
      status = 'OVERDUE';
    } else if (selisihHari === 0) {
      status = 'HARI INI';
    } else if (selisihHari <= 7) {
      status = 'H-7';
    } else {
      status = 'AMAN';
    }

    const lastSvcDateStr = latestSvc
      ? latestSvc.tanggal_invoice || latestSvc.tanggal_entry
      : dec.tanggal_dec;

    const lastKm = latestSvc
      ? latestSvc.km_service || '1.000 (Estimasi)'
      : '1.000 (Baru DEC)';

    const noPol = latestSvc ? latestSvc.no_polisi : '-';

    reminders.push({
      vin: dec.vin,
      no_polisi: noPol,
      nama_customer: dec.nama_customer || (latestSvc ? latestSvc.nama_customer : 'Customer Toyota'),
      no_hp: dec.phone_customer || (latestSvc ? latestSvc.no_hp : ''),
      tipe_kendaraan: dec.tipe_kendaraan,
      km_terakhir: lastKm,
      service_terakhir: lastSvcDateStr,
      jadwal_berikutnya: nextDateClean.toISOString().split('T')[0],
      selisih_hari: selisihHari,
      status,
      service_ke: serviceNum,
      tanggal_dec: dec.tanggal_dec,
      dealer: latestSvc ? latestSvc.dealer_penjual : dec.sales
    });
  }

  // Sort reminders: OVERDUE and HARI INI first, then H-7, then AMAN
  const statusPriority: Record<ReminderStatus, number> = {
    'HARI INI': 1,
    'H-7': 2,
    'OVERDUE': 3,
    'AMAN': 4
  };

  return reminders.sort((a, b) => {
    if (statusPriority[a.status] !== statusPriority[b.status]) {
      return statusPriority[a.status] - statusPriority[b.status];
    }
    return a.selisih_hari - b.selisih_hari;
  });
}
