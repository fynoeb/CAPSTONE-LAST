import React, { useState, useMemo, useEffect } from "react";
import { useAuth, isDummyAccount } from "../../config/AuthContext";
import { Search, MapPin, Mail, Shield, Check, Calendar, ArrowRight, UserCheck, ShieldAlert, CheckCircle2, ChevronRight, Users, Clipboard } from "lucide-react";
import { getRecords, RecordItem } from "../../services/db";
import DetailBalitaModal from "../../components/DetailBalitaModal";

interface KaderItem {
  id: string;
  nama: string;
  email: string;
  role: "Kader" | "Bidan";
  posyandu: string;
  wilayah: string;
  status: "Aktif" | "Nonaktif";
}

// Predefined capstone kaders matching page 16 of documentation
const BASELINE_KADERS: KaderItem[] = [
  {
    id: "kader-1",
    nama: "Siti Aminah",
    email: "siti@posyandu.id",
    role: "Kader",
    posyandu: "Mawar - Kel. Limau Manis",
    wilayah: "Pos. Mawar",
    status: "Aktif"
  },
  {
    id: "kader-2",
    nama: "Dewi Lestari",
    email: "dewi@posyandu.id",
    role: "Kader",
    posyandu: "Melati",
    wilayah: "Pos. Melati",
    status: "Aktif"
  },
  {
    id: "kader-3",
    nama: "Rini Susanti",
    email: "rini@posyandu.id",
    role: "Kader",
    posyandu: "Anggrek",
    wilayah: "Pos. Anggrek",
    status: "Aktif"
  },
  {
    id: "kader-4",
    nama: "Bambang Sutrisno",
    email: "bambang@gizi.id",
    role: "Bidan",
    posyandu: "Puskesmas Pauh - Padang",
    wilayah: "Kel. Pauh",
    status: "Aktif"
  }
];

// Baseline child records to ensure matches with existing list
const BASELINE_RECORDS: RecordItem[] = [
  {
    id: "baseline-1",
    nama: "Kaisar Zayn Anogi",
    nik: "1371021404210001",
    namaIbu: "Desi",
    gender: "L",
    usia: 51,
    berat: 15.8,
    tinggi: 107.0,
    bbLahir: 3.2,
    tbLahir: 50.0,
    lk: 48.0,
    lila: 14.5,
    metodeTinggi: "Berdiri",
    weightStatus: "Gizi Baik",
    heightStatus: "Normal",
    tanggal: "14 Jun 2026",
    posyanduName: "Mawar - Kel. Limau Manis",
    puskesmasName: "Puskesmas Pauh - Padang",
    kaderEmail: "siti@posyandu.id",
    timestamp: 1781520000000
  },
  {
    id: "baseline-2",
    nama: "Ariyan Syah Gibran",
    nik: "1371022205210002",
    namaIbu: "Siti Aminah",
    gender: "L",
    usia: 48,
    berat: 11.5,
    tinggi: 98.2,
    bbLahir: 3.0,
    tbLahir: 49.0,
    lk: 47.0,
    lila: 13.2,
    metodeTinggi: "Berdiri",
    weightStatus: "Gizi Kurang",
    heightStatus: "Normal",
    tanggal: "14 Jun 2026",
    posyanduName: "Melati",
    puskesmasName: "Puskesmas Pauh - Padang",
    kaderEmail: "dewi@posyandu.id",
    timestamp: 1781519000000
  },
  {
    id: "baseline-3",
    nama: "Ariana Putri Purnama",
    nik: "1371024303210003",
    namaIbu: "Desi Aprimayuni",
    gender: "P",
    usia: 51,
    berat: 14.8,
    tinggi: 105.5,
    bbLahir: 3.1,
    tbLahir: 50.0,
    lk: 47.5,
    lila: 14.0,
    metodeTinggi: "Berdiri",
    weightStatus: "Gizi Baik",
    heightStatus: "Normal",
    tanggal: "14 Jun 2026",
    posyanduName: "Mawar - Kel. Limau Manis",
    puskesmasName: "Puskesmas Pauh - Padang",
    kaderEmail: "siti@posyandu.id",
    timestamp: 1781518000000
  },
  {
    id: "baseline-4",
    nama: "Citra Dewi",
    nik: "1371025506210004",
    namaIbu: "Ibu Ningsih",
    gender: "P",
    usia: 45,
    berat: 9.8,
    tinggi: 85.8,
    bbLahir: 2.8,
    tbLahir: 48.0,
    lk: 46.5,
    lila: 12.5,
    metodeTinggi: "Berdiri",
    weightStatus: "Gizi Buruk",
    heightStatus: "Sangat Pendek (Severely Stunted)",
    tanggal: "14 Jun 2026",
    posyanduName: "Anggrek",
    puskesmasName: "Puskesmas Pauh - Padang",
    kaderEmail: "rini@posyandu.id",
    timestamp: 1781517000000
  },
  {
    id: "baseline-5",
    nama: "Budi Santoso",
    nik: "1371021208210005",
    namaIbu: "Ibu Isna",
    gender: "L",
    usia: 53,
    berat: 12.0,
    tinggi: 100.5,
    bbLahir: 3.2,
    tbLahir: 49.0,
    lk: 48.0,
    lila: 13.0,
    metodeTinggi: "Berdiri",
    weightStatus: "Gizi Kurang",
    heightStatus: "Pendek (Stunted)",
    tanggal: "13 Jun 2026",
    posyanduName: "Dahlia",
    puskesmasName: "Puskesmas Pauh - Padang",
    kaderEmail: "siti@posyandu.id",
    timestamp: 1781516000000
  }
];

export default function DataKader() {
  const { user, isDemo, mockUser, puskesmasName } = useAuth();
  const [dbRecords, setDbRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKader, setSelectedKader] = useState<KaderItem | null>(BASELINE_KADERS[0]);
  const [selectedBalita, setSelectedBalita] = useState<RecordItem | null>(null);

  const userEmail = (isDemo ? mockUser : user?.email) || "";
  const isDummy = isDummyAccount(userEmail);
  const locationName = useMemo(
    () => puskesmasName || (isDummy ? "Puskesmas Pauh - Padang" : "Puskesmas Wilayah"),
    [puskesmasName, isDummy]
  );

  useEffect(() => {
    let active = true;
    const handleUpdate = (latestData: RecordItem[]) => {
      if (active) {
        setDbRecords(latestData);
        setLoading(false);
      }
    };

    getRecords(isDemo, userEmail, locationName, handleUpdate)
      .then((data) => {
        if (active) {
          setDbRecords(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Failed loading records in Data Kader:", err);
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [isDemo, userEmail, locationName]);

  // Combine Firestore and Baseline records
  const allRecords = useMemo(() => {
    const ids = new Set(dbRecords.map(r => r.nik));
    const filteredBaseline = BASELINE_RECORDS.filter(r => !ids.has(r.nik));
    return [...dbRecords, ...filteredBaseline].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [dbRecords]);

  // Extract any raw emails dynamically as well to display them as potential kaders
  const dynamicKaders = useMemo(() => {
    const activeEmails = new Set(BASELINE_KADERS.map((k) => k.email.toLowerCase()));
    const list: KaderItem[] = [...BASELINE_KADERS];

    allRecords.forEach((rec) => {
      if (rec.kaderEmail && !activeEmails.has(rec.kaderEmail.toLowerCase())) {
        const parts = rec.kaderEmail.split("@")[0] || "User";
        const cleanName = parts.charAt(0).toUpperCase() + parts.slice(1);
        const newKader: KaderItem = {
          id: `kader-dyn-${rec.kaderEmail}`,
          nama: cleanName,
          email: rec.kaderEmail,
          role: "Kader",
          posyandu: rec.posyanduName || rec.posyandu || "Mawar",
          wilayah: rec.posyanduName || rec.posyandu || "Mawar",
          status: "Aktif"
        };
        list.push(newKader);
        activeEmails.add(rec.kaderEmail.toLowerCase());
      }
    });

    return list;
  }, [allRecords]);

  // Filtered list of Kaders by name search
  const filteredKaders = useMemo(() => {
    return dynamicKaders.filter((k) => 
      k.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.posyandu.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [dynamicKaders, searchTerm]);

  // Filter checks done by selected Kader
  const checkedChildren = useMemo(() => {
    if (!selectedKader) return [];
    return allRecords.filter((rec) => {
      // Check exact matching with kader email, or matching by posyandu if email wasn't recorded properly
      const hasEmailMatch = rec.kaderEmail?.toLowerCase() === selectedKader.email.toLowerCase();
      const hasPosyanduFallback = rec.posyanduName?.toLowerCase().includes(selectedKader.wilayah.toLowerCase()) || 
                                  rec.posyandu?.toLowerCase().includes(selectedKader.wilayah.toLowerCase());
      
      // Prioritize email match if both records have email field
      if (rec.kaderEmail) {
        return hasEmailMatch;
      }
      return hasPosyanduFallback;
    });
  }, [allRecords, selectedKader]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      
      {/* Page Header */}
      <div>
        <span className="text-[10px] font-black uppercase text-[#369AF0] tracking-wider block">Manajemen Tugas Lapangan</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mt-1">Data Kader & Petugas</h1>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Pantau seluruh kader aktif, penugasan posyandu, dan tinjau riwayat pemeriksaan balita spesifik per kader.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left pane: Kader roster list */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          
          {/* Search wrapper */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama kader, email, posyandu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#369AF0] transition-colors"
              />
            </div>
          </div>

          {/* Roster list */}
          <div className="divide-y divide-slate-150 max-h-[500px] overflow-y-auto">
            {filteredKaders.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-slate-400 font-bold">Kader tidak ditemukan.</p>
              </div>
            ) : (
              filteredKaders.map((kader) => {
                const isSelected = selectedKader?.email === kader.email;
                return (
                  <div
                    key={kader.id}
                    onClick={() => setSelectedKader(kader)}
                    className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? "bg-[#FFD7E1]/45 text-[#369AF0]" : "hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black tracking-tight ${isSelected ? "text-[#369AF0]" : "text-slate-800"}`}>
                          {kader.nama}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-extrabold uppercase ${
                          kader.role === "Bidan" ? "bg-purple-100 text-purple-700" : "bg-[#FFD7E1] text-[#369AF0]"
                        }`}>
                          {kader.role}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span>{kader.posyandu}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" title="Aktif" />
                      <ChevronRight className={`h-4 w-4 ${isSelected ? "text-[#369AF0]" : "text-slate-400"}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right pane: Selected Kader details and examinations */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 space-y-6">
          {selectedKader ? (
            <>
              {/* Profile Card */}
              <div className="pb-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#369AF0] tracking-wider block">Profil Petugas Lapangan</span>
                    <h3 className="text-lg font-black text-slate-950 mt-1">{selectedKader.nama}</h3>
                    <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3" />
                      <span>{selectedKader.email}</span>
                    </p>
                  </div>
                  
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFD7E1]/30 border border-[#FFD7E1]/65 rounded-lg text-[10px] font-bold text-[#369AF0]">
                    <MapPin className="h-3 w-3 text-[#369AF0]" />
                    <span>Penugasan: {selectedKader.posyandu}</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-center self-start sm:self-auto min-w-[100px]">
                  <span className="text-2xl font-black text-slate-900 tracking-tight block">
                    {checkedChildren.length}
                  </span>
                  <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block mt-0.5">
                    Total Input
                  </span>
                </div>
              </div>

              {/* Records List inputted by this Kader */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clipboard className="h-4 w-4 text-[#369AF0]" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Riwayat Pemeriksaan yang Diinput
                  </span>
                </div>

                {checkedChildren.length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center">
                    <p className="text-xs text-slate-400 font-bold">Kader ini belum menginput pemeriksaan balita di puskesmas ini.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-slate-50/30">
                    {checkedChildren.map((child) => {
                      const hLower = (child.heightStatus || "").toLowerCase();
                      const wLower = (child.weightStatus || "").toLowerCase();
                      const isCritical = hLower.includes("pendek") || hLower.includes("stunted") || wLower.includes("kurang") || wLower.includes("buruk") || wLower.includes("wasted");

                      return (
                        <div
                          key={child.id}
                          className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                        >
                          <div className="space-y-1">
                            <h4 className="text-xs font-black text-slate-800">{child.nama}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold flex-wrap">
                              <span>{child.gender === "L" ? "Laki-laki" : "Perempuan"}</span>
                              <span>•</span>
                              <span>{child.usia} Bulan</span>
                              <span>•</span>
                              <span>Posyandu: {child.posyanduName || child.posyandu}</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 pt-1">
                              <span className={`inline-flex px-1.5 py-0.5 rounded-md text-[8px] font-extrabold tracking-tight border ${
                                isCritical 
                                  ? "bg-rose-50 text-rose-600 border-rose-100" 
                                  : "bg-emerald-50 text-emerald-600 border-emerald-100"
                              }`}>
                                {child.weightStatus}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-400 block">Tgl Periksa</span>
                              <span className="text-[11px] font-black text-slate-700 block">{child.tanggal}</span>
                            </div>
                            <button
                              onClick={() => setSelectedBalita(child)}
                              className="px-2.5 py-1.5 text-[10px] font-bold text-[#369AF0] bg-[#FFD7E1]/50 border border-[#FFD7E1] hover:bg-[#FFD7E1] rounded-lg transition-all cursor-pointer"
                            >
                              Detail
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <Users className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400 font-bold mt-2">Silakan pilih kader dari daftar di sebelah kiri.</p>
            </div>
          )}
        </div>

      </div>

      {/* Detail Modal Component */}
      {selectedBalita && (
        <DetailBalitaModal 
          record={selectedBalita}
          isOpen={!!selectedBalita}
          onClose={() => setSelectedBalita(null)}
        />
      )}

    </div>
  );
}
