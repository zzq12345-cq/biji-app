/**
 * IndexedDB 存储封装 — 用于存储笔记图片等大数据
 * 解决 localStorage 5-10MB 限制问题
 */

const DB_NAME = "biji-app";
const DB_VERSION = 1;
const IMAGE_STORE = "note-images";

let dbInstance = null;

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (typeof window === "undefined") return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE, { keyPath: "noteId" });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * 保存笔记图片到 IndexedDB
 * @param {string} noteId - 笔记 ID
 * @param {string[]} images - base64 图片数组
 */
export async function saveNoteImages(noteId, images) {
  try {
    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(IMAGE_STORE, "readwrite");
    tx.objectStore(IMAGE_STORE).put({ noteId, images, updatedAt: Date.now() });
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn("IndexedDB save failed:", e);
  }
}

/**
 * 获取笔记图片
 * @param {string} noteId
 * @returns {Promise<string[]>}
 */
export async function getNoteImages(noteId) {
  try {
    const db = await openDB();
    if (!db) return [];
    const tx = db.transaction(IMAGE_STORE, "readonly");
    const request = tx.objectStore(IMAGE_STORE).get(noteId);
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result?.images || []);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * 删除笔记图片
 * @param {string} noteId
 */
export async function deleteNoteImages(noteId) {
  try {
    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(IMAGE_STORE, "readwrite");
    tx.objectStore(IMAGE_STORE).delete(noteId);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn("IndexedDB delete failed:", e);
  }
}
