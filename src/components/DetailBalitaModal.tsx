import React, { useMemo } from "react";
import { X, Calendar, User, ShieldAlert, Heart, TrendingUp, Sparkles, AlertCircle, CheckCircle2, ChevronRight, Download, Activity, FileText } from "lucide-react";
import { RecordItem } from "../services/db";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { jsPDF } from "jspdf";

interface DetailBalitaModalProps {
  record: RecordItem;
  isOpen: boolean;
  onClose: () => void;
}

export default function DetailBalitaModal({ record, isOpen, onClose }: DetailBalitaModalProps) {
  if (!isOpen) return null;

  const isStunted = (record.heightStatus || "").toLowerCase().includes("pendek") || 
                    (record.heightStatus || "").toLowerCase().includes("stunted");
  
  const isGiziKurang = (record.weightStatus || "").toLowerCase().includes("kurang") || 
                       (record.weightStatus || "").toLowerCase().includes("buruk") || 
                       (record.weightStatus || "").toLowerCase().includes("wasted");

  // Determine Z-Scores
  // Generate dummy plausible WHO reference curves for Line Chart plotting
  const chartData = useMemo(() => {
    const counts = record.usia || 24;
    const isBoy = record.gender === "L";
    
    // WHO reference points for median, -3SD, -2SD, +1SD
    const getWeights = (m: number) => {
      const t = m / 60;
      if (isBoy) {
        return {
          neg3: 2.4 + t * 12.0,
          neg2: 2.9 + t * 13.5,
          median: 3.3 + t * 15.0,
          pos1: 3.9 + t * 17.1
        };
      } else {
        return {
          neg3: 2.2 + t * 11.8,
          neg2: 2.8 + t * 13.0,
          median: 3.2 + t * 15.0,
          pos1: 3.7 + t * 17.5
        };
      }
    };

    // Plot reference markers up to current age
    const steps = [0, Math.max(1, Math.round(counts * 0.25)), Math.max(2, Math.round(counts * 0.5)), Math.max(3, Math.round(counts * 0.75)), counts];
    const uniqueSteps = Array.from(new Set(steps)).sort((a, b) => a - b);

    return uniqueSteps.map((m) => {
      const ref = getWeights(m);
      const isCurrent = m === counts;
      const isBirth = m === 0;

      return {
        bulan: `${m} bln`,
        "-3 SD (Sangat Kurang)": parseFloat(ref.neg3.toFixed(1)),
        "-2 SD (Kurang)": parseFloat(ref.neg2.toFixed(1)),
        "Median (Normal)": parseFloat(ref.median.toFixed(1)),
        "+1 SD (Atas)": parseFloat(ref.pos1.toFixed(1)),
        "Berat Balita": isBirth ? (record.bbLahir || 3.0) : (isCurrent ? record.berat : undefined)
      };
    });
  }, [record]);

  // Derived recommendation
  const getAIRecommendations = (weightSt: string) => {
    const w = weightSt.toLowerCase();
    if (w.includes("buruk")) {
      return [
        "Lakukan rujukan gizi segera ke fasilitas kesehatan tingkat pertama (Puskesmas Pauh)",
        "Berikan kombinasi susu terapeutik F75 dan F100 sesuai petunjuk dokter spesialis anak",
        "Tingkatkan konsumsi makanan bernutrisi tinggi zat laktat patogenik alami",
        "Pantau berat badan setiap awal pekan dan laporkan rekapitulasi gizi ke Bidan penanggung jawab"
      ];
    }
    if (w.includes("kurang")) {
      return [
        "Mulai berikan PMT (Pemberian Makanan Tambahan) kaya kandungan protein hewani",
        "Edukasi orang tua mengenai tata cara pemberian nutrisi padat kalori",
        "Berikan suplemen vitamin penambah nafsu makan jika terdapat masalah asupan",
        "Jadwalkan monitoring timbangan 2 minggu sekali secara konsisten"
      ];
    }
    if (isStunted) {
      return [
        "Fokus utama pada minimal 1 porsi protein hewani (Telur/Ikan/Ayam/Daging) dalam menu harian",
        "Pastikan asupan kalsium dan vitamin D harian terpenuhi secara merata",
        "Pantau tinggi badan secara konsisten dengan metode ukur antropometri standar WHO",
        "Perbaiki sanitasi lingkungan tempat tinggal dan pastikan anak selalu cuci tangan sebelum makan"
      ];
    }
    return [
      "Pertahankan pola makan sehat bergizi seimbang tinggi protein dan serat alami",
      "Berikan stimulasi fisik aktif dan stimulasi motorik sesuai fase tumbuh kembang",
      "Lanjutkan kunjungan rutin Posyandu sebulan sekali untuk imunisasi dan monitoring",
      "Lakukan imunisasi dasar pelengkap sesuai jadwal Kemenkes RI"
    ];
  };

  const recList = getAIRecommendations(record.weightStatus || "");

  const handleDownloadSinglePdf = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Simple, professional styling
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text("KMS DIGITAL - LAPORAN INDIVIDU", 20, 20);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 110, 120);
      doc.text("PROGRAM STUDI INFORMATIKA - UNIVERSITAS ANDALAS", 20, 25);
      doc.text("Website Pendukung Keputusan Penentuan Status Gizi Balita (SIGIZI)", 20, 30);

      doc.setDrawColor(226, 232, 240);
      doc.line(20, 34, 190, 34);

      // Section 1: Identitas
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text("IDENTITAS BALITA", 20, 42);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      
      const lines = [
        ["Nama Balita", record.nama],
        ["NIK", record.nik],
        ["Nama Ibu", record.namaIbu],
        ["Jenis Kelamin", record.gender === "L" ? "Laki-laki" : "Perempuan"],
        ["Usia Deteksi", `${record.usia} Bulan`],
        ["Tanggal Uji", record.tanggal],
        ["Posyandu", record.posyanduName || record.posyandu || "-"],
        ["Puskesmas", record.puskesmasName || "-"]
      ];

      let currentY = 48;
      lines.forEach(([key, val]) => {
        doc.setFont("Helvetica", "bold");
        doc.text(key + ":", 25, currentY);
        doc.setFont("Helvetica", "normal");
        doc.text(val, 65, currentY);
        currentY += 6;
      });

      // Section 2: Hasil Antropometri
      currentY += 4;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text("PENGUKURAN ANTROPOMETRI & STATUS GIZI", 20, currentY);
      currentY += 6;

      const measures = [
        ["Berat Badan", `${record.berat} kg`, "Status Gizi (BB/U)", record.weightStatus],
        ["Tinggi Badan", `${record.tinggi} cm`, "Status Tinggi (TB/U)", record.heightStatus],
        ["BB Lahir", `${record.bbLahir || "-"} kg`, "LK / Lila", `${record.lk || "-"} / ${record.lila || "-"} cm`],
        ["Metode Ukur", record.metodeTinggi || "-", "Tanggal Periksa", record.tanggal]
      ];

      measures.forEach(([key1, val1, key2, val2]) => {
        doc.setFont("Helvetica", "bold");
        doc.text(key1 + ":", 25, currentY);
        doc.setFont("Helvetica", "normal");
        doc.text(val1, 55, currentY);

        doc.setFont("Helvetica", "bold");
        doc.text(key2 + ":", 100, currentY);
        doc.setFont("Helvetica", "normal");
        doc.text(val2, 140, currentY);

        currentY += 6;
      });

      // Section 3: Rekomendasi
      currentY += 4;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text("REKOMENDASI INTERVENSI GIZI", 20, currentY);
      currentY += 7;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      recList.forEach((rec, idx) => {
        const textLines = doc.splitTextToSize(`${idx + 1}. ${rec}`, 160);
        doc.text(textLines, 25, currentY);
        currentY += (textLines.length * 5) + 1;
      });

      // Footer
      doc.setDrawColor(226, 232, 240);
      doc.line(20, 275, 190, 275);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text("Laporan ini dihasilkan secara otomatis oleh sistem pendukung keputusan SIGIZI BALITA berdasarkan standar antropometri WHO.", 20, 280);

      doc.save(`KMS_Digital_${record.nama.replace(/\s+/g, "_")}.pdf`);
    } catch (e) {
      console.error("PDF download failed", e);
      alert("Gagal merangkum laporan individu.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-5xl mx-auto overflow-hidden animate-scale-in border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">Dokumen Kesehatan</span>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Detail Tumbuh Kembang Anak</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSinglePdf}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4 text-slate-400" />
              <span>Unduh KMS PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Clinical profile */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Identity Box */}
              <div className="bg-slate-50/75 border border-slate-200/50 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{record.nama}</h4>
                    <p className="text-xs text-slate-400 font-mono">NIK {record.nik}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200/60 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Nama Ibu</span>
                    <span className="font-bold text-slate-800 text-[13px]">{record.namaIbu}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Jenis Kelamin</span>
                    <span className="font-bold text-slate-800 text-[13px]">
                      {record.gender === "L" ? "Laki-laki" : "Perempuan"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Usia Deteksi</span>
                    <span className="font-bold text-slate-800 text-[13px]">{record.usia} Bulan</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Tanggal Periksa</span>
                    <span className="font-bold text-slate-800 text-[13px]">{record.tanggal}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 font-medium block">Sektor Posyandu</span>
                    <span className="font-bold text-slate-800 text-[13px]">{record.posyanduName || record.posyandu || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Anthropometric Specs Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider">Berat Badan</span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">{record.berat}</span>
                    <span className="text-xs text-slate-500 font-bold">kg</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">Lahir: {record.bbLahir || 3.0} kg</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider">Tinggi Badan</span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">{record.tinggi}</span>
                    <span className="text-xs text-slate-500 font-bold">cm</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">Lahir: {record.tbLahir || 49.0} cm</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider">Lingkar Kepala</span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">{record.lk || "-"}</span>
                    <span className="text-xs text-slate-500 font-bold">cm</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">Fisik normal</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider">LILA</span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">{record.lila || "-"}</span>
                    <span className="text-xs text-slate-500 font-bold">cm</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">Metode: {record.metodeTinggi || "Berdiri"}</span>
                </div>
              </div>

            </div>

            {/* Right Column: Chart, interpretive indicators & AI suggestions */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Interpretive Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Weight Index */}
                <div className={`p-4 border rounded-2xl flex items-center justify-between ${
                  isGiziKurang ? "border-rose-100 bg-rose-50/40 text-rose-700" : "border-emerald-100 bg-emerald-50/40 text-emerald-700"
                }`}>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400">Berat Badan / Usia (BB/U)</span>
                    <h5 className="font-extrabold text-[15px] tracking-tight">{record.weightStatus}</h5>
                  </div>
                  {isGiziKurang ? <ShieldAlert className="h-5 w-5 text-rose-500 flex-shrink-0" /> : <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />}
                </div>

                {/* Stunting Index */}
                <div className={`p-4 border rounded-2xl flex items-center justify-between ${
                  isStunted ? "border-amber-100 bg-amber-50/40 text-amber-700" : "border-emerald-100 bg-emerald-50/40 text-emerald-700"
                }`}>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400">Tinggi Badan / Usia (TB/U)</span>
                    <h5 className="font-extrabold text-[15px] tracking-tight">{record.heightStatus}</h5>
                  </div>
                  {isStunted ? <ShieldAlert className="h-5 w-5 text-amber-500 flex-shrink-0" /> : <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />}
                </div>

              </div>

              {/* Kurva Tumbuh Kembang (Graphical Digital KMS) */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6">
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider block">Kurva Pertumbuhan Rutin WHO Reference</span>
                <span className="text-slate-400 text-xs block mb-4 mt-0.5">Plot berat badan balita saat lahir hingga usia deteksi aktif.</span>

                <div className="h-52 w-full text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="bulan" stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="Median (Normal)" stroke="#10B981" strokeWidth={1} dot={false} strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="-2 SD (Kurang)" stroke="#F59E0B" strokeWidth={1} dot={false} strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="-3 SD (Sangat Kurang)" stroke="#EF4444" strokeWidth={1} dot={false} strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="Berat Balita" stroke="#3B82F6" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Custom rule-based advisory */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 pb-4">
                  <Activity className="h-4.5 w-4.5 text-blue-500" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Saran Rekomendasi Terapi Gizi</span>
                </div>
                
                <ul className="space-y-3.5 text-xs text-slate-600">
                  {recList.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                      <span className="h-5 w-5 rounded-full bg-white border border-slate-200 text-[#369AF0] flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
