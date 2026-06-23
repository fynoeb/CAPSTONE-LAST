import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import { useAuth } from "../config/AuthContext";
import { getRegisteredPuskesmas } from "../services/db";
import { Activity, ArrowLeft, User, Home, Mail, Lock, CheckCircle2 } from "lucide-react";

export default function RegisterKader() {
  const navigate = useNavigate();
  const { setFullName, setPosyanduName, setPuskesmasName, setRole } = useAuth();

  // State untuk form input
  const [namaLengkap, setNamaLengkap] = useState("");
  const [namaPosyandu, setNamaPosyandu] = useState("");
  const [puskesmasPembina, setPuskesmasPembina] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // State untuk menyimpan daftar puskesmas dari cloud
  const [daftarPuskesmas, setDaftarPuskesmas] = useState<string[]>([]);
  const [loadingPuskesmas, setLoadingPuskesmas] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ambil daftar puskesmas otomatis saat halaman dibuka
  useEffect(() => {
    getRegisteredPuskesmas()
      .then((list) => {
        setDaftarPuskesmas(list);
        if (list.length > 0) {
          setPuskesmasPembina(list[0]); // Set default pilihan pertama
        }
        setLoadingPuskesmas(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingPuskesmas(false);
      });
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validasi dasar
    if (!namaLengkap || !namaPosyandu || !puskesmasPembina || !email || !password) {
      setErrorMsg("Harap lengkapi semua data pendaftaran.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok!");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password minimal harus 6 karakter.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Daftarkan akun ke Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Simpan profile & otomatis sinkronisasi ke Cloud Firestore (Users Collection)
      setRole("Kader");
      setFullName(namaLengkap, user.email || "");
      setPosyanduName(namaPosyandu, user.email || "");
      setPuskesmasName(puskesmasPembina, user.email || "");

      // 3. Sukses, langsung arahkan ke Dashboard Kader
      navigate("/kader");
    } catch (error: any) {
      console.error("Register error:", error);
      if (error.code === "auth/email-already-in-use") {
        setErrorMsg("Email sudah terdaftar. Silakan gunakan email lain.");
      } else if (error.code === "auth/invalid-email") {
        setErrorMsg("Format email tidak valid.");
      } else {
        setErrorMsg("Terjadi kesalahan sistem saat mendaftar. Coba lagi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 md:bg-slate-950 flex items-center justify-center text-slate-800 antialiased font-sans p-0 md:p-6">
      {/* Container Mobile View */}
      <div className="w-full max-w-md bg-gradient-to-b from-[#FFD7E1] via-[#E2EDFA] to-[#369AF0] flex flex-col min-h-screen md:min-h-[850px] md:max-h-[900px] md:rounded-[40px] shadow-2xl relative overflow-hidden p-6">
        
        {/* Tombol Kembali ke halaman utama / login */}
        <div className="flex items-center space-x-3 pt-4">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#369AF0] shadow-sm active:scale-95 transition-all"
          >
            <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
          </button>
          <div className="leading-tight">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Daftar Akun</h2>
            <p className="text-[11px] text-[#369AF0] font-bold uppercase tracking-wider">Portal Kader Posyandu</p>
          </div>
        </div>

        {/* Form area di dalam container putih melengkung */}
        <div className="bg-white rounded-[32px] p-5 space-y-4 shadow-xl mt-6 flex-1 overflow-y-auto scrollbar-none mb-4">
          
          <div className="flex items-center justify-center gap-2 pt-2 pb-1">
            <div className="bg-[#FFD7E1] p-1.5 rounded-lg text-[#369AF0]">
              <Activity className="h-5 w-5" />
            </div>
            <span className="font-black text-lg text-slate-900 tracking-tight">SIGIZI BALITA</span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold text-center animate-shake">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* Nama Lengkap */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Nama Lengkap</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  placeholder="Masukkan nama lengkap Anda"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-800 focus:outline-none focus:border-[#369AF0] focus:bg-white transition-all"
                />
                <User className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Nama Posyandu */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Nama Posyandu</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={namaPosyandu}
                  onChange={(e) => setNamaPosyandu(e.target.value)}
                  placeholder="Contoh: Posyandu Mawar Flamboyan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-800 focus:outline-none focus:border-[#369AF0] focus:bg-white transition-all"
                />
                <Home className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Dropdown Puskesmas Pembina (Otomatis Real-Time dari Cloud) */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Puskesmas Pembina</label>
              <select
                value={puskesmasPembina}
                onChange={(e) => setPuskesmasPembina(e.target.value)}
                disabled={loadingPuskesmas}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs text-slate-800 focus:outline-none focus:border-[#369AF0] focus:bg-white transition-all"
              >
                {loadingPuskesmas ? (
                  <option>Memuat daftar puskesmas...</option>
                ) : (
                  daftarPuskesmas.map((puskName) => (
                    <option key={puskName} value={puskName}>
                      {puskName}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Username / Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-800 focus:outline-none focus:border-[#369AF0] focus:bg-white transition-all"
                />
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-800 focus:outline-none focus:border-[#369AF0] focus:bg-white transition-all"
                />
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Konfirmasi Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Konfirmasi Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password Anda"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-800 focus:outline-none focus:border-[#369AF0] focus:bg-white transition-all"
                />
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Tombol Submit Pendaftaran */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-[#369AF0] to-[#5ba7e8] hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? "Mendaftarkan Akun..." : "Daftar Sekarang"}
              </button>
            </div>
          </form>

          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-400 font-medium">
              Sudah memiliki akun?{" "}
              <Link to="/" className="text-[#369AF0] font-bold hover:underline">
                Masuk Sesi
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
