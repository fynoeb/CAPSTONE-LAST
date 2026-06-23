import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import { 
  ArrowLeft, 
  Check, 
  Activity, 
  Sparkles, 
  FileText, 
  ArrowLeftRight, 
  AlertCircle, 
  CheckCircle2,
  ListTodo,
  FileDown
} from "lucide-react";
import { PredictResponse } from "../../services/api";

interface LocationState {
  nama: string;
  gender: string;
  usiaBulan: number;
  berat: number;
  tinggi: number;
  response: PredictResponse;
}

export default function HasilAnalisis() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  // If no data state is found, offer clean redirection
  if (!state) {
    return (
      <div className="flex flex-col min-h-screen justify-center items-center p-6 bg-slate-50 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-[#369AF0]" />
        <h3 className="text-base font-black text-slate-800">Tidak ada data hasil analisis</h3>
        <p className="text-xs text-slate-500 max-w-xs">
          Silakan lengkapi form input data balita terlebih dahulu untuk melihat hasil analisis status gizi.
        </p>
        <button
          onClick={() => navigate("/kader/input")}
          className="px-6 py-3 bg-[#369AF0] text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all hover:bg-[#2c8edc] active:scale-95"
        >
          Ke Form Input
        </button>
      </div>
    );
  }

  const { nama, gender, usiaBulan, berat, tinggi, response } = state;
  const { perhitungan_who, rekomendasi_ai } = response;
  const kategori = rekomendasi_ai.kategori;

  // Determine visual color scheme depending on the gizi category
  let themeColor = "emerald"; // default Normal / Gizi Baik
  let bgBadge = "bg-emerald-100 text-emerald-700";
  let bgGradient = "from-emerald-50 to-emerald-100/35 border-emerald-100";
  let mainIcon = <CheckCircle2 className="h-10 w-10 text-emerald-600 stroke-[2]" />;
  
  if (kategori.toLowerCase().includes("kurang") || kategori.toLowerCase().includes("stunted") || kategori.toLowerCase().includes("pendek")) {
    themeColor = "amber";
    bgBadge = "bg-amber-100 text-amber-700";
    bgGradient = "from-amber-50 to-amber-100/35 border-amber-100";
    mainIcon = <AlertCircle className="h-10 w-10 text-amber-600 stroke-[2]" />;
  } else if (kategori.toLowerCase().includes("buruk") || kategori.toLowerCase().includes("wasted") || kategori.toLowerCase().includes("sangat") || kategori.toLowerCase().includes("severe")) {
    themeColor = "rose";
    bgBadge = "bg-rose-100 text-rose-700";
    bgGradient = "from-rose-50 to-rose-100/35 border-rose-100";
    mainIcon = <AlertCircle className="h-10 w-10 text-rose-600 stroke-[2]" />;
  }

  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const primaryColor = [30, 41, 59];   
      const secondaryColor = [54, 154, 240]; 
      const textColor = [51, 65, 85];      
      const lightBg = [248, 250, 252];     
      const borderColor = [226, 232, 240]; 

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("POSYANDU MAWAR - SISTEM KMS ELEKTRONIK", 20, 20);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(115, 125, 140);
      doc.text("Laporan Pemantauan Gizi & Antropometri Balita Berbasis AI", 20, 25);
      doc.text(`Dicetak pada: ${new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 20, 30);

      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.5);
      doc.line(20, 34, 190, 34);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("I. IDENTITAS BALITA", 20, 42);

      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.roundedRect(20, 46, 170, 38, 2, 2, "FD");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      const keyX = 25;
      const valX = 65;
      
      const genderLabel = gender === "P" || gender.toLowerCase().startsWith("p") ? "Perempuan" : "Laki-laki";

      doc.text("Nama Lengkap", keyX, 52);
      doc.setFont("Helvetica", "normal");
      doc.text(`: ${nama}`, valX, 52);

      doc.setFont("Helvetica", "bold");
      doc.text("Jenis Kelamin", keyX, 58);
      doc.setFont("Helvetica", "normal");
      doc.text(`: ${genderLabel}`, valX, 58);

      doc.setFont("Helvetica", "bold");
      doc.text("Usia", keyX, 64);
      doc.setFont("Helvetica", "normal");
      doc.text(`: ${usiaBulan} Bulan`, valX, 64);

      doc.setFont("Helvetica", "bold");
      doc.text("Berat Badan", keyX, 70);
      doc.setFont("Helvetica", "normal");
      doc.text(`: ${berat} kg`, valX, 70);

      doc.setFont("Helvetica", "bold");
      doc.text("Tinggi Badan", keyX, 76);
      doc.setFont("Helvetica", "normal");
      doc.text(`: ${tinggi} cm`, valX, 76);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("II. STATUS ANTROPOMETRI (STANDAR WHO)", 20, 92);

      let currentY = 96;
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(20, currentY, 170, 8, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text("Indikator Antropometri", 24, currentY + 5.5);
      doc.text("Nilai", 85, currentY + 5.5);
      doc.text("Status Menurut Standar WHO", 115, currentY + 5.5);

      currentY += 8;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.rect(20, currentY, 170, 10, "DF");
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text("Berat Badan menurut Usia (BB/U)", 24, currentY + 6.5);
      doc.setFont("Helvetica", "bold");
      doc.text(`${berat} kg`, 85, currentY + 6.5);
      doc.text(perhitungan_who.bb_per_u, 115, currentY + 6.5);

      currentY += 10;
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.rect(20, currentY, 170, 10, "DF");
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text("Tinggi Badan menurut Usia (TB/U)", 24, currentY + 6.5);
      doc.setFont("Helvetica", "bold");
      doc.text(`${tinggi} cm`, 85, currentY + 6.5);
      doc.text(perhitungan_who.tb_per_u, 115, currentY + 6.5);

      if (perhitungan_who.bb_per_tb) {
        currentY += 10;
        doc.setFillColor(255, 255, 255);
        doc.rect(20, currentY, 170, 10, "DF");
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text("Berat Badan menurut Tinggi (BB/TB)", 24, currentY + 6.5);
        doc.setFont("Helvetica", "bold");
        const imt = ((berat / (tinggi / 100) ** 2) || 0).toFixed(1);
        doc.text(`${imt} IMT`, 85, currentY + 6.5);
        doc.text(perhitungan_who.bb_per_tb, 115, currentY + 6.5);
      }

      currentY += 18;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("III. KATEGORI STATUS GIZI & REKOMENDASI TERARAH", 20, currentY);

      currentY += 4;
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.roundedRect(20, currentY, 170, 24, 2, 2, "FD");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(`Kategori Gizi: ${kategori}`, 25, currentY + 7);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      
      const splitPesan = doc.splitTextToSize(response.pesan || "", 160);
      doc.text(splitPesan, 25, currentY + 13);

      currentY += 30;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Rekomendasi Tindak Lanjut:", 20, currentY);

      currentY += 4;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      
      rekomendasi_ai.saran_tindak_lanjut.forEach((saran, i) => {
        const itemY = currentY + (i * 7);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text("-", 22, itemY);
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(saran, 27, itemY);
      });

      currentY = 240;
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.line(20, currentY, 190, currentY);

      currentY += 6;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Catatan: Dokumen ini diterbitkan secara otomatis dari sistem manajemen kesehatan Posyandu Mawar.", 20, currentY);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Petugas Posyandu / Kader Kesehatan,", 130, currentY + 5);

      doc.setFont("Helvetica", "normal");
      doc.text("Sistem Pemantauan KMS Digital", 130, currentY + 20);

      const sanitizedFilename = `Laporan_Gizi_${nama.replace(/[^a-zA-Z0-9]/g, "_")}_${usiaBulan}bln.pdf`;
      doc.save(sanitizedFilename);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Gagal mengunduh laporan PDF kelas antropometri.");
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Top Banner Header */}
      <div className="px-6 pt-6 pb-2 text-[#333333] flex items-center space-x-3">
        <button
          onClick={() => navigate("/kader/input")}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#369AF0] shadow-sm hover:scale-105 active:scale-95 transition-all"
        >
          <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
        </button>
        <div className="leading-tight">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Hasil Analisis</h2>
          <p className="text-[11px] text-[#369AF0] font-bold uppercase tracking-wider">Antropometri & AI</p>
        </div>
      </div>

      <div className="bg-white rounded-t-[36px] flex-1 p-6 space-y-6 shadow-xl pb-24 mt-2">
        {/* SECTION 1: TOP CARD - STATUS UTAMA */}
        <div className={`p-5 rounded-3xl border ${bgGradient} text-center space-y-4 shadow-sm`}>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Status Gizi Balita</p>
          
          <div className="flex justify-center">
            <div className="p-3 bg-white rounded-full shadow-sm">
              {mainIcon}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className={`text-2xl font-black ${
              themeColor === "rose" ? "text-rose-600" : themeColor === "amber" ? "text-amber-600" : "text-emerald-600"
            }`}>
              {kategori}
            </h3>
            <p className="text-xs text-slate-800 font-extrabold max-w-xs mx-auto">
              {nama} <span className="text-slate-400 font-semibold font-mono">({gender}, {usiaBulan} Bulan)</span>
            </p>
            <p className="text-[11px] text-slate-500 leading-normal max-w-xs mx-auto">
              {response.pesan}
            </p>
          </div>
        </div>

        {/* SECTION 2: MIDDLE CARD - DETAIL PERHITUNGAN WHO */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Activity className="h-4 w-4 text-slate-400" />
            <span>Detail Parameter Standar WHO</span>
          </h4>

          <div className="grid grid-cols-1 gap-2 text-xs">
            {/* Berat Badan Per Umur */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wide">Berat Badan / Usia</span>
                <span className="font-extrabold text-slate-800 text-xs mt-0.5">BB per U</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-slate-600 font-medium">{berat} kg</span>
                <span className={`px-2 py-0.5 font-bold text-[9px] rounded-md tracking-wider uppercase ${
                  perhitungan_who.bb_per_u.toLowerCase().includes("baik") || perhitungan_who.bb_per_u.toLowerCase().includes("normal")
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : perhitungan_who.bb_per_u.toLowerCase().includes("kurang") 
                    ? "bg-amber-50 text-amber-600 border border-amber-100"
                    : "bg-rose-50 text-rose-600 border border-rose-100"
                }`}>
                  {perhitungan_who.bb_per_u}
                </span>
              </div>
            </div>

            {/* Tinggi Badan Per Umur */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wide">Tinggi Badan / Usia</span>
                <span className="font-extrabold text-slate-800 text-xs mt-0.5">TB per U</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-slate-600 font-medium">{tinggi} cm</span>
                <span className={`px-2 py-0.5 font-bold text-[9px] rounded-md tracking-wider uppercase ${
                  perhitungan_who.tb_per_u.toLowerCase().includes("normal") || perhitungan_who.tb_per_u.toLowerCase().includes("tinggi")
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : perhitungan_who.tb_per_u.toLowerCase().includes("pendek") || perhitungan_who.tb_per_u.toLowerCase().includes("stunted")
                    ? "bg-amber-50 text-amber-600 border border-amber-100"
                    : "bg-rose-50 text-rose-600 border border-rose-100"
                }`}>
                  {perhitungan_who.tb_per_u}
                </span>
              </div>
            </div>

            {/* Berat Badan Per Tinggi Badan */}
            {perhitungan_who.bb_per_tb && (
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wide">Berat Badan / Tinggi Badan</span>
                  <span className="font-extrabold text-slate-800 text-xs mt-0.5">BB per TB</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-slate-600 font-medium">{((berat / (tinggi / 100) ** 2) || 0).toFixed(1)} IMT</span>
                  <span className={`px-2 py-0.5 font-bold text-[9px] rounded-md tracking-wider uppercase ${
                    perhitungan_who.bb_per_tb.toLowerCase().includes("normal") || perhitungan_who.bb_per_tb.toLowerCase().includes("baik")
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : perhitungan_who.bb_per_tb.toLowerCase().includes("kurang") || perhitungan_who.bb_per_tb.toLowerCase().includes("wasted")
                      ? "bg-amber-50 text-amber-600 border border-amber-100"
                      : "bg-rose-50 text-rose-600 border border-rose-100"
                  }`}>
                    {perhitungan_who.bb_per_tb}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: BOTTOM CARD - REKOMENDASI AI */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Rekomendasi Tindak Lanjut Terarah</span>
          </h4>

          <div className="space-y-2">
            {rekomendasi_ai.saran_tindak_lanjut.map((saran, index) => (
              <div 
                key={index} 
                className="flex items-start space-x-3 p-3 bg-slate-50/50 border border-slate-100 rounded-2xl"
              >
                <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                  themeColor === "rose" 
                    ? "bg-rose-100 text-rose-600" 
                    : themeColor === "amber" 
                    ? "bg-amber-100 text-amber-600" 
                    : "bg-emerald-100 text-emerald-600"
                }`}>
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <p className="text-xs text-slate-700 leading-normal font-medium">
                  {saran}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: ACTIONS AND BUTTONS */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleDownloadPdf}
            className="w-full py-4 bg-[#369AF0] hover:bg-[#2888db] active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <FileDown className="h-4 w-4" />
            <span>Unduh Laporan PDF</span>
          </button>

          <button
            onClick={() => navigate("/kader/input")}
            className="w-full py-4 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-black text-xs uppercase tracking-wider rounded-2xl transition-all text-center flex items-center justify-center space-x-2"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>Periksa Balita Lain</span>
          </button>

          <button
            onClick={() => navigate("/kader")}
            className="w-full py-3 text-slate-400 hover:text-slate-600 font-extrabold text-[11px] uppercase tracking-wider transition-all text-center"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}
