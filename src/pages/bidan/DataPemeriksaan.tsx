import React, { useState, useMemo, useEffect } from "react";
import { useAuth, isDummyAccount } from "../../config/AuthContext";
import { Search, FileText, ChevronRight, Filter, AlertCircle, CheckCircle2, Info, FolderOpen, Eye } from "lucide-react";
import { jsPDF } from "jspdf";
import { auth } from "../../config/firebase";
import { getRecords, RecordItem } from "../../services/db";
import DetailBalitaModal from "../../components/DetailBalitaModal";

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
    timestamp: 1781516000000
  },
  {
    id: "baseline-6",
    nama: "Aisyah Putri",
    nik: "1371021102220006",
    namaIbu: "Ibu Ratna",
    gender: "P",
    usia: 28,
    berat: 11.2,
    tinggi: 87.5,
    bbLahir: 3.0,
    tbLahir: 48.5,
    lk: 47.0,
    lila: 14.1,
    metodeTinggi: "Berdiri",
    weightStatus: "Gizi Baik",
    heightStatus: "Normal",
    tanggal: "12 Jun 2026",
    posyanduName: "Mawar - Kel. Limau Manis",
    puskesmasName: "Puskesmas Pauh - Padang",
    timestamp: 1781515000000
  }
];

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

export default function DataPemeriksaan() {
  const { user, isDemo, mockUser, puskesmasName } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("Semua");
  const [listData, setListData] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBalita, setSelectedBalita] = useState<RecordItem | null>(null);

  const userEmail = (isDemo ? mockUser : user?.email) || "";
  const isDummy = isDummyAccount(userEmail);
  const locationName = useMemo(
    () => puskesmasName || (isDummy ? "Puskesmas Pauh - Padang" : "Puskesmas Wilayah"),
    [puskesmasName, isDummy]
  );

  useEffect(() => {
    let active = true;
    setLoading(true);

    const fetchData = async () => {
      try {
        const handleUpdate = (latestData: RecordItem[]) => {
          if (active) {
            setListData(latestData);
            setLoading(false);
          }
        };

        const recordsRaw = await getRecords(isDemo, userEmail, locationName, handleUpdate);
        if (!active) return;
        setListData(recordsRaw);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data from Firestore via getRecords:", error);
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [isDemo, userEmail, locationName]);

  const records = useMemo(() => {
    const ids = new Set(listData.map(r => r.nik));
    const filteredBaseline = BASELINE_RECORDS.filter(r => !ids.has(r.nik));
    return [...listData, ...filteredBaseline].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [listData]);

  const filteredData = useMemo(() => {
    return records.filter((item) => {
      const matchSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterStatus === "Semua") return matchSearch;
      if (filterStatus === "Gizi Baik") {
        return matchSearch && (item.weightStatus || "").toLowerCase().includes("baik");
      }
      if (filterStatus === "Gizi Kurang/Buruk") {
        const w = (item.weightStatus || "").toLowerCase();
        return matchSearch && (w.includes("kurang") || w.includes("buruk") || w.includes("wasted"));
      }
      if (filterStatus === "Stunted") {
        return matchSearch && ((item.heightStatus || "").toLowerCase().includes("pendek") || (item.heightStatus || "").toLowerCase().includes("stunted"));
      }
      return matchSearch;
    });
  }, [records, searchTerm, filterStatus]);

  const handleExportPDF = () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data untuk diekspor ke PDF saat ini.");
      return;
    }

    try {
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
      doc.text("LAPORAN REKAPITULASI PEMERIKSAAN BALITA", 20, 20);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 110, 120);
      doc.text(`Wilayah Kerja: ${locationName}`, 20, 25);
      doc.text(`Total Baris Diunduh: ${filteredData.length} | Tanggal Cetak: ${new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}`, 20, 30);

      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.5);
      doc.line(20, 34, 277, 34);

      let currentY = 40;
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(20, currentY, 257, 8, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text("No", 23, currentY + 5.5);
      doc.text("Nama Balita", 32, currentY + 5.5);
      doc.text("Gender", 80, currentY + 5.5);
      doc.text("Usia", 105, currentY + 5.5);
      doc.text("Berat", 118, currentY + 5.5);
      doc.text("Tinggi", 130, currentY + 5.5);
      doc.text("Posyandu", 143, currentY + 5.5);
      doc.text("Status Berat", 185, currentY + 5.5);
      doc.text("Status Tinggi", 225, currentY + 5.5);
      doc.text("Tanggal", 258, currentY + 5.5);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      filteredData.forEach((record, index) => {
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
          doc.text("Gender", 80, 25.5);
          doc.text("Usia", 105, 25.5);
          doc.text("Berat", 118, 25.5);
          doc.text("Tinggi", 130, 25.5);
          doc.text("Posyandu", 143, 25.5);
          doc.text("Status Berat", 185, 25.5);
          doc.text("Status Tinggi", 225, 25.5);
          doc.text("Tanggal", 258, 25.5);

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
        doc.text(record.gender === "L" ? "Laki-laki" : "Perempuan", 80, actualRowY + 5.5);
        doc.text(`${record.usia} Bln`, 105, actualRowY + 5.5);
        doc.text(`${record.berat} kg`, 118, actualRowY + 5.5);
        doc.text(`${record.tinggi} cm`, 130, actualRowY + 5.5);
        doc.text(record.posyanduName || record.posyandu || "-", 143, actualRowY + 5.5);

        const wStatus = record.weightStatus || "-";
        const hStatus = record.heightStatus || "-";

        if (wStatus.toLowerCase().includes("kurang") || wStatus.toLowerCase().includes("buruk")) {
          doc.setTextColor(220, 38, 38);
        } else {
          doc.setTextColor(16, 185, 129);
        }
        doc.text(wStatus, 185, actualRowY + 5.5);

        if (hStatus.toLowerCase().includes("pendek") || hStatus.toLowerCase().includes("stunted")) {
          doc.setTextColor(217, 119, 6);
        } else {
          doc.setTextColor(16, 185, 129);
        }
        doc.text(hStatus, 225, actualRowY + 5.5);

        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(record.tanggal, 258, actualRowY + 5.5);
      });

      doc.save(`Rekapitulasi_Pemeriksaan_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Terjadi kegagalan saat menyusun berkas laporan PDF.");
    }
  };

  const getStatusBadge = (weight: string, height: string) => {
    const wLower = (weight || "").toLowerCase();
    const hLower = (height || "").toLowerCase();

    const isStunted = hLower.includes("pendek") || hLower.includes("stunted");
    const isWasted = wLower.includes("kurang") || wLower.includes("buruk") || wLower.includes("wasted");

    if (isStunted || isWasted) {
      return (
        <span className="inline-flex flex-col gap-1">
          {isWasted && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
              <AlertCircle className="h-3 w-3" />
              <span>{weight}</span>
            </span>
          )}
          {isStunted && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
              <Info className="h-3 w-3" />
              <span>{height}</span>
            </span>
          )}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
        <CheckCircle2 className="h-3 w-3" />
        <span>Gizi & Tinggi Normal</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm font-medium text-slate-500">Memuat data pemeriksaan...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Daftar Hasil Pemeriksaan
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau rincian nilai antropometri balita dari seluruh kader Posyandu secara berkala.
          </p>
        </div>

        <div className="flex items-center">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#369AF0] hover:bg-[#369AF0]/90 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="h-4.5 w-4.5" />
            <span>Ekspor Laporan PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/85 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama balita..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              <span>Saring Kategori:</span>
            </div>
            {["Semua", "Gizi Baik", "Gizi Kurang/Buruk", "Stunted"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  filterStatus === status
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 border border-slate-200/50 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            {filteredData.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/50 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">No</th>
                    <th className="px-6 py-4">Nama Balita</th>
                    <th className="px-6 py-4 text-center">Gender</th>
                    <th className="px-6 py-4 text-center">Usia</th>
                    <th className="px-6 py-4 text-center">Berat (kg)</th>
                    <th className="px-6 py-4 text-center">Tinggi (cm)</th>
                    <th className="px-6 py-4">Asal Posyandu</th>
                    <th className="px-6 py-4">Analisis Status Z-Score</th>
                    <th className="px-6 py-4">Tanggal Periksa</th>
                    <th className="px-6 py-4 text-center">Aksi / KMS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-950">
                        {item.nama}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-slate-600">
                        {item.gender === "L" ? "Laki-laki" : "Perempuan"}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-slate-700">
                        {item.usia} bln
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800">
                        {item.berat}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800">
                        {item.tinggi}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">
                        {item.posyanduName || item.posyandu || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(item.weightStatus, item.heightStatus)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                        {item.tanggal}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedBalita(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#369AF0] bg-[#FFD7E1]/50 border border-[#FFD7E1] hover:bg-[#FFD7E1] rounded-xl transition-all cursor-pointer"
                          title="Lihat KMS / Detail"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Lihat KMS</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center p-16 text-center bg-slate-50/30">
                <div className="p-3 bg-white border border-slate-100 rounded-full shadow-xs mb-3 text-slate-400">
                  <FolderOpen className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Belum ada data pemeriksaan</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Seluruh pencatatan antropometri dari wilayah kerja yang disaring masih kosong atau tidak sesuai.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Clinician detail cards for the child measurements */}
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
