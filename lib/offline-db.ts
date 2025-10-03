import Dexie, { type Table } from "dexie";

/**
 * Cached workout entity that mirrors the most relevant fields for offline use.
 */
export interface CachedWorkout {
  id: string;
  started_at: string;
  sets: unknown[];
}

/**
 * Strong Web offline database backed by IndexedDB via Dexie.
 */
class OfflineDB extends Dexie {
  workouts!: Table<CachedWorkout, string>;

  constructor() {
    super("StrongWebDB");
    this.version(1).stores({
      workouts: "id, started_at",
    });
  }
}

export const db = new OfflineDB();
