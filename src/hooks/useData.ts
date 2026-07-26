import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DECRecord,
  ServiceCallRecord,
  ServiceReminder,
  DashboardKPI,
  TrendDataPoint,
  DealerDistribution,
  RingAreaDistribution,
  SALeaderboard,
  APIConfig
} from '../types';
import { apiService, getAPIConfig, saveAPIConfig } from '../services/api';
import { calculateReminders } from '../utils/reminderCalculator';

export function useData() {
  const [decList, setDecList] = useState<DECRecord[]>([]);
  const [serviceCallList, setServiceCallList] = useState<ServiceCallRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [apiConfig, setApiConfigState] = useState<APIConfig>(getAPIConfig());
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [decs, svcs] = await Promise.all([
        apiService.fetchDEC(),
        apiService.fetchServiceCalls()
      ]);
      setDecList(decs);
      setServiceCallList(svcs);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateConfig = (newConfig: APIConfig) => {
    saveAPIConfig(newConfig);
    setApiConfigState(newConfig);
    loadData();
  };

  // Calculated Reminders Realtime
  const reminders = useMemo<ServiceReminder[]>(() => {
    return calculateReminders(decList, serviceCallList);
  }, [decList, serviceCallList]);

  // Realtime KPIs
  const kpis = useMemo<DashboardKPI>(() => {
    let todayCount = 0;
    let overdueCount = 0;
    let h7Count = 0;

    reminders.forEach(r => {
      if (r.status === 'HARI INI') todayCount++;
      else if (r.status === 'OVERDUE') overdueCount++;
      else if (r.status === 'H-7') h7Count++;
    });

    const uniqueCustomers = new Set<string>();
    decList.forEach(d => d.nama_customer && uniqueCustomers.add(d.nama_customer));
    serviceCallList.forEach(s => s.nama_customer && uniqueCustomers.add(s.nama_customer));

    return {
      totalUnitDEC: decList.length,
      unitAktifService: serviceCallList.length,
      jadwalHariIni: todayCount,
      serviceOverdue: overdueCount,
      reminderH7: h7Count,
      totalCustomer: uniqueCustomers.size
    };
  }, [decList, serviceCallList, reminders]);

  // Trend Chart Data
  const trendData = useMemo<TrendDataPoint[]>(() => {
    const counts: Record<string, number> = {};

    serviceCallList.forEach(s => {
      const dateStr = (s.tanggal_entry && String(s.tanggal_entry).trim()) 
        ? String(s.tanggal_entry).trim() 
        : (s.tanggal_invoice || s.tanggal_so);
      if (!dateStr) return;

      let key = dateStr;
      if (trendPeriod === 'weekly') {
        key = s.week ? `Minggu (${s.week})` : 'Minggu 1';
      } else if (trendPeriod === 'monthly') {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          key = new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' }).format(d);
        } else {
          key = dateStr.substring(0, 7);
        }
      }

      counts[key] = (counts[key] || 0) + 1;
    });

    const result = Object.keys(counts).map(k => ({
      label: k,
      totalService: counts[k]
    }));

    if (trendPeriod === 'daily') {
      result.sort((a, b) => a.label.localeCompare(b.label));
    }

    return result.length > 0 ? result : [
      { label: '2026-07-20', totalService: 3 },
      { label: '2026-07-21', totalService: 5 },
      { label: '2026-07-22', totalService: 8 },
      { label: '2026-07-23', totalService: 4 },
      { label: '2026-07-24', totalService: 9 },
      { label: '2026-07-25', totalService: 6 }
    ];
  }, [serviceCallList, trendPeriod]);

  // Dealer Distribution Top 5
  const dealerDistribution = useMemo<DealerDistribution[]>(() => {
    const counts: Record<string, number> = {};
    serviceCallList.forEach(s => {
      const dealer = s.dealer_penjual || 'Setiajaya Depok';
      counts[dealer] = (counts[dealer] || 0) + 1;
    });

    const sorted = Object.keys(counts)
      .map(dealer => ({ dealer, count: counts[dealer] }))
      .sort((a, b) => b.count - a.count);

    return sorted.slice(0, 5);
  }, [serviceCallList]);

  // Ring Area Distribution
  const ringAreaDistribution = useMemo<RingAreaDistribution[]>(() => {
    const counts: Record<string, number> = {
      'Ring 1': 0,
      'Ring 2': 0,
      'Ring 3': 0,
      'Outer': 0
    };

    serviceCallList.forEach(s => {
      const ring = s.ring_area || 'Ring 1';
      if (counts[ring] !== undefined) {
        counts[ring]++;
      } else {
        counts['Outer']++;
      }
    });

    return Object.keys(counts).map(ring => ({
      ring,
      count: counts[ring]
    }));
  }, [serviceCallList]);

  // Leaderboard Service Advisor
  const saLeaderboard = useMemo<SALeaderboard[]>(() => {
    const total = serviceCallList.length || 1;
    const counts: Record<string, number> = {};

    serviceCallList.forEach(s => {
      const sa = s.service_advisor || 'Unassigned';
      counts[sa] = (counts[sa] || 0) + 1;
    });

    const list = Object.keys(counts)
      .map(sa => ({
        name: sa,
        totalService: counts[sa],
        percentage: Math.round((counts[sa] / total) * 100),
        rank: 0
      }))
      .sort((a, b) => b.totalService - a.totalService);

    list.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return list;
  }, [serviceCallList]);

  return {
    decList,
    serviceCallList,
    reminders,
    kpis,
    trendData,
    trendPeriod,
    setTrendPeriod,
    dealerDistribution,
    ringAreaDistribution,
    saLeaderboard,
    loading,
    refreshing,
    loadData,
    apiConfig,
    updateConfig,
    // CRUD Handlers
    addDEC: async (rec: DECRecord) => {
      await apiService.addDEC(rec);
      await loadData(true);
    },
    updateDEC: async (rec: DECRecord) => {
      await apiService.updateDEC(rec);
      await loadData(true);
    },
    deleteDEC: async (idOrVin: string) => {
      await apiService.deleteDEC(idOrVin);
      await loadData(true);
    },
    addServiceCall: async (rec: ServiceCallRecord) => {
      await apiService.addServiceCall(rec);
      await loadData(true);
    },
    updateServiceCall: async (rec: ServiceCallRecord) => {
      await apiService.updateServiceCall(rec);
      await loadData(true);
    },
    deleteServiceCall: async (idOrInvoice: string) => {
      await apiService.deleteServiceCall(idOrInvoice);
      await loadData(true);
    },
    importDEC: async (recs: DECRecord[]) => {
      await apiService.batchImportDEC(recs);
      await loadData(true);
    },
    importServiceCalls: async (recs: ServiceCallRecord[], mode: string) => {
      await apiService.batchImportServiceCalls(recs, mode);
      await loadData(true);
    }
  };
}
