import { DECRecord, ServiceCallRecord, APIConfig } from '../types';
import { initialDECData, initialServiceCallData } from '../utils/sampleData';
import { getStorageItem, setStorageItem } from '../utils/storage';

const CONFIG_STORAGE_KEY = 'SETIAJAYA_TOYOTA_API_CONFIG';
const LOCAL_DEC_KEY = 'SETIAJAYA_TOYOTA_DEC_DATA';
const LOCAL_SVC_KEY = 'SETIAJAYA_TOYOTA_SVC_DATA';

export function getAPIConfig(): APIConfig {
  const metaEnv = (import.meta as any).env || {};
  const envUrl = (
    metaEnv.VITE_GOOGLE_APP_SCRIPT_URL ||
    metaEnv.VITE_WEB_APP_URL ||
    metaEnv.VITE_GAS_URL ||
    metaEnv.VITE_APPS_SCRIPT_URL ||
    metaEnv.VITE_GOOGLE_SCRIPT_URL ||
    (typeof process !== 'undefined' && process.env ? (
      process.env.GOOGLE_APP_SCRIPT_URL ||
      process.env.WEB_APP_URL ||
      process.env.GAS_URL ||
      process.env.APPS_SCRIPT_URL ||
      ''
    ) : '') ||
    ''
  ).trim();

  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if ((!parsed.webAppUrl || parsed.webAppUrl.trim() === '') && envUrl) {
        parsed.webAppUrl = envUrl;
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to read API config from localStorage:', e);
  }

  return {
    webAppUrl: envUrl,
    useLocalStorageFallback: true,
    spreadsheetId: metaEnv.VITE_SPREADSHEET_ID || '1hFjw0SOG2Y32pO6H3PkLnHJxBbLrnP7p'
  };
}

export function saveAPIConfig(config: APIConfig) {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save API config to localStorage:', e);
  }
  setStorageItem(CONFIG_STORAGE_KEY, config).catch(() => {});
}

export async function getLocalDECData(): Promise<DECRecord[]> {
  return await getStorageItem<DECRecord[]>(LOCAL_DEC_KEY, initialDECData);
}

export async function saveLocalDECData(data: DECRecord[]): Promise<void> {
  await setStorageItem(LOCAL_DEC_KEY, data);
}

export async function getLocalServiceCallData(): Promise<ServiceCallRecord[]> {
  return await getStorageItem<ServiceCallRecord[]>(LOCAL_SVC_KEY, initialServiceCallData);
}

export async function saveLocalServiceCallData(data: ServiceCallRecord[]): Promise<void> {
  await setStorageItem(LOCAL_SVC_KEY, data);
}

// REST API Service wrapper with GAS fetch and Local Fallback
export const apiService = {
  async fetchDEC(): Promise<DECRecord[]> {
    const config = getAPIConfig();
    if (config.webAppUrl && config.webAppUrl.trim() !== '') {
      try {
        const res = await fetch(`${config.webAppUrl}?action=getDEC`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      } catch (err) {
        console.warn('Google Apps Script GET DEC error, using local fallback:', err);
      }
    }
    return await getLocalDECData();
  },

  async addDEC(record: DECRecord): Promise<void> {
    const config = getAPIConfig();
    if (config.webAppUrl && config.webAppUrl.trim() !== '') {
      try {
        await fetch(config.webAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'addDEC', data: record })
        });
      } catch (err) {
        console.warn('Google Apps Script POST addDEC error:', err);
      }
    }
    const current = await getLocalDECData();
    const updated = [record, ...current];
    await saveLocalDECData(updated);
  },

  async updateDEC(record: DECRecord): Promise<void> {
    const config = getAPIConfig();
    if (config.webAppUrl && config.webAppUrl.trim() !== '') {
      try {
        await fetch(config.webAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'updateDEC', data: record })
        });
      } catch (err) {
        console.warn('Google Apps Script updateDEC error:', err);
      }
    }
    const current = await getLocalDECData();
    const updated = current.map(item => (item.vin === record.vin || item.id === record.id ? record : item));
    await saveLocalDECData(updated);
  },

  async deleteDEC(idOrVin: string): Promise<void> {
    const config = getAPIConfig();
    if (config.webAppUrl && config.webAppUrl.trim() !== '') {
      try {
        await fetch(`${config.webAppUrl}?action=deleteDEC&id=${encodeURIComponent(idOrVin)}`, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'deleteDEC', id: idOrVin })
        });
      } catch (err) {
        console.warn('Google Apps Script deleteDEC error:', err);
      }
    }
    const current = await getLocalDECData();
    const updated = current.filter(item => item.id !== idOrVin && item.vin !== idOrVin);
    await saveLocalDECData(updated);
  },

  async fetchServiceCalls(): Promise<ServiceCallRecord[]> {
    const config = getAPIConfig();
    if (config.webAppUrl && config.webAppUrl.trim() !== '') {
      try {
        const res = await fetch(`${config.webAppUrl}?action=getServiceCalls`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      } catch (err) {
        console.warn('Google Apps Script GET ServiceCalls error, using local fallback:', err);
      }
    }
    return await getLocalServiceCallData();
  },

  async addServiceCall(record: ServiceCallRecord): Promise<void> {
    const config = getAPIConfig();
    if (config.webAppUrl && config.webAppUrl.trim() !== '') {
      try {
        await fetch(config.webAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'addServiceCall', data: record })
        });
      } catch (err) {
        console.warn('Google Apps Script addServiceCall error:', err);
      }
    }
    const current = await getLocalServiceCallData();
    const updated = [record, ...current];
    await saveLocalServiceCallData(updated);
  },

  async updateServiceCall(record: ServiceCallRecord): Promise<void> {
    const config = getAPIConfig();
    if (config.webAppUrl && config.webAppUrl.trim() !== '') {
      try {
        await fetch(config.webAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'updateServiceCall', data: record })
        });
      } catch (err) {
        console.warn('Google Apps Script updateServiceCall error:', err);
      }
    }
    const current = await getLocalServiceCallData();
    const updated = current.map(item => (item.no_invoice === record.no_invoice || item.id === record.id ? record : item));
    await saveLocalServiceCallData(updated);
  },

  async deleteServiceCall(idOrInvoice: string): Promise<void> {
    const config = getAPIConfig();
    if (config.webAppUrl && config.webAppUrl.trim() !== '') {
      try {
        await fetch(config.webAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'deleteServiceCall', id: idOrInvoice })
        });
      } catch (err) {
        console.warn('Google Apps Script deleteServiceCall error:', err);
      }
    }
    const current = await getLocalServiceCallData();
    const updated = current.filter(item => item.id !== idOrInvoice && item.no_invoice !== idOrInvoice);
    await saveLocalServiceCallData(updated);
  },

  async batchImportDEC(records: DECRecord[]): Promise<void> {
    const config = getAPIConfig();
    if (config.webAppUrl && config.webAppUrl.trim() !== '') {
      try {
        await fetch(config.webAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'importDEC', records })
        });
      } catch (err) {
        console.warn('Google Apps Script importDEC error:', err);
      }
    }
    const current = await getLocalDECData();
    await saveLocalDECData([...records, ...current]);
  },

  async batchImportServiceCalls(records: ServiceCallRecord[], duplicateMode: string): Promise<void> {
    const config = getAPIConfig();
    if (config.webAppUrl && config.webAppUrl.trim() !== '') {
      try {
        await fetch(config.webAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'importServiceCall', records, duplicateMode })
        });
      } catch (err) {
        console.warn('Google Apps Script importServiceCall error:', err);
      }
    }
    const current = await getLocalServiceCallData();
    let updated: ServiceCallRecord[];

    if (duplicateMode === 'replace') {
      const map = new Map<string, ServiceCallRecord>();
      current.forEach(r => map.set(r.no_invoice || r.id, r));
      records.forEach(r => map.set(r.no_invoice || r.id, r));
      updated = Array.from(map.values());
    } else if (duplicateMode === 'skip') {
      const existingKeys = new Set(current.map(r => r.no_invoice || r.id));
      const newRecs = records.filter(r => !existingKeys.has(r.no_invoice || r.id));
      updated = [...newRecs, ...current];
    } else {
      updated = [...records, ...current];
    }

    await saveLocalServiceCallData(updated);
  },

  async testConnection(url: string): Promise<boolean> {
    if (!url || !url.startsWith('http')) return false;
    try {
      const res = await fetch(`${url}?action=getKPI`);
      const json = await res.json();
      return json.success === true;
    } catch (e) {
      return false;
    }
  }
};
