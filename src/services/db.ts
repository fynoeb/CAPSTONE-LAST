import { db } from "../config/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

export interface RecordItem {
  id: string;
  nama: string;
  nik: string;
  namaIbu: string;
  gender: "L" | "P";
  usia: number;
  berat: number;
  tinggi: number;
  bbLahir?: number;
  tbLahir?: number;
  lk?: number;
  lila?: number;
  metodeTinggi?: string;
  naikBb?: number;
  jmlVitA?: number;
  kpsp?: number;
  kia?: number;
  kelasIbu?: number;
  mbg?: number;
  detail?: number;
  weightStatus: string;
  heightStatus: string;
  tanggal: string;
  timestamp?: number;
  puskesmas?: string;
  posyandu?: string;
  puskesmasName?: string;
  posyanduName?: string;
  inputBy?: string;
  kaderEmail?: string;
}

// Memory cache to store fetched records across pages for instant loading
let cachedRecords: RecordItem[] = [];
const CACHE_TTL_MS = 60 * 1000;
let cacheTime = 0;
let cachePuskesmas: string | null = null;
let isCacheLoaded = false;

export async function saveRecord(
  record: Omit<RecordItem, "id"> & { id?: string },
  isDemo: boolean,
  userEmail: string,
  puskesmasName: string,
  posyanduName: string
): Promise<RecordItem> {
  const finalRecord = {
    ...record,
    puskesmasName: puskesmasName || "Puskesmas Pauh - Padang",
    posyanduName: posyanduName || "Mawar - Kel. Limau Manis",
    kaderEmail: userEmail,
    timestamp: Date.now()
  };

  const localId = `local_${Date.now()}`;
  const newRecordItem = { ...finalRecord, id: localId } as any;

  // 1. Instantly save to local storage first so we never lose it
  try {
    const stored = localStorage.getItem("local_pemeriksaan_balita");
    const list = stored ? JSON.parse(stored) : [];
    list.unshift(newRecordItem);
    localStorage.setItem("local_pemeriksaan_balita", JSON.stringify(list));
  } catch (e) {
    console.error("Local storage save failed:", e);
  }

  // 2. Instantly update memory cache
  if (cachePuskesmas === finalRecord.puskesmasName) {
    cachedRecords = [newRecordItem, ...cachedRecords];
  } else {
    cachedRecords = [newRecordItem];
    cachePuskesmas = finalRecord.puskesmasName;
    isCacheLoaded = true;
  }

  // 3. Fire-and-forget write to Firestore in the background
  // This prevents any Firestore latency, hanging, or rules failure from blocking the snappy UI
  const colRef = collection(db, "pemeriksaan_balita");
  addDoc(colRef, finalRecord)
    .then((docRef) => {
      // Successfully saved to Firestore! We can update the memory cache item with the real doc ID
      const index = cachedRecords.findIndex(item => item.id === localId);
      if (index !== -1) {
        cachedRecords[index].id = docRef.id;
      }
    })
    .catch((err) => {
      console.warn("Background Firestore save skipped or failed (unconfigured, slow, or offline):", err);
    });

  // Return the record item instantly!
  return newRecordItem;
}

export async function getRecords(
  isDemo: boolean,
  userEmail: string,
  puskesmasName: string,
  onUpdate?: (records: RecordItem[]) => void
): Promise<RecordItem[]> {
  const targetPuskesmas = puskesmasName || "Puskesmas Pauh - Padang";

  let localList: RecordItem[] = [];
  try {
    const stored = localStorage.getItem("local_pemeriksaan_balita");
    if (stored) {
      localList = JSON.parse(stored);
    }
  } catch (e) {
    console.error("Local storage read failed:", e);
  }

  // Define a background fetcher that populates the cache
  const fetchFirestoreBackground = () => {
    const colRef = collection(db, "pemeriksaan_balita");
    const q = query(colRef, where("puskesmasName", "==", targetPuskesmas));
    
    getDocs(q)
      .then((querySnapshot) => {
        const records: RecordItem[] = [];
        querySnapshot.forEach((doc) => {
          records.push({
            ...doc.data(),
            id: doc.id,
          } as any);
        });
        const combined = [...localList.filter(item => item.puskesmasName === targetPuskesmas), ...records];
        combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        cachedRecords = combined;
        cachePuskesmas = targetPuskesmas;
        isCacheLoaded = true;
        cacheTime = Date.now();

        if (onUpdate) {
          onUpdate(combined);
        }
      })
      .catch((err) => {
        console.warn("Background fetch from Firestore failed (this is expected if Firestore is offline or unconfigured):", err);
      });
  };

  // Launch background fetch
  fetchFirestoreBackground();

  // If we already have the cache loaded, return it instantly!
  if (isCacheLoaded && cachePuskesmas === targetPuskesmas) {
    return [...cachedRecords];
  }

  // Otherwise, return local storage items instantly
  const combined = [...localList.filter(item => item.puskesmasName === targetPuskesmas)];
  combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  return combined;
}

export function getSeedRecords(): RecordItem[] {
  return [];
}
