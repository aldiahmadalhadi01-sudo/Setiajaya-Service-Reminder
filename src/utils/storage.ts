const DB_NAME = 'SetiajayaToyotaDB';
const DB_VERSION = 1;
const STORE_NAME = 'kv_store';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment'));
        return;
      }
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

// Memory fallback cache in case storage is restricted
const memoryCache = new Map<string, any>();

export async function getStorageItem<T>(key: string, defaultValue: T): Promise<T> {
  // 1. Try IndexedDB
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    const result = await new Promise<T | undefined>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (result !== undefined && result !== null) {
      memoryCache.set(key, result);
      return result;
    }
  } catch (e) {
    console.warn(`[Storage] IndexedDB read error for key "${key}":`, e);
  }

  // 2. Fallback to localStorage
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      memoryCache.set(key, parsed);
      // Asynchronously migrate to IndexedDB
      setStorageItem(key, parsed).catch(() => {});
      return parsed;
    }
  } catch (e) {
    console.warn(`[Storage] localStorage read error for key "${key}":`, e);
  }

  // 3. Fallback to memory cache
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }

  // 4. Return default value and store it
  memoryCache.set(key, defaultValue);
  return defaultValue;
}

export async function setStorageItem<T>(key: string, value: T): Promise<void> {
  // Update memory cache immediately
  memoryCache.set(key, value);

  let idbSuccess = false;

  // 1. Primary persistence: IndexedDB (supports large datasets > 250MB)
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(value, key);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    idbSuccess = true;
  } catch (e) {
    console.warn(`[Storage] IndexedDB write error for key "${key}":`, e);
  }

  // 2. Secondary persistence: localStorage (wrapped safely to catch QuotaExceededError)
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    if (!idbSuccess) {
      console.warn(
        `[Storage] localStorage quota exceeded for key "${key}". Data is retained safely in IndexedDB and Memory cache.`,
        e
      );
    }
  }
}
