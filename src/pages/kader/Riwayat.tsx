import React, { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Check, FileText, AlertTriangle, Filter } from "lucide-react";
import { useAuth, isDummyAccount } from "../../config/AuthContext";
import { jsPDF } from "jspdf";
import { auth } from "../../config/firebase";
import { getRecords, RecordItem } from "../../services/db";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function Riwayat() {
  const navigate = useNavigate();
  const { user, isDemo, mockUser, puskesmasName, posyanduName } = useAuth();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<"Semua" | "Gizi Baik" | "Gizi Kurang" | "Stunted">("Semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const email = (isDemo ? mockUser : user?.email) || "";
  const isDummy = isDummyAccount(email);
  const displayPuskesmas = useMemo(
    () => puskesmasName || (isDummy ? "Puskesmas Pauh - Padang" : "Puskesmas Wilayah"),
    [puskesmasName, isDummy]
  );
  const displayPosyandu = useMemo(
    () => posyanduName || (isDummy ? "Mawar - Kel. Limau Manis" : "Posyandu Bina Gizi"),
    [posyanduName, isDummy]
  );

  useEffect(() => {
    let active = true;
    setLoading(true);

    const fetchData = async () => {
      try {
        const handleUpdate = (latestData: RecordItem[]) => {
          if (!active) return;
          const filteredByPosyandu = latestData.filter(record => 
            record.posyanduName === displayPosyandu || record.posyandu === displayPosyandu
          );
          setRecords(filteredByPosyandu);
          setLoading(false);
        };

        const data = await getRecords(isDemo, email, displayPuskesmas, handleUpdate);
        if (!active) return;
        
        // Filter locally by posyanduName
        const filteredByPosyandu = data.filter(record => 
          record.posyanduName === displayPosyandu || record.posyandu === displayPosyandu
        );

        setRecords(filteredByPosyandu);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching history from Firestore via getRecords:", error);
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [isDemo, email, displayPuskesmas, displayPosyandu]);

  const filteredRecords = records.filter(record => {
    const matchSearch = record.nama.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeFilter === "Semua") return matchSearch;
    if (activeFilter === "Gizi Baik") {
      return matchSearch && (record.weightStatus || "").toLowerCase().includes("baik");
    }
    if (activeFilter === "Gizi Kurang") {
      const w = (record.weightStatus || "").toLowerCase();
      return matchSearch && (w.includes("kurang") || w.includes("buruk") || w.includes("wasted"));
    }
    if (activeFilter === "Stunted") {
      const h = (record.heightStatus || "").toLowerCase();
      return matchSearch && (h.includes("pendek") || h.includes("stunted"));
    }
    return matchSearch;
  });

  const stats = useMemo(() => {
    const total = records.length;
    let baik = 0;
    let kurang = 0;
    let giziL = 0;

    records.forEach(r => {
      const isKurang = (r.weightStatus || "").toLowerCase().includes("kurang") || (r.heightStatus || "").toLowerCase().includes("pendek") || (r.heightStatus || "").toLowerCase().includes("stunted");
      if (isKurang) {
        kurang++;
      } else {
        baik++;
      }
      if (r.weightStatus === "Gizi Lebih") {
        giziL++;
      }
    });

    return {
      total,
      baik,
      giziL,
      kurang,
      normal: baik - giziL,
      zscore: total > 0 ? "0.00 (Stabil)" : "0.00",
      status: total > 0 ? "Kondisi Stabil" : "Belum Ada Data"
    };
  }, [records]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm font-medium text-slate-500">Memuat riwayat pemeriksaan...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-6 pt-6 pb-2 text-slate-800 flex items-center space-x-3">
        <button
          onClick={() => navigate("/kader")}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-500 shadow-xs hover:scale-105 active:scale-95 transition-all border border-slate-100"
        >
          <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
        </button>
        <div className="leading-tight">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Riwayat Data</h2>
          <p className="text-[11px] text-blue-500 font-bold uppercase tracking-wider">Rekapitulasi Gizi Balita</p>
        </div>
      </div>

      <div className="bg-white rounded-t-[36px] flex-1 p-6 space-y-5 shadow-xs pb-14 mt-4">
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {(["Semua", "Gizi Baik", "Gizi Kurang", "Stunted"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-xs font-black transition-all whitespace-nowrap ${
                activeFilter === filter
                  ? "bg-blue-500 text-white shadow-xs"
                  : "bg-slate-50 text-slate-400 hover:bg-slate-100/80"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl space-y-3">
          <div className="flex justify-between items-baseline">
            <div className="text-center w-1/5">
              <span className="text-2xl font-black text-blue-500">{stats.total}</span>
              <span className="text-[9px] font-bold text-slate-400 block uppercase">Total</span>
            </div>
            <div className="text-center w-1/5">
              <span className="text-xs font-extrabold text-slate-500 block">{stats.baik}</span>
              <span className="text-[8px] font-bold text-slate-400 block uppercase">Baik</span>
            </div>
            <div className="text-center w-1/5">
              <span className="text-xs font-extrabold text-slate-500 block">{stats.giziL}</span>
              <span className="text-[8px] font-bold text-blue-500 block uppercase">Gizi L.</span>
            </div>
            <div className="text-center w-1/5">
              <span className="text-xs font-extrabold text-slate-500 block">{stats.kurang}</span>
              <span className="text-[8px] font-bold text-pink-500 block uppercase">Kurang</span>
            </div>
            <div className="text-center w-1/5">
              <span className="text-xs font-extrabold text-blue-500 block">{stats.normal}</span>
              <span className="text-[8px] font-bold text-slate-400 block uppercase">Normal</span>
            </div>
          </div>
          <div className="h-px bg-slate-200/60" />
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold px-2">
            <span>Rerata Z-Score: {stats.zscore}</span>
            <span className="text-emerald-500 font-black">{stats.status}</span>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Cari nama balita..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-4 pr-10 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
          />
          <Search className="h-4 w-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
        </div>

        <div className="space-y-4">
          {filteredRecords.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-3 bg-blue-500 rounded-full" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Daftar Rekonsiliasi</span>
            </div>
          )}

          <div className="space-y-3">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-3xl bg-slate-50 space-y-1.5">
                <p className="text-xs font-extrabold text-slate-500">Tidak ada data ditemukan</p>
                <p className="text-[10px] text-slate-400">Silakan gunakan kriteria pencarian atau pilih kategori lain.</p>
              </div>
            ) : (
              filteredRecords.map((item) => {
                const wLower = (item.weightStatus || "").toLowerCase();
                const hLower = (item.heightStatus || "").toLowerCase();
                const isWarning = wLower.includes("kurang") || wLower.includes("buruk") || hLower.includes("pendek") || hLower.includes("stunted");
                return (
                  <div
                    key={item.id}
                    className="p-4 bg-white border border-slate-100 rounded-3xl shadow-xs space-y-3.5 hover:border-blue-500/35 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black text-blue-500 tracking-wider uppercase block">{item.tanggal}</span>
                        <h4 className="text-sm font-black text-slate-800 leading-tight">{item.nama}</h4>
                        <p className="text-[10px] text-slate-500 font-medium font-sans">
                          {item.gender === "L" ? "Laki-laki" : "Perempuan"} • {item.usia} Bulan
                        </p>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wider uppercase ${
                        isWarning ? "bg-pink-50 text-pink-600 border border-pink-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      }`}>
                        {item.weightStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-600 pt-2 border-t border-slate-50">
                      <div className="bg-slate-50/70 p-2 rounded-xl">
                        <span className="text-[8px] text-slate-400 block font-bold uppercase">Berat (BB)</span>
                        <span className="font-mono font-bold text-slate-800 mt-0.5 block">{item.berat} kg</span>
                      </div>
                      <div className="bg-slate-50/70 p-2 rounded-xl">
                        <span className="text-[8px] text-slate-400 block font-bold uppercase">Tinggi (TB)</span>
                        <span className="font-mono font-bold text-slate-800 mt-0.5 block">{item.tinggi} cm</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                try {
                  if (records.length === 0) {
                    alert("Tidak ada rekam medis untuk diunduh.");
                    return;
                  }

                  const doc = new jsPDF({
                    orientation: "landscape",
                    unit: "mm",
                    format: "a4"
                  });

                  const primaryColor = [30, 41, 59];   
                  const textColor = [51, 65, 85];
                  const lightBg = [248, 250, 252];
                  const borderColor = [226, 232, 240];

                  doc.setFont("Helvetica", "bold");
                  doc.setFontSize(14);
                  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                  doc.text("LAPORAN REKAPITULASI PEMANTAUAN TUMBUH KEMBANG BALITA", 20, 20);

                  doc.setFont("Helvetica", "normal");
                  doc.setFontSize(9);
                  doc.setTextColor(115, 125, 140);
                  doc.text(`Posyandu: ${displayPosyandu} - Wilayah Puskesmas: ${displayPuskesmas}`, 20, 25);
                  doc.text(`Total Data: ${records.length} Balita | Tanggal Cetak: ${new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}`, 20, 30);

                  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
                  doc.setLineWidth(0.5);
                  doc.line(20, 34, 277, 34);

                  let currentY = 42;
                  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                  doc.rect(20, currentY, 257, 8, "F");

                  doc.setFont("Helvetica", "bold");
                  doc.setFontSize(8.5);
                  doc.setTextColor(255, 255, 255);
                  doc.text("No", 23, currentY + 5.5);
                  doc.text("Nama Balita", 32, currentY + 5.5);
                  doc.text("JK", 85, currentY + 5.5);
                  doc.text("Usia (Bln)", 95, currentY + 5.5);
                  doc.text("Berat (kg)", 117, currentY + 5.5);
                  doc.text("Tinggi (cm)", 137, currentY + 5.5);
                  doc.text("Status Berat Badan (BB/U)", 160, currentY + 5.5);
                  doc.text("Status Tinggi Badan (TB/U)", 210, currentY + 5.5);
                  doc.text("Tanggal Periksa", 250, currentY + 5.5);

                  doc.setFont("Helvetica", "normal");
                  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

                  records.forEach((record, index) => {
                    const rowY = currentY + 8 + (index * 8);
                    
                    if (rowY > 185) {
                      doc.addPage();
                      
                      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                      doc.rect(20, 20, 257, 8, "F");

                      doc.setFont("Helvetica", "bold");
                      doc.setFontSize(8.5);
                      doc.setTextColor(255, 255, 255);
                      doc.text("No", 23, 25.5);
                      doc.text("Nama Balita", 32, 25.5);
                      doc.text("JK", 85, 25.5);
                      doc.text("Usia (Bln)", 95, 25.5);
                      doc.text("Berat (kg)", 117, 25.5);
                      doc.text("Tinggi (cm)", 137, 25.5);
                      doc.text("Status Berat Badan (BB/U)", 160, 25.5);
                      doc.text("Status Tinggi Badan (TB/U)", 210, 25.5);
                      doc.text("Tanggal Periksa", 250, 25.5);

                      currentY = 20 - 8; 
                    }

                    const actualRowY = currentY + 8 + (index * 8);

                    if (index % 2 === 1) {
                      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
                    } else {
                      doc.setFillColor(255, 255, 255);
                    }
                    
                    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
                    doc.rect(20, actualRowY, 257, 8, "DF");

                    doc.setFont("Helvetica", "normal");
                    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
                    doc.text(String(index + 1), 23, actualRowY + 5.5);
                    
                    doc.setFont("Helvetica", "bold");
                    doc.text(record.nama, 32, actualRowY + 5.5);
                    
                    doc.setFont("Helvetica", "normal");
                    const jkLabel = record.gender === "L" ? "L" : "P";
                    doc.text(jkLabel, 85, actualRowY + 5.5);
                    doc.text(`${record.usia} Bln`, 95, actualRowY + 5.5);
                    doc.text(`${record.berat} kg`, 117, actualRowY + 5.5);
                    doc.text(`${record.tinggi} cm`, 137, actualRowY + 5.5);

                    const weightLower = (record.weightStatus || "").toLowerCase();
                    if (weightLower.includes("kurang") || weightLower.includes("buruk") || weightLower.includes("wasted")) {
                      doc.setFont("Helvetica", "bold");
                      doc.setTextColor(225, 29, 72);
                    } else {
                      doc.setFont("Helvetica", "bold");
                      doc.setTextColor(16, 185, 129);
                    }
                    doc.text(record.weightStatus || "-", 160, actualRowY + 5.5);

                    const heightLower = (record.heightStatus || "").toLowerCase();
                    if (heightLower.includes("pendek") || heightLower.includes("stunted") || heightLower.includes("sangat pendek")) {
                      doc.setFont("Helvetica", "bold");
                      doc.setTextColor(245, 158, 11);
                    } else {
                      doc.setFont("Helvetica", "bold");
                      doc.setTextColor(16, 185, 129);
                    }
                    doc.text(record.heightStatus || "-", 210, actualRowY + 5.5);

                    doc.setFont("Helvetica", "normal");
                    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
                    doc.text(record.tanggal, 250, actualRowY + 5.5);
                  });

                  doc.save(`Rekap_KMS_Balita_Posyandu_${new Date().toISOString().slice(0, 10)}.pdf`);
                } catch (pdfErr) {
                  console.error("PDF download aborted", pdfErr);
                  alert("Gagal mengunduh rekap PDF.");
                }
              }}
              className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xs transition-colors text-center"
            >
              Unduh Rekap Laporan PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
