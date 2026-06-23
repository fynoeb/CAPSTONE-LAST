import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Compass, Sparkles, FileText, RefreshCw, Trophy, BookOpen, Smile } from "lucide-react";
import { useAuth, isDummyAccount } from "../../config/AuthContext";
import { predictGizi } from "../../services/api";
import { saveRecord } from "../../services/db";
import { db, auth } from "../../config/firebase";

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

type Step = "identitas" | "pengukuran" | "konfirmasi" | "loading";

export default function InputData() {
  const navigate = useNavigate();
  const { user, isDemo, mockUser, puskesmasName, posyanduName } = useAuth();
  
  // Step tracker
  const [currentStep, setCurrentStep] = useState<Step>("identitas");
  const [isLoading, setIsLoading] = useState(false);

  // --- Step 1: Identitas Balita States ---
  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [namaIbu, setNamaIbu] = useState("");
  const [gender, setGender] = useState<"Perempuan" | "Laki-laki">("Perempuan");
  const [tanggalLahir, setTanggalLahir] = useState("");

  // --- Step 2: Data Pengukuran States ---
  const [berat, setBerat] = useState("");
  const [tinggi, setTinggi] = useState("");
  const [bbLahir, setBbLahir] = useState("");
  const [tbLahir, setTbLahir] = useState("");
  const [lk, setLk] = useState("");
  const [lila, setLila] = useState("");
  const [metodeTinggi, setMetodeTinggi] = useState<"Berdiri" | "Berbaring">("Berdiri");

  // --- Step 2.5: Advanced AI Predictor States matching app.py ---
  const [naikBb, setNaikBb] = useState<number>(1);
  const [jmlVitA, setJmlVitA] = useState<number>(1);
  const [kpsp, setKpsp] = useState<number>(0);
  const [kia, setKia] = useState<number>(1);
  const [kelasIbu, setKelasIbu] = useState<number>(0);
  const [mbg, setMbg] = useState<number>(0);
  const [detail, setDetail] = useState<number>(0);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Loading substate during calculations
  const [loadingPhase, setLoadingPhase] = useState<"calculating" | "finished">("calculating");

  // Computed results state
  const [statusGizi, setStatusGizi] = useState({
    bbStatus: "Gizi Baik",
    tbStatus: "Normal",
    lkStatus: "Normal",
    lilaStatus: "Normal",
    scoreClass: "text-[#369AF0]",
  });

  // --- Step 1 Navigation ---
  const handleNextIdentitas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !nik.trim() || !namaIbu.trim() || !tanggalLahir) {
      alert("Harap lengkapi semua data identitas balita.");
      return;
    }
    if (nik.length !== 16) {
      alert("NIK Balita wajib berupa 16 digit angka.");
      return;
    }
    setCurrentStep("pengukuran");
  };

  // --- Step 2 Navigation ---
  const handleNextPengukuran = (e: React.FormEvent) => {
    e.preventDefault();
    if (!berat || !tinggi || !bbLahir || !tbLahir || !lk || !lila) {
      alert("Harap lengkapi seluruh field pengukuran fisik antropometri.");
      return;
    }
    setCurrentStep("konfirmasi");
  };

  // --- Perform Calculation & Simulation via React & Python backend API ---
  const handleCalculateGizi = async () => {
    setCurrentStep("loading");
    setLoadingPhase("calculating");
    setIsLoading(true);

    const calculateAgeInMonths = (birthDateStr: string): number => {
      if (!birthDateStr) return 0;
      const birthDate = new Date(birthDateStr);
      const today = new Date();
      let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
      months -= birthDate.getMonth();
      months += today.getMonth();
      if (today.getDate() < birthDate.getDate()) {
        months--;
      }
      return Math.max(0, months);
    };

    const usiaBulan = calculateAgeInMonths(tanggalLahir);

    try {
      const res = await predictGizi({
        usia_bulan: Number(usiaBulan),
        jk: gender === "Laki-laki" ? 1 : 0,
        berat: parseFloat(berat) || 0,
        tinggi: parseFloat(tinggi) || 0,
        bb_lahir: parseFloat(bbLahir) || 3.0,
        tb_lahir: parseFloat(tbLahir) || 49.0,
        cara_ukur: metodeTinggi === "Berdiri" ? 1 : 0,
        lila: parseFloat(lila) || 0.0,
        naik_bb: Number(naikBb),
        jml_vit_a: Number(jmlVitA),
        kpsp: Number(kpsp),
        kia: Number(kia),
        kelas_ibu: Number(kelasIbu),
        mbg: Number(mbg),
        detail: Number(detail),
      });

      const email = (isDemo ? mockUser : user?.email) || "";
      const displayPuskesmas = puskesmasName || (isDummyAccount(email) ? "Puskesmas Pauh - Padang" : "Puskesmas Wilayah");
      const displayPosyandu = posyanduName || (isDummyAccount(email) ? "Mawar - Kel. Limau Manis" : "Posyandu Bina Gizi");

      const docPayload = {
        nama: nama.trim(),
        nik: nik.trim(),
        namaIbu: namaIbu.trim(),
        gender: gender === "Perempuan" ? "P" : "L",
        usia: usiaBulan,
        berat: parseFloat(berat),
        tinggi: parseFloat(tinggi),
        bbLahir: parseFloat(bbLahir) || 3.0,
        tbLahir: parseFloat(tbLahir) || 49.0,
        lk: parseFloat(lk) || 0.0,
        lila: parseFloat(lila) || 0.0,
        metodeTinggi,
        naikBb,
        jmlVitA,
        kpsp,
        kia,
        kelasIbu,
        mbg,
        detail,
        weightStatus: res.perhitungan_who.bb_per_u,
        heightStatus: res.perhitungan_who.tb_per_u,
        tanggal: new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric"
        }),
        puskesmasName: displayPuskesmas,
        posyanduName: displayPosyandu,
        kaderEmail: email,
        timestamp: Date.now()
      };

      try {
        await saveRecord({
          nama: docPayload.nama,
          nik: docPayload.nik,
          namaIbu: docPayload.namaIbu,
          gender: docPayload.gender as "L" | "P",
          usia: docPayload.usia,
          berat: docPayload.berat,
          tinggi: docPayload.tinggi,
          bbLahir: docPayload.bbLahir,
          tbLahir: docPayload.tbLahir,
          lk: docPayload.lk,
          lila: docPayload.lila,
          metodeTinggi: docPayload.metodeTinggi,
          naikBb: docPayload.naikBb,
          jmlVitA: docPayload.jmlVitA,
          kpsp: docPayload.kpsp,
          kia: docPayload.kia,
          kelasIbu: docPayload.kelasIbu,
          mbg: docPayload.mbg,
          detail: docPayload.detail,
          weightStatus: docPayload.weightStatus,
          heightStatus: docPayload.heightStatus,
          tanggal: docPayload.tanggal,
          timestamp: docPayload.timestamp,
          puskesmasName: docPayload.puskesmasName,
          posyanduName: docPayload.posyanduName,
          kaderEmail: docPayload.kaderEmail
        }, isDemo, email, displayPuskesmas, displayPosyandu);
      } catch (error) {
        console.warn("Non-blocking saveRecord exception, allowing offline analysis results to proceed:", error);
      }

      // Snappy transit stages ensuring instant response
      setTimeout(() => {
        setLoadingPhase("finished");
        setIsLoading(false);
        setTimeout(() => {
          navigate("/kader/hasil", {
            state: {
              nama: nama.trim(),
              gender: gender === "Perempuan" ? "P" : "L",
              usiaBulan,
              berat: parseFloat(berat),
              tinggi: parseFloat(tinggi),
              response: res,
            }
          });
        }, 150);
      }, 200);

    } catch (err) {
      console.error("Error predicting gizi:", err);
      setIsLoading(false);
      setCurrentStep("konfirmasi");
      alert("Terjadi kesalahan teknis saat menganalisis status gizi. Silakan coba kembali.");
    }
  };

  const handleDownloadPdf = () => {
    alert("Berhasil mengunduh dokumen laporan Rekapitualisasi KMS Elektronik Balita dalam format PDF.");
  };

  return (
    <div className="flex flex-col min-h-full">
      
      {/* Top Banner Header with Back arrow */}
      <div className="px-6 pt-6 pb-2 text-[#333333] flex items-center space-x-3">
        {currentStep !== "loading" && currentStep !== "hasil" && (
          <button
            onClick={() => {
              if (currentStep === "pengukuran") setCurrentStep("identitas");
              else if (currentStep === "konfirmasi") setCurrentStep("pengukuran");
              else navigate("/kader");
            }}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#369AF0] shadow-sm hover:scale-105 active:scale-95 transition-all"
          >
            <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
          </button>
        )}
        <div className="leading-tight">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Input Data Balita</h2>
          <p className="text-[11px] text-[#369AF0] font-bold uppercase tracking-wider">Pengukuran Antropometri</p>
        </div>
      </div>

      {/* Steps Progress Indicator (Step 1-3) */}
      {currentStep !== "loading" && currentStep !== "hasil" && (
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-xs mx-auto text-center relative">
            
            {/* Step 1 Circle */}
            <div className="flex flex-col items-center z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                currentStep === "identitas" 
                  ? "bg-[#369AF0] text-white ring-4 ring-blue-100" 
                  : "bg-white text-slate-400 border border-slate-200"
              }`}>
                1
              </div>
              <span className={`text-[9px] font-bold mt-1.5 ${currentStep === "identitas" ? "text-[#369AF0]" : "text-slate-400"}`}>Identitas</span>
            </div>

            {/* Connecting Bar */}
            <div className="absolute left-7 right-7 top-4 h-0.5 bg-slate-200 -z-0" />
            <div className={`absolute left-7 top-4 h-0.5 bg-[#369AF0] transition-all duration-300 -z-0 ${
              currentStep === "pengukuran" ? "w-1/2" : currentStep === "konfirmasi" ? "w-full" : "w-0"
            }`} />

            {/* Step 2 Circle */}
            <div className="flex flex-col items-center z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                currentStep === "pengukuran" 
                  ? "bg-[#369AF0] text-white ring-4 ring-blue-100" 
                  : currentStep === "konfirmasi"
                  ? "bg-[#369AF0] text-white"
                  : "bg-white text-slate-400 border border-slate-200"
              }`}>
                2
              </div>
              <span className={`text-[9px] font-bold mt-1.5 ${currentStep === "pengukuran" ? "text-[#369AF0]" : "text-slate-400"}`}>Pengukuran</span>
            </div>

            {/* Step 3 Circle */}
            <div className="flex flex-col items-center z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                currentStep === "konfirmasi" 
                  ? "bg-[#369AF0] text-white ring-4 ring-blue-100" 
                  : "bg-white text-slate-400 border border-slate-200"
              }`}>
                3
              </div>
              <span className={`text-[9px] font-bold mt-1.5 ${currentStep === "konfirmasi" ? "text-[#369AF0]" : "text-slate-400"}`}>Konfirmasi</span>
            </div>

          </div>
        </div>
      )}

      {/* STEP 1: IDENTITAS BALITA */}
      {currentStep === "identitas" && (
        <div className="bg-white rounded-t-[36px] flex-1 p-6 space-y-5 shadow-xl pb-12 mt-2">
          
          <div className="flex items-center space-x-2 pb-1 border-b border-slate-50">
            <span className="w-1.5 h-4 bg-[#369AF0] rounded-full" />
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Identitas Balita</h3>
          </div>

          <form onSubmit={handleNextIdentitas} className="space-y-4">
            
            {/* Nama Lengkap */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nama Lengkap Balita</label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Masukkan nama lengkap balita"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#369AF0] focus:bg-white text-xs transition-all"
              />
            </div>

            {/* NIK Balita */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">NIK Balita</label>
              <input
                type="text"
                required
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="16 digit NIK"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#369AF0] focus:bg-white text-xs font-mono tracking-wider transition-all"
              />
            </div>

            {/* Nama Orang Tua */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nama Ibu / Orang Tua / Wali</label>
              <input
                type="text"
                required
                value={namaIbu}
                onChange={(e) => setNamaIbu(e.target.value)}
                placeholder="Masukkan nama lengkap ibu / orang tua"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#369AF0] focus:bg-white text-xs transition-all"
              />
            </div>

            {/* Gender Toggle BUTTONS matching exact style */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Jenis Kelamin</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender("Perempuan")}
                  className={`py-3 rounded-2xl text-xs font-extrabold transition-all border ${
                    gender === "Perempuan"
                      ? "border-[#369AF0] bg-[#369AF0]/10 text-[#369AF0] shadow-xs"
                      : "border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100/70"
                  }`}
                >
                  Perempuan
                </button>
                <button
                  type="button"
                  onClick={() => setGender("Laki-laki")}
                  className={`py-3 rounded-2xl text-xs font-extrabold transition-all border ${
                    gender === "Laki-laki"
                      ? "border-[#369AF0] bg-[#369AF0]/10 text-[#369AF0] shadow-xs"
                      : "border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100/70"
                  }`}
                >
                  Laki-laki
                </button>
              </div>
            </div>

            {/* Tanggal Lahir (formatted search) */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tanggal Lahir</label>
              <input
                type="date"
                required
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 focus:outline-none focus:border-[#369AF0] focus:bg-white text-xs transition-all"
              />
            </div>

            {/* Continue Submit */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-[#369AF0] to-[#5ba7e8] hover:opacity-95 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md mt-2 active:scale-95"
              >
                Selanjutnya
              </button>
            </div>

          </form>
        </div>
      )}

      {/* STEP 2: DATA PENGUKURAN */}
      {currentStep === "pengukuran" && (
        <div className="bg-white rounded-t-[36px] flex-1 p-6 space-y-5 shadow-xl pb-12 mt-2">
          
          <div className="flex items-center space-x-2 pb-1 border-b border-slate-50">
            <span className="w-1.5 h-4 bg-[#369AF0] rounded-full" />
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Data Pengukuran</h3>
          </div>

          <form onSubmit={handleNextPengukuran} className="space-y-4">
            
            {/* Core Weight & Height row */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* Berat Badan */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Berat Badan (BB)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.0"
                    value={berat}
                    onChange={(e) => setBerat(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-4 pr-10 text-slate-800 focus:outline-none focus:border-[#369AF0] text-xs font-mono transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">kg</span>
                </div>
              </div>

              {/* Tinggi Badan */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tinggi Badan (TB)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="0.0"
                    value={tinggi}
                    onChange={(e) => setTinggi(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-4 pr-10 text-slate-800 focus:outline-none focus:border-[#369AF0] text-xs font-mono transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">cm</span>
                </div>
              </div>

            </div>

            {/* Birth weight & Height row */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* BB Lahir */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">BB Lahir</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.0"
                    value={bbLahir}
                    onChange={(e) => setBbLahir(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-4 pr-10 text-slate-800 focus:outline-none focus:border-[#369AF0] text-xs font-mono transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">kg</span>
                </div>
              </div>

              {/* TB Lahir */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">TB Lahir</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="0.0"
                    value={tbLahir}
                    onChange={(e) => setTbLahir(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-4 pr-10 text-slate-800 focus:outline-none focus:border-[#369AF0] text-xs font-mono transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">cm</span>
                </div>
              </div>

            </div>

            {/* Lingkar Kepala and Lila and other essential fields */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* Lingkar Kepala */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Lingkar Kepala</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="0.0"
                    value={lk}
                    onChange={(e) => setLk(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-4 pr-10 text-slate-800 focus:outline-none focus:border-[#369AF0] text-xs font-mono transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">cm</span>
                </div>
              </div>

              {/* Lingkar Lengan Atas */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Lingkar Lengan (Lila)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="0.0"
                    value={lila}
                    onChange={(e) => setLila(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-4 pr-10 text-slate-800 focus:outline-none focus:border-[#369AF0] text-xs font-mono transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">cm</span>
                </div>
              </div>

            </div>

            {/* Height Measurement Method Buttons */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Metode Pengukuran Tinggi</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMetodeTinggi("Berdiri")}
                  className={`py-3 rounded-2xl text-xs font-extrabold transition-all border ${
                    metodeTinggi === "Berdiri"
                      ? "border-[#369AF0] bg-[#369AF0]/10 text-[#369AF0] shadow-xs"
                      : "border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100/70"
                  }`}
                >
                  Berdiri
                </button>
                <button
                  type="button"
                  onClick={() => setMetodeTinggi("Berbaring")}
                  className={`py-3 rounded-2xl text-xs font-extrabold transition-all border ${
                    metodeTinggi === "Berbaring"
                      ? "border-[#369AF0] bg-[#369AF0]/10 text-[#369AF0] shadow-xs"
                      : "border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100/70"
                  }`}
                >
                  Berbaring
                </button>
              </div>
            </div>

            {/* Dropdown/Collapsible for Advanced AI Parameters matching app.py */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full py-2.5 flex items-center justify-between text-slate-500 hover:text-[#369AF0] transition-colors text-xs font-black uppercase tracking-wider"
              >
                <span>Parameter Tambahan AI (Model RF)</span>
                <span className="text-[10px] font-bold text-slate-400">
                  {showAdvanced ? "Sembunyikan" : "Tampilkan Opsi"}
                </span>
              </button>

              {showAdvanced && (
                <div className="mt-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4 animate-fadeIn">
                  
                  {/* Naik BB & KIA */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Berat Naik Bulan Ini</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setNaikBb(1)}
                          className={`py-2 rounded-xl text-[10px] font-extrabold transition-all border ${
                            naikBb === 1
                              ? "border-[#369AF0] bg-[#369AF0]/10 text-[#369AF0]"
                              : "border-slate-200 bg-white text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          Ya
                        </button>
                        <button
                          type="button"
                          onClick={() => setNaikBb(0)}
                          className={`py-2 rounded-xl text-[10px] font-extrabold transition-all border ${
                            naikBb === 0
                              ? "border-[#369AF0] bg-[#369AF0]/10 text-[#369AF0]"
                              : "border-slate-200 bg-white text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          Tidak
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Buku KIA</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setKia(1)}
                          className={`py-2 rounded-xl text-[10px] font-extrabold transition-all border ${
                            kia === 1
                              ? "border-[#369AF0] bg-[#369AF0]/10 text-[#369AF0]"
                              : "border-slate-200 bg-white text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          Ada
                        </button>
                        <button
                          type="button"
                          onClick={() => setKia(0)}
                          className={`py-2 rounded-xl text-[10px] font-extrabold transition-all border ${
                            kia === 0
                              ? "border-[#369AF0] bg-[#369AF0]/10 text-[#369AF0]"
                              : "border-slate-200 bg-white text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          Tidak
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Vit A & Kelas Ibu */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Vaksin / Vit A</label>
                      <div className="grid grid-cols-3 gap-1">
                        {[0, 1, 2].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setJmlVitA(num)}
                            className={`py-2 rounded-lg text-[10px] font-extrabold transition-all border ${
                              jmlVitA === num
                                ? "border-[#369AF0] bg-[#369AF0]/10 text-[#369AF0]"
                                : "border-slate-200 bg-white text-slate-400 hover:bg-slate-100"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Kelas Ibu Balita</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setKelasIbu(1)}
                          className={`py-2 rounded-xl text-[10px] font-extrabold transition-all border ${
                            kelasIbu === 1
                              ? "border-[#369AF0] bg-[#369AF0]/10 text-[#369AF0]"
                              : "border-slate-200 bg-white text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          Ikut
                        </button>
                        <button
                          type="button"
                          onClick={() => setKelasIbu(0)}
                          className={`py-2 rounded-xl text-[10px] font-extrabold transition-all border ${
                            kelasIbu === 0
                              ? "border-[#369AF0] bg-[#369AF0]/10 text-[#369AF0]"
                              : "border-slate-200 bg-white text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          Tidak
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* KPSP & MBG */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Perkembangan KPSP</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setKpsp(1)}
                          className={`py-2 rounded-xl text-[10px] font-extrabold transition-all border ${
                            kpsp === 1
                              ? "border-[#369AF0] bg-[#369AF0]/10 text-[#369AF0]"
                              : "border-slate-200 bg-white text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          Sesuai
                        </button>
                        <button
                          type="button"
                          onClick={() => setKpsp(0)}
                          className={`py-2 rounded-xl text-[10px] font-extrabold transition-all border ${
                            kpsp === 0
                              ? "border-[#369AF0] bg-[#369AF0]/10 text-[#369AF0]"
                              : "border-slate-200 bg-white text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          Ragu
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Praktek MBG</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setMbg(1)}
                          className={`py-2 rounded-xl text-[10px] font-extrabold transition-all border ${
                            mbg === 1
                              ? "border-[#369AF0] bg-[#369AF0]/10 text-[#369AF0]"
                              : "border-slate-200 bg-white text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          Ya
                        </button>
                        <button
                          type="button"
                          onClick={() => setMbg(0)}
                          className={`py-2 rounded-xl text-[10px] font-extrabold transition-all border ${
                            mbg === 0
                              ? "border-[#369AF0] bg-[#369AF0]/10 text-[#369AF0]"
                              : "border-slate-200 bg-white text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          Tidak
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Next buttons */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-[#369AF0] to-[#5ba7e8] hover:opacity-95 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                Selanjutnya
              </button>
            </div>

          </form>
        </div>
      )}

      {/* STEP 3: KONFIRMASI DATA */}
      {currentStep === "konfirmasi" && (
        <div className="bg-white rounded-t-[36px] flex-1 p-6 space-y-5 shadow-xl pb-12 mt-2">
          
          <div className="flex items-center space-x-2 pb-1 border-b border-slate-50">
            <span className="w-1.5 h-4 bg-[#369AF0] rounded-full" />
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Konfirmasi Data</h3>
          </div>

          <div className="space-y-4">
            
            {/* Identity Summary Card */}
            <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl space-y-2.5">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Identitas Balita</h4>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                <span className="text-slate-400">Nama Balita:</span>
                <span className="font-extrabold text-slate-800 text-right">{nama}</span>
                
                <span className="text-slate-400">NIK:</span>
                <span className="font-mono font-medium text-slate-800 text-right">{nik}</span>

                <span className="text-slate-400">Ibu / Wali:</span>
                <span className="font-bold text-slate-800 text-right">{namaIbu}</span>

                <span className="text-slate-400">Jenis Kelamin:</span>
                <span className="font-bold text-slate-800 text-right">{gender}</span>

                <span className="text-slate-400">Tanggal Lahir:</span>
                <span className="font-bold text-slate-800 text-right">{tanggalLahir}</span>
              </div>
            </div>

            {/* Measurement Summary Card */}
            <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl space-y-2.5">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Hasil Pengukuran</h4>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                <span className="text-slate-400">Berat Badan (BB):</span>
                <span className="font-mono font-bold text-slate-800 text-right">{berat} kg</span>

                <span className="text-slate-400">Tinggi Badan (TB):</span>
                <span className="font-mono font-bold text-slate-800 text-right">{tinggi} cm</span>

                <span className="text-slate-400">BB Lahir:</span>
                <span className="font-mono font-bold text-slate-800 text-right">{bbLahir} kg</span>

                <span className="text-slate-400">TB Lahir:</span>
                <span className="font-mono font-bold text-slate-800 text-right">{tbLahir} cm</span>

                <span className="text-slate-400">Lingkar Kepala:</span>
                <span className="font-mono font-bold text-slate-800 text-right">{lk} cm</span>

                <span className="text-slate-400">Lingkar Lengan:</span>
                <span className="font-mono font-bold text-slate-800 text-right">{lila} cm</span>

                <span className="text-slate-400">Metode Ukur:</span>
                <span className="font-bold text-[#369AF0] text-right">{metodeTinggi}</span>
              </div>
            </div>

            {/* Calculate Trigger button (matches gorgeous green button in mockup screenshot) */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleCalculateGizi}
                className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 text-center block"
              >
                Analisis Status Gizi
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TRANSITION LOADING PHASE */}
      {currentStep === "loading" && (
        <div className="flex-1 flex flex-col justify-center items-center px-6 text-center space-y-6 min-h-[500px]">
          
          <div className="relative w-28 h-28 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-lg">
            <Compass className={`h-14 w-14 text-[#369AF0] ${loadingPhase === "calculating" ? "animate-spin" : ""}`} />
            {loadingPhase === "finished" && (
              <div className="absolute inset-0 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-white animate-scaleIn">
                <Check className="h-12 w-12 text-white stroke-[3.5]" />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-black text-slate-800">
              {loadingPhase === "calculating" ? "Menghitung Gizi Balita..." : "Hasil akan tampil"}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {loadingPhase === "calculating" ? "Mohon tunggu sebentar" : "Perhitungan selesai"}
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
