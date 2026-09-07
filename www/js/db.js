// ================== DATABASE (IndexedDB) ==================
const DB_NAME = 'KSP_Boawae_Desktop_Data';
const DB_VERSION = 7;
const STORE_LAPORAN = 'laporan_kunjungan';
const STORE_KEYS = 'keys_karyawan';
const STORE_USERS = 'users';
const SECRET_KEY = "KSP_BOAWAE_SECRET_2024";

let dbPromise = null;

function initDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = (e) => reject("IndexedDB Error: " + e.target.error);
        request.onsuccess = (e) => resolve(e.target.result);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_LAPORAN)) {
                db.createObjectStore(STORE_LAPORAN, { keyPath: 'id_aktivitas' });
            }
            if (!db.objectStoreNames.contains(STORE_KEYS)) {
                db.createObjectStore(STORE_KEYS, { keyPath: 'key_id' });
            }
            if (!db.objectStoreNames.contains(STORE_USERS)) {
                db.createObjectStore(STORE_USERS, { keyPath: 'nama' });
            }
        };
    });
    return dbPromise;
}

async function getDB() { return await initDB(); }

async function getLaporan() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_LAPORAN, 'readonly');
        const store = tx.objectStore(STORE_LAPORAN);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result.sort((a,b) => new Date(`${b.tanggal}T${b.jam}`) - new Date(`${a.tanggal}T${a.jam}`)));
        request.onerror = () => reject(request.error);
    });
}

async function saveLaporan(dataArray) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_LAPORAN, 'readwrite');
        const store = tx.objectStore(STORE_LAPORAN);
        dataArray.forEach(item => store.put(item));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function getKeys() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_KEYS, 'readonly');
        const store = tx.objectStore(STORE_KEYS);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveKey(keyData) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_KEYS, 'readwrite');
        const store = tx.objectStore(STORE_KEYS);
        store.put(keyData);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function deleteKey(keyId) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_KEYS, 'readwrite');
        const store = tx.objectStore(STORE_KEYS);
        store.delete(keyId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function getUsers() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_USERS, 'readonly');
        const store = tx.objectStore(STORE_USERS);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveUserToDB(user) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_USERS, 'readwrite');
        const store = tx.objectStore(STORE_USERS);
        store.put(user);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function deleteUserFromDB(nama) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_USERS, 'readwrite');
        const store = tx.objectStore(STORE_USERS);
        store.delete(nama);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function clearAllData() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_LAPORAN, STORE_KEYS, STORE_USERS], 'readwrite');
        tx.objectStore(STORE_LAPORAN).clear();
        tx.objectStore(STORE_KEYS).clear();
        tx.objectStore(STORE_USERS).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}
