export const DB_NAME = "RetroBoxDB";
export const DB_VERSION = 1;

export const STORES = {
  SAVE_STATES: "saveStates",
  ROM_CACHE: "romCache",
};

export function initDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("IndexedDB 열기 실패"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

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

export async function saveGameState(gameTitle, slot, snapshot) {
  const db = await initDatabase();
  const transaction = db.transaction([STORES.SAVE_STATES], "readwrite");
  const store = transaction.objectStore(STORES.SAVE_STATES);

  const saveData = {
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

export async function loadGameState(gameTitle, slot) {
  const db = await initDatabase();
  const transaction = db.transaction([STORES.SAVE_STATES], "readonly");
  const store = transaction.objectStore(STORES.SAVE_STATES);

  return new Promise((resolve, reject) => {
    const request = store.get(`${gameTitle}_slot_${slot}`);
    request.onsuccess = () => {
      resolve(request.result?.data || null);
    };
    request.onerror = () => reject(new Error("세이브 로드 실패"));
  });
}

export async function getGameSaveStates(gameTitle) {
  const db = await initDatabase();
  const transaction = db.transaction([STORES.SAVE_STATES], "readonly");
  const store = transaction.objectStore(STORES.SAVE_STATES);
  const index = store.index("gameTitle");

  return new Promise((resolve, reject) => {
    const request = index.getAll(gameTitle);
    request.onsuccess = () => {
      const saves = request.result.reduce((acc, save) => {
        acc[save.slot] = {
          timestamp: save.timestamp,
          data: save.data,
        };
        return acc;
      }, {});
      resolve(saves);
    };
    request.onerror = () => reject(new Error("세이브 목록 조회 실패"));
  });
}

export async function deleteGameSave(gameTitle, slot) {
  const db = await initDatabase();
  const transaction = db.transaction([STORES.SAVE_STATES], "readwrite");
  const store = transaction.objectStore(STORES.SAVE_STATES);

  return new Promise((resolve, reject) => {
    const request = store.delete(`${gameTitle}_slot_${slot}`);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(new Error("세이브 삭제 실패"));
  });
}

export async function deleteAllGameSaves(gameTitle) {
  const db = await initDatabase();
  const transaction = db.transaction([STORES.SAVE_STATES], "readwrite");
  const store = transaction.objectStore(STORES.SAVE_STATES);
  const index = store.index("gameTitle");

  return new Promise((resolve, reject) => {
    const request = index.openCursor(gameTitle);
    request.onsuccess = () => {
      const cursor = request.result;
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

export async function saveRomToCache(fileName, romData) {
  const db = await initDatabase();
  const transaction = db.transaction([STORES.ROM_CACHE], "readwrite");
  const store = transaction.objectStore(STORES.ROM_CACHE);

  const romCacheData = {
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

export async function loadRomFromCache(fileName) {
  const db = await initDatabase();
  const transaction = db.transaction([STORES.ROM_CACHE], "readonly");
  const store = transaction.objectStore(STORES.ROM_CACHE);

  return new Promise((resolve, reject) => {
    const request = store.get(fileName);
    request.onsuccess = () => {
      if (request.result) {
        resolve(new Uint8Array(request.result.data));
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(new Error("롬 캐시 로드 실패"));
  });
}

export async function deleteRomFromCache(fileName) {
  const db = await initDatabase();
  const transaction = db.transaction([STORES.ROM_CACHE], "readwrite");
  const store = transaction.objectStore(STORES.ROM_CACHE);

  return new Promise((resolve, reject) => {
    const request = store.delete(fileName);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(new Error("롬 캐시 삭제 실패"));
  });
}

export async function getRomCacheInfo() {
  const db = await initDatabase();
  const transaction = db.transaction([STORES.ROM_CACHE], "readonly");
  const store = transaction.objectStore(STORES.ROM_CACHE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const roms = request.result.map((rom) => ({
        fileName: rom.fileName,
        size: rom.size,
        timestamp: rom.timestamp,
      }));
      resolve(roms);
    };
    request.onerror = () => reject(new Error("롬 캐시 정보 조회 실패"));
  });
}
