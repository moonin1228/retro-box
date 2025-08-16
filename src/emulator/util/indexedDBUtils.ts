export const DB_NAME = "RetroBoxDB";
export const DB_VERSION = 1;

export const STORES = {
  SAVE_STATES: "saveStates",
  ROM_CACHE: "romCache",
} as const;

type StoreName = (typeof STORES)[keyof typeof STORES];

export interface SaveStateRecord {
  id: string;
  gameTitle: string;
  slot: number;
  timestamp: number;
  data: unknown;
}

export interface RomCacheRecord {
  fileName: string;
  data: number[];
  timestamp: number;
  size: number;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("IndexedDB 열기 실패"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.SAVE_STATES)) {
        const saveStore = db.createObjectStore(STORES.SAVE_STATES, { keyPath: "id" });
        saveStore.createIndex("gameTitle", "gameTitle", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.ROM_CACHE)) {
        db.createObjectStore(STORES.ROM_CACHE, { keyPath: "fileName" });
      }
    };
  });
}

export function initDatabase(): Promise<IDBDatabase> {
  return openDatabase();
}

function getStore(db: IDBDatabase, name: StoreName, mode: IDBTransactionMode): IDBObjectStore {
  const tx = db.transaction([name], mode);
  return tx.objectStore(name);
}

export async function saveGameState(gameTitle: string, slot: number, snapshot: unknown): Promise<boolean> {
  const db = await initDatabase();
  const store = getStore(db, STORES.SAVE_STATES, "readwrite");

  const saveData: SaveStateRecord = {
    id: `${gameTitle}_slot_${slot}`,
    gameTitle,
    slot,
    timestamp: Date.now(),
    data: snapshot,
  };

  return new Promise((resolve, reject) => {
    const request = store.put(saveData);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(new Error("세이브 저장 실패"));
  });
}

export async function loadGameState(gameTitle: string, slot: number): Promise<unknown | null> {
  const db = await initDatabase();
  const store = getStore(db, STORES.SAVE_STATES, "readonly");

  return new Promise((resolve, reject) => {
    const request = store.get(`${gameTitle}_slot_${slot}`);
    request.onsuccess = () => {
      resolve((request.result as SaveStateRecord | undefined)?.data ?? null);
    };
    request.onerror = () => reject(new Error("세이브 로드 실패"));
  });
}

export async function getGameSaveStates(
  gameTitle: string,
): Promise<Record<number, { timestamp: number; data: unknown }>> {
  const db = await initDatabase();
  const store = getStore(db, STORES.SAVE_STATES, "readonly");
  const index = store.index("gameTitle");

  return new Promise((resolve, reject) => {
    const request = index.getAll(gameTitle);
    request.onsuccess = () => {
      const savesArray = (request.result as SaveStateRecord[]) || [];
      const saves = savesArray.reduce<Record<number, { timestamp: number; data: unknown }>>(
        (acc, save) => {
          acc[save.slot] = {
            timestamp: save.timestamp,
            data: save.data,
          };
          return acc;
        },
        {},
      );
      resolve(saves);
    };
    request.onerror = () => reject(new Error("세이브 목록 조회 실패"));
  });
}

export async function deleteGameSave(gameTitle: string, slot: number): Promise<boolean> {
  const db = await initDatabase();
  const store = getStore(db, STORES.SAVE_STATES, "readwrite");

  return new Promise((resolve, reject) => {
    const request = store.delete(`${gameTitle}_slot_${slot}`);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(new Error("세이브 삭제 실패"));
  });
}

export async function deleteAllGameSaves(gameTitle: string): Promise<boolean> {
  const db = await initDatabase();
  const store = getStore(db, STORES.SAVE_STATES, "readwrite");
  const index = store.index("gameTitle");

  return new Promise((resolve, reject) => {
    const request = index.openCursor(gameTitle);
    request.onsuccess = () => {
      const cursor = request.result as IDBCursorWithValue | null;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve(true);
      }
    };
    request.onerror = () => reject(new Error("게임 세이브 전체 삭제 실패"));
  });
}

export async function saveRomToCache(fileName: string, romData: Uint8Array): Promise<boolean> {
  const db = await initDatabase();
  const store = getStore(db, STORES.ROM_CACHE, "readwrite");

  const romCacheData: RomCacheRecord = {
    fileName,
    data: Array.from(romData),
    timestamp: Date.now(),
    size: romData.length,
  };

  return new Promise((resolve, reject) => {
    const request = store.put(romCacheData);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(new Error("롬 캐시 저장 실패"));
  });
}

export async function loadRomFromCache(fileName: string): Promise<Uint8Array | null> {
  const db = await initDatabase();
  const store = getStore(db, STORES.ROM_CACHE, "readonly");

  return new Promise((resolve, reject) => {
    const request = store.get(fileName);
    request.onsuccess = () => {
      const result = request.result as RomCacheRecord | undefined;
      if (result) {
        resolve(new Uint8Array(result.data));
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(new Error("롬 캐시 로드 실패"));
  });
}

export async function deleteRomFromCache(fileName: string): Promise<boolean> {
  const db = await initDatabase();
  const store = getStore(db, STORES.ROM_CACHE, "readwrite");

  return new Promise((resolve, reject) => {
    const request = store.delete(fileName);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(new Error("롬 캐시 삭제 실패"));
  });
}

export async function getRomCacheInfo(): Promise<Array<Pick<RomCacheRecord, "fileName" | "size" | "timestamp">>> {
  const db = await initDatabase();
  const store = getStore(db, STORES.ROM_CACHE, "readonly");

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const roms = (request.result as RomCacheRecord[]).map((rom) => ({
        fileName: rom.fileName,
        size: rom.size,
        timestamp: rom.timestamp,
      }));
      resolve(roms);
    };
    request.onerror = () => reject(new Error("롬 캐시 정보 조회 실패"));
  });
}





