// Queue persistante de séries non-synchronisées (IndexedDB).
// Garantit qu'une série loguée hors-ligne n'est jamais perdue,
// même si l'utilisateur ferme l'onglet avant la reconnexion.

const DB_NAME = "horion-offline";
const DB_VERSION = 1;
const STORE = "pending_sets";

export type PendingSet = {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  durationSec: number | null;
  createdAt: number;
};

export type StoredSet = PendingSet & { id: number };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB indisponible"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("by_session", "sessionId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txAsync<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  op: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const req = op(store);
    tx.oncomplete = () => {
      if (req) resolve(req.result);
      else resolve();
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function enqueueSet(set: PendingSet): Promise<void> {
  const db = await openDb();
  await txAsync(db, "readwrite", (s) => s.add(set));
}

export async function getQueue(): Promise<StoredSet[]> {
  const db = await openDb();
  const result = await txAsync<StoredSet[]>(db, "readonly", (s) => s.getAll());
  return result ?? [];
}

export async function getQueueForSession(
  sessionId: string,
): Promise<StoredSet[]> {
  const all = await getQueue();
  return all.filter((s) => s.sessionId === sessionId);
}

export async function removeFromQueue(id: number): Promise<void> {
  const db = await openDb();
  await txAsync(db, "readwrite", (s) => s.delete(id));
}

export async function clearQueue(): Promise<void> {
  const db = await openDb();
  await txAsync(db, "readwrite", (s) => s.clear());
}
