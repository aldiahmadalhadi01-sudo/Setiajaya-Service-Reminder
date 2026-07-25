export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * SETIAJAYA TOYOTA SERVICE ANALYTICS & REMINDER SYSTEM
 * Google Apps Script Web App REST API Backend
 * 
 * Paste ini di Google Apps Script Editor (script.google.com)
 * Hubungkan dengan Google Spreadsheet Anda.
 * Deploy sebagai Web App -> Execute as: Me -> Who has access: Anyone.
 */

// ==========================================
// CONFIGURATION
// ==========================================
var SPREADSHEET_ID = "1hFjw0SOG2Y32pO6H3PkLnHJxBbLrnP7p"; // Masukkan ID Google Spreadsheet Anda di sini
var SHEET_DEC_NAME = "DEC";
var SHEET_SERVICE_CALL_NAME = "SERVICE_CALL";

function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== "") {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      return SpreadsheetApp.getActiveSpreadsheet();
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ==========================================
// REST API ROUTER & ENTRY POINTS
// ==========================================
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var action = (e.parameter && e.parameter.action) ? e.parameter.action : "getDashboard";
  
  var postData = null;
  if (e.postData && e.postData.contents) {
    try {
      postData = JSON.parse(e.postData.contents);
      if (postData.action) action = postData.action;
    } catch (err) {}
  }

  var response = { success: false, data: null, error: null };

  try {
    switch (action) {
      // 1. DASHBOARD & ANALYTICS
      case "getDashboard":
        response.data = DashboardAnalyticsEngine.getDashboardData();
        response.success = true;
        break;
      case "getKPI":
        response.data = DashboardAnalyticsEngine.getKPIs();
        response.success = true;
        break;
      case "getTrendService":
        var period = (e.parameter && e.parameter.period) ? e.parameter.period : "daily";
        response.data = ChartEngine.getTrendService(period);
        response.success = true;
        break;
      case "getDealerDistribution":
        response.data = ChartEngine.getDealerDistribution();
        response.success = true;
        break;
      case "getRingAreaDistribution":
        response.data = ChartEngine.getRingAreaDistribution();
        response.success = true;
        break;
      case "getLeaderboardSA":
        response.data = LeaderboardEngine.getLeaderboardSA();
        response.success = true;
        break;

      // 2. REMINDER ENGINE
      case "getReminders":
        response.data = ReminderEngine.calculateReminders();
        response.success = true;
        break;

      // 3. VEHICLE HISTORY ENGINE
      case "getHistory":
        var vin = e.parameter ? e.parameter.vin : null;
        response.data = HistoryEngine.getVehicleHistory(vin);
        response.success = true;
        break;

      // 4. SEARCH ENGINE
      case "search":
        var query = e.parameter ? e.parameter.query : "";
        response.data = SearchEngine.globalSearch(query);
        response.success = true;
        break;

      // 5. DEC CRUD
      case "getDEC":
        response.data = CRUDEngine.getDECList();
        response.success = true;
        break;
      case "addDEC":
        response.data = CRUDEngine.addDEC(postData ? postData.data : null);
        response.success = true;
        break;
      case "updateDEC":
        response.data = CRUDEngine.updateDEC(postData ? postData.data : null);
        response.success = true;
        break;
      case "deleteDEC":
        response.data = CRUDEngine.deleteDEC(postData ? postData.id : e.parameter.id);
        response.success = true;
        break;

      // 6. SERVICE CALL CRUD
      case "getServiceCalls":
        response.data = CRUDEngine.getServiceCallList();
        response.success = true;
        break;
      case "addServiceCall":
        response.data = CRUDEngine.addServiceCall(postData ? postData.data : null);
        response.success = true;
        break;
      case "updateServiceCall":
        response.data = CRUDEngine.updateServiceCall(postData ? postData.data : null);
        response.success = true;
        break;
      case "deleteServiceCall":
        response.data = CRUDEngine.deleteServiceCall(postData ? postData.id : e.parameter.id);
        response.success = true;
        break;

      // 7. IMPORT ENGINE
      case "importDEC":
        response.data = ImportEngine.importDEC(postData ? postData.records : []);
        response.success = true;
        break;
      case "importServiceCall":
        var mode = postData ? postData.duplicateMode : "SKIP";
        response.data = ImportEngine.importServiceCall(postData ? postData.records : [], mode);
        response.success = true;
        break;

      default:
        response.error = "Aksi tidak dikenal: " + action;
    }
  } catch (err) {
    response.success = false;
    response.error = err.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}


// ==========================================
// 1. CRUD ENGINE
// ==========================================
var CRUDEngine = {
  getDECList: function() {
    var sheet = getSpreadsheet().getSheetByName(SHEET_DEC_NAME);
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    var headers = data[0];
    var results = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0] && !row[6]) continue;
      results.push({
        id: "DEC-" + i,
        rowIndex: i + 1,
        bulan: row[0] || "",
        tanggal_dec: formatDate(row[1]),
        nama_customer: row[2] || "",
        payment: row[3] || "",
        phone_customer: row[4] || "",
        tipe_kendaraan: row[5] || "",
        vin: row[6] || "",
        sales: row[7] || "",
        alamat: row[8] || "",
        kota: row[9] || ""
      });
    }
    return results;
  },

  addDEC: function(record) {
    var sheet = getSpreadsheet().getSheetByName(SHEET_DEC_NAME);
    if (!sheet) throw new Error("Sheet DEC tidak ditemukan.");
    sheet.appendRow([
      record.bulan || "",
      record.tanggal_dec || "",
      record.nama_customer || "",
      record.payment || "",
      record.phone_customer || "",
      record.tipe_kendaraan || "",
      record.vin || "",
      record.sales || "",
      record.alamat || "",
      record.kota || ""
    ]);
    return { status: "created", vin: record.vin };
  },

  updateDEC: function(record) {
    var sheet = getSpreadsheet().getSheetByName(SHEET_DEC_NAME);
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][6] === record.vin || ("DEC-" + i) === record.id) {
        sheet.getRange(i + 1, 1, 1, 10).setValues([[
          record.bulan, record.tanggal_dec, record.nama_customer,
          record.payment, record.phone_customer, record.tipe_kendaraan,
          record.vin, record.sales, record.alamat, record.kota
        ]]);
        return { status: "updated", vin: record.vin };
      }
    }
    throw new Error("Record DEC tidak ditemukan untuk diupdate.");
  },

  deleteDEC: function(idOrVin) {
    var sheet = getSpreadsheet().getSheetByName(SHEET_DEC_NAME);
    var data = sheet.getDataRange().getValues();
    for (var i = data.length - 1; i >= 1; i--) {
      if (("DEC-" + i) === idOrVin || data[i][6] === idOrVin) {
        sheet.deleteRow(i + 1);
        return { status: "deleted", id: idOrVin };
      }
    }
    throw new Error("Record DEC tidak ditemukan.");
  },

  getServiceCallList: function() {
    var sheet = getSpreadsheet().getSheetByName(SHEET_SERVICE_CALL_NAME);
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    var results = [];
    for (var i = 1; i < data.length; i++) {
      var r = data[i];
      if (!r[16] && !r[37]) continue; // check vin or invoice
      results.push({
        id: "SVC-" + i,
        rowIndex: i + 1,
        week: r[0] || "",
        cabang: r[1] || "",
        service_advisor: r[2] || "",
        tanggal_entry: formatDate(r[3]),
        call_id: r[4] || "",
        kode_customer: r[5] || "",
        nama_customer: r[6] || "",
        no_hp: r[7] || "",
        no_wa: r[8] || "",
        alamat: r[9] || "",
        kelurahan: r[10] || "",
        kecamatan: r[11] || "",
        kota: r[12] || "",
        kode_pos: r[13] || "",
        ring_area: r[14] || "",
        tipe_kendaraan: r[15] || "",
        vin: r[16] || "",
        no_mesin: r[17] || "",
        no_polisi: r[18] || "",
        tahun_rakit: r[19] || "",
        tanggal_do: formatDate(r[20]),
        point_of_service: r[21] || "",
        problem_definition: r[22] || "",
        estimasi_harga: r[23] || 0,
        no_voucher: r[24] || "",
        km_service: r[25] || 0,
        jenis_pekerjaan: r[26] || "",
        tipe_promo: r[27] || "",
        ssc: r[28] || "",
        dealer_penjual: r[29] || "",
        group: r[30] || "",
        area_dealer: r[31] || "",
        t_Care: r[32] || "",
        up_selling: r[33] || "",
        cross_selling: r[34] || "",
        no_so: r[35] || "",
        tanggal_so: formatDate(r[36]),
        no_invoice: r[37] || "",
        tanggal_invoice: formatDate(r[38]),
        next_service: formatDate(r[39]),
        so_key: r[40] || "",
        invoice_key: r[41] || "",
        alamat_domisili: r[42] || "",
        ring_area_domisili: r[43] || "",
        nama_laporan: r[44] || "",
        periode: r[45] || ""
      });
    }
    return results;
  },

  addServiceCall: function(r) {
    var sheet = getSpreadsheet().getSheetByName(SHEET_SERVICE_CALL_NAME);
    if (!sheet) throw new Error("Sheet SERVICE_CALL tidak ditemukan.");
    sheet.appendRow([
      r.week, r.cabang, r.service_advisor, r.tanggal_entry, r.call_id,
      r.kode_customer, r.nama_customer, r.no_hp, r.no_wa, r.alamat,
      r.kelurahan, r.kecamatan, r.kota, r.kode_pos, r.ring_area,
      r.tipe_kendaraan, r.vin, r.no_mesin, r.no_polisi, r.tahun_rakit,
      r.tanggal_do, r.point_of_service, r.problem_definition, r.estimasi_harga,
      r.no_voucher, r.km_service, r.jenis_pekerjaan, r.tipe_promo, r.ssc,
      r.dealer_penjual, r.group, r.area_dealer, r.t_Care, r.up_selling,
      r.cross_selling, r.no_so, r.tanggal_so, r.no_invoice, r.tanggal_invoice,
      r.next_service, r.so_key, r.invoice_key, r.alamat_domisili,
      r.ring_area_domisili, r.nama_laporan, r.periode
    ]);
    return { status: "created", invoice: r.no_invoice };
  },

  updateServiceCall: function(r) {
    var sheet = getSpreadsheet().getSheetByName(SHEET_SERVICE_CALL_NAME);
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][37] === r.no_invoice || ("SVC-" + i) === r.id) {
        sheet.getRange(i + 1, 1, 1, 46).setValues([[
          r.week, r.cabang, r.service_advisor, r.tanggal_entry, r.call_id,
          r.kode_customer, r.nama_customer, r.no_hp, r.no_wa, r.alamat,
          r.kelurahan, r.kecamatan, r.kota, r.kode_pos, r.ring_area,
          r.tipe_kendaraan, r.vin, r.no_mesin, r.no_polisi, r.tahun_rakit,
          r.tanggal_do, r.point_of_service, r.problem_definition, r.estimasi_harga,
          r.no_voucher, r.km_service, r.jenis_pekerjaan, r.tipe_promo, r.ssc,
          r.dealer_penjual, r.group, r.area_dealer, r.t_Care, r.up_selling,
          r.cross_selling, r.no_so, r.tanggal_so, r.no_invoice, r.tanggal_invoice,
          r.next_service, r.so_key, r.invoice_key, r.alamat_domisili,
          r.ring_area_domisili, r.nama_laporan, r.periode
        ]]);
        return { status: "updated", invoice: r.no_invoice };
      }
    }
    throw new Error("Record Service Call tidak ditemukan.");
  },

  deleteServiceCall: function(idOrInvoice) {
    var sheet = getSpreadsheet().getSheetByName(SHEET_SERVICE_CALL_NAME);
    var data = sheet.getDataRange().getValues();
    for (var i = data.length - 1; i >= 1; i--) {
      if (("SVC-" + i) === idOrInvoice || data[i][37] === idOrInvoice) {
        sheet.deleteRow(i + 1);
        return { status: "deleted", id: idOrInvoice };
      }
    }
    throw new Error("Record Service Call tidak ditemukan.");
  }
};


// ==========================================
// 2. DASHBOARD ANALYTICS ENGINE
// ==========================================
var DashboardAnalyticsEngine = {
  getKPIs: function() {
    var decs = CRUDEngine.getDECList();
    var svcs = CRUDEngine.getServiceCallList();
    var reminders = ReminderEngine.calculateRemindersWithData(decs, svcs);

    var todayStr = new Date().toISOString().split("T")[0];
    var todayCount = 0;
    var overdueCount = 0;
    var h7Count = 0;

    reminders.forEach(function(rem) {
      if (rem.status === "HARI INI") todayCount++;
      else if (rem.status === "OVERDUE") overdueCount++;
      else if (rem.status === "H-7") h7Count++;
    });

    var uniqueCustomers = {};
    decs.forEach(function(d) { if (d.nama_customer) uniqueCustomers[d.nama_customer] = true; });
    svcs.forEach(function(s) { if (s.nama_customer) uniqueCustomers[s.nama_customer] = true; });

    return {
      totalUnitDEC: decs.length,
      unitAktifService: svcs.length,
      jadwalHariIni: todayCount,
      serviceOverdue: overdueCount,
      reminderH7: h7Count,
      totalCustomer: Object.keys(uniqueCustomers).length
    };
  },

  getDashboardData: function() {
    return {
      kpi: this.getKPIs(),
      trend: ChartEngine.getTrendService("daily"),
      dealerDistribution: ChartEngine.getDealerDistribution(),
      ringAreaDistribution: ChartEngine.getRingAreaDistribution(),
      leaderboard: LeaderboardEngine.getLeaderboardSA()
    };
  }
};


// ==========================================
// 3. CHART ENGINE
// ==========================================
var ChartEngine = {
  getTrendService: function(period) {
    var svcs = CRUDEngine.getServiceCallList();
    var counts = {};

    svcs.forEach(function(s) {
      var dateStr = s.tanggal_entry || s.tanggal_invoice;
      if (!dateStr) return;
      var key = dateStr;
      if (period === "weekly") {
        key = s.week || "Week 1";
      } else if (period === "monthly") {
        key = dateStr.substring(0, 7); // YYYY-MM
      }
      counts[key] = (counts[key] || 0) + 1;
    });

    var result = [];
    Object.keys(counts).sort().forEach(function(k) {
      result.push({ label: k, totalService: counts[k] });
    });
    return result;
  },

  getDealerDistribution: function() {
    var svcs = CRUDEngine.getServiceCallList();
    var counts = {};

    svcs.forEach(function(s) {
      var dealer = s.dealer_penjual || "Dealer Lain";
      counts[dealer] = (counts[dealer] || 0) + 1;
    });

    var sorted = Object.keys(counts).map(function(d) {
      return { dealer: d, count: counts[d] };
    }).sort(function(a, b) { return b.count - a.count; });

    return sorted.slice(0, 5); // Top 5
  },

  getRingAreaDistribution: function() {
    var svcs = CRUDEngine.getServiceCallList();
    var counts = { "Ring 1": 0, "Ring 2": 0, "Ring 3": 0, "Outer": 0 };

    svcs.forEach(function(s) {
      var ring = s.ring_area || "Ring 1";
      if (!counts[ring]) counts[ring] = 0;
      counts[ring]++;
    });

    return Object.keys(counts).map(function(r) {
      return { ring: r, count: counts[r] };
    });
  }
};


// ==========================================
// 4. LEADERBOARD ENGINE
// ==========================================
var LeaderboardEngine = {
  getLeaderboardSA: function() {
    var svcs = CRUDEngine.getServiceCallList();
    var total = svcs.length || 1;
    var counts = {};

    svcs.forEach(function(s) {
      var sa = s.service_advisor || "Unassigned";
      counts[sa] = (counts[sa] || 0) + 1;
    });

    var list = Object.keys(counts).map(function(sa) {
      return {
        name: sa,
        totalService: counts[sa],
        percentage: Math.round((counts[sa] / total) * 100)
      };
    }).sort(function(a, b) { return b.totalService - a.totalService; });

    list.forEach(function(item, idx) {
      item.rank = idx + 1;
    });

    return list;
  }
};


// ==========================================
// 5. REMINDER ENGINE
// ==========================================
var ReminderEngine = {
  calculateReminders: function() {
    var decs = CRUDEngine.getDECList();
    var svcs = CRUDEngine.getServiceCallList();
    return this.calculateRemindersWithData(decs, svcs);
  },

  calculateRemindersWithData: function(decs, svcs) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var latestSvcByVin = {};
    svcs.forEach(function(s) {
      if (!s.vin) return;
      var existing = latestSvcByVin[s.vin];
      if (!existing || new Date(s.tanggal_invoice || s.tanggal_entry) > new Date(existing.tanggal_invoice || existing.tanggal_entry)) {
        latestSvcByVin[s.vin] = s;
      }
    });

    var result = [];

    decs.forEach(function(dec) {
      if (!dec.vin || !dec.tanggal_dec) return;
      var decDate = new Date(dec.tanggal_dec);
      if (isNaN(decDate.getTime())) return;

      var latest = latestSvcByVin[dec.vin];
      
      // Algorithm: Service 1 = DEC + 1mo, Service 2 = DEC + 6mo, next every +6mo
      var targetDate = new Date(decDate);
      targetDate.setMonth(targetDate.getMonth() + 1); // 1st service

      if (latest) {
        targetDate = new Date(decDate);
        targetDate.setMonth(targetDate.getMonth() + 6); // 2nd+ service
      }

      var timeDiff = targetDate.getTime() - today.getTime();
      var daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

      var status = "AMAN";
      if (daysDiff < 0) status = "OVERDUE";
      else if (daysDiff === 0) status = "HARI INI";
      else if (daysDiff <= 7) status = "H-7";

      result.push({
        vin: dec.vin,
        no_polisi: latest ? latest.no_polisi : "-",
        nama_customer: dec.nama_customer,
        no_hp: dec.phone_customer || (latest ? latest.no_hp : ""),
        tipe_kendaraan: dec.tipe_kendaraan,
        km_terakhir: latest ? latest.km_service : "1.000 (DEC)",
        service_terakhir: latest ? latest.tanggal_invoice : dec.tanggal_dec,
        jadwal_berikutnya: formatDate(targetDate),
        selisih_hari: daysDiff,
        status: status,
        service_ke: latest ? 2 : 1
      });
    });

    return result;
  }
};


// ==========================================
// 6. HISTORY ENGINE
// ==========================================
var HistoryEngine = {
  getVehicleHistory: function(targetVin) {
    var svcs = CRUDEngine.getServiceCallList();
    if (targetVin) {
      return svcs.filter(function(s) { return s.vin === targetVin; })
                 .sort(function(a, b) { return new Date(b.tanggal_invoice) - new Date(a.tanggal_invoice); });
    }

    // Return grouped vehicle summaries
    var map = {};
    svcs.forEach(function(s) {
      if (!s.vin) return;
      if (!map[s.vin]) {
        map[s.vin] = {
          vin: s.vin,
          no_polisi: s.no_polisi,
          tipe_kendaraan: s.tipe_kendaraan,
          nama_customer: s.nama_customer,
          no_hp: s.no_hp,
          dealer: s.dealer_penjual,
          total_kunjungan: 0,
          service_terakhir: s.tanggal_invoice,
          last_km: s.km_service,
          history: []
        };
      }
      map[s.vin].total_kunjungan++;
      map[s.vin].history.push(s);
    });

    return Object.keys(map).map(function(v) { return map[v]; });
  }
};


// ==========================================
// 7. SEARCH ENGINE
// ==========================================
var SearchEngine = {
  globalSearch: function(query) {
    if (!query) return [];
    var q = query.toLowerCase();
    var svcs = CRUDEngine.getServiceCallList();
    return svcs.filter(function(s) {
      return (s.vin && s.vin.toLowerCase().indexOf(q) !== -1) ||
             (s.no_polisi && s.no_polisi.toLowerCase().indexOf(q) !== -1) ||
             (s.nama_customer && s.nama_customer.toLowerCase().indexOf(q) !== -1);
    });
  }
};


// ==========================================
// 8. IMPORT ENGINE
// ==========================================
var ImportEngine = {
  importDEC: function(records) {
    var sheet = getSpreadsheet().getSheetByName(SHEET_DEC_NAME);
    if (!sheet) throw new Error("Sheet DEC tidak ditemukan.");

    var successCount = 0;
    records.forEach(function(r) {
      sheet.appendRow([
        r.bulan, r.tanggal_dec, r.nama_customer, r.payment,
        r.phone_customer, r.tipe_kendaraan, r.vin, r.sales,
        r.alamat, r.kota
      ]);
      successCount++;
    });

    return { imported: successCount, status: "completed" };
  },

  importServiceCall: function(records, mode) {
    var sheet = getSpreadsheet().getSheetByName(SHEET_SERVICE_CALL_NAME);
    if (!sheet) throw new Error("Sheet SERVICE_CALL tidak ditemukan.");

    var existingData = sheet.getDataRange().getValues();
    var existingInvoices = {};
    for (var i = 1; i < existingData.length; i++) {
      if (existingData[i][37]) existingInvoices[existingData[i][37]] = true;
    }

    var successCount = 0;
    var skippedCount = 0;

    records.forEach(function(r) {
      if (mode === "SKIP" && existingInvoices[r.no_invoice]) {
        skippedCount++;
        return;
      }

      sheet.appendRow([
        r.week, r.cabang, r.service_advisor, r.tanggal_entry, r.call_id,
        r.kode_customer, r.nama_customer, r.no_hp, r.no_wa, r.alamat,
        r.kelurahan, r.kecamatan, r.kota, r.kode_pos, r.ring_area,
        r.tipe_kendaraan, r.vin, r.no_mesin, r.no_polisi, r.tahun_rakit,
        r.tanggal_do, r.point_of_service, r.problem_definition, r.estimasi_harga,
        r.no_voucher, r.km_service, r.jenis_pekerjaan, r.tipe_promo, r.ssc,
        r.dealer_penjual, r.group, r.area_dealer, r.t_Care, r.up_selling,
        r.cross_selling, r.no_so, r.tanggal_so, r.no_invoice, r.tanggal_invoice,
        r.next_service, r.so_key, r.invoice_key, r.alamat_domisili,
        r.ring_area_domisili, r.nama_laporan, r.periode
      ]);
      successCount++;
    });

    return { imported: successCount, skipped: skippedCount, status: "completed" };
  }
};


// ==========================================
// UTILITY HELPERS
// ==========================================
function formatDate(val) {
  if (!val) return "";
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(val);
}
`;
