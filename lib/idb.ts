import { openDB, type IDBPDatabase } from "idb";
import type { OneRepMaxMethod, OneRepMaxRange } from "@/lib/analytics/oneRepMax";

const DB_NAME = "strong-web-cache";
const STORE_NAME = "readonly";
const DB_VERSION = 1;

export type HistoryCacheRange = "7d" | "30d";

export function historySnapshotKey(range: HistoryCacheRange) {
  return `history:snapshot:${range}`;
}

export const HISTORY_SUMMARY_CACHE_KEY = "history:summary";

export function oneRepMaxCacheKey(range: OneRepMaxRange, method: OneRepMaxMethod) {
  return `history:one-rm:${method}:${range}`;
}

interface CacheEntry<T> {
  value: T;
  updatedAt: number;
}

let dbPromise: Promise<IDBPDatabase<unknown>> | null = null;

async function getDatabase() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function readCache<T>(key: string): Promise<CacheEntry<T> | null> {
  if (typeof window === "undefined") return null;
  const db = await getDatabase();
  const value = await db.get(STORE_NAME, key);
  return (value as CacheEntry<T> | undefined) ?? null;
}

export async function writeCache<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  const db = await getDatabase();
  const entry: CacheEntry<T> = {
    value,
    updatedAt: Date.now(),
  };
  await db.put(STORE_NAME, entry, key);
}

export async function clearCache(key?: string) {
  if (typeof window === "undefined") return;
  const db = await getDatabase();
  if (key) {
    await db.delete(STORE_NAME, key);
  } else {
    await db.clear(STORE_NAME);
  }
}
