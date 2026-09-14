import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface RecentFileRecord {
  id: string;
  name: string;
  size: number;
  type: string;
  timestamp: number;
  toolSlug: string;
  resultSize?: number;
}

export interface SavedSignature {
  id: string;
  name: string;
  dataUrl: string; // PNG base64
  createdAt: number;
}

interface DocEditProDB extends DBSchema {
  recentFiles: {
    key: string;
    value: RecentFileRecord;
    indexes: { 'by-timestamp': number };
  };
  signatures: {
    key: string;
    value: SavedSignature;
    indexes: { 'by-created': number };
  };
}

const DB_NAME = 'doceditpro-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<DocEditProDB>> | null = null;

function getDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<DocEditProDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('recentFiles')) {
          const recentStore = db.createObjectStore('recentFiles', { keyPath: 'id' });
          recentStore.createIndex('by-timestamp', 'timestamp');
        }
        if (!db.objectStoreNames.contains('signatures')) {
          const sigStore = db.createObjectStore('signatures', { keyPath: 'id' });
          sigStore.createIndex('by-created', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}

export async function addRecentFile(record: Omit<RecentFileRecord, 'id' | 'timestamp'>) {
  const db = await getDB();
  if (!db) return;
  const newRecord: RecentFileRecord = {
    ...record,
    id: Math.random().toString(36).substring(2, 10),
    timestamp: Date.now(),
  };
  await db.put('recentFiles', newRecord);
}

export async function getRecentFiles(limit = 20): Promise<RecentFileRecord[]> {
  const db = await getDB();
  if (!db) return [];
  const tx = db.transaction('recentFiles', 'readonly');
  const index = tx.store.index('by-timestamp');
  const all = await index.getAll();
  return all.reverse().slice(0, limit);
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  if (!db) return;
  const tx = db.transaction(['recentFiles', 'signatures'], 'readwrite');
  await tx.objectStore('recentFiles').clear();
  await tx.objectStore('signatures').clear();
  await tx.done;
}

export async function saveSignature(name: string, dataUrl: string): Promise<SavedSignature> {
  const db = await getDB();
  const sig: SavedSignature = {
    id: Math.random().toString(36).substring(2, 10),
    name,
    dataUrl,
    createdAt: Date.now(),
  };
  if (db) {
    await db.put('signatures', sig);
  }
  return sig;
}

export async function getSavedSignatures(): Promise<SavedSignature[]> {
  const db = await getDB();
  if (!db) return [];
  return db.getAllFromIndex('signatures', 'by-created');
}
