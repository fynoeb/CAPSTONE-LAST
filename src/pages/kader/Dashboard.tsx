import React, { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, isDummyAccount } from "../../config/AuthContext";
import { ClipboardList, PlusCircle, Users, Activity, HelpCircle, ArrowRight } from "lucide-react";
import { getRecords, RecordItem } from "../../services/db";

export default function Dashboard() {
  const { user, isDemo, fullName, posyanduName, puskesmasName, mockUser } = useAuth();
  const navigate = useNavigate();

  const email = (isDemo ? mockUser : user?.email) || "";
  const isDummy = isDummyAccount(email);

  const displayFullName = fullName || (isDummy ? "Hanifah Larama" : email || "Kader Gizi");
  const displayPosyandu = posyanduName || (isDummy ? "Mawar - Kel. Limau Manis" : "Posyandu Bina Gizi");
  const displayPuskesmas = useMemo(
    () => puskesmasName || (isDummy ? "Puskesmas Pauh - Padang" : "Puskesmas Wilayah"),
    [puskesmasName, isDummy]
  );

  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const handleUpdate = (latestData: RecordItem[]) => {
      if (active) {
        setRecords(latestData);
        setLoading(false);
      }
    };

    getRecords(isDemo, email, displayPuskesmas, handleUpdate)
      .then((data) => {
        if (active) {
          setRecords(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Error getting records:", err);
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [isDemo, email, displayPuskesmas]);

  // Load actual records to compute stats dynamically
  const { totalCount, goodCount, rujukanCount } = useMemo(() => {
    const total = records.length;
    const rujukan = records.filter(r => 
      r.weightStatus?.toLowerCase().includes("kurang") || 
      r.heightStatus?.toLowerCase().includes("pendek") || 
      r.heightStatus?.toLowerCase().includes("stunted")
    ).length;
    const baik = total - rujukan;
    return { totalCount: total, goodCount: baik, rujukanCount: rujukan };
  }, [records]);

  return (
    <div className="flex flex-col min-h-full">
      {/* Top Header Section inside Gradient */}
      <div className="px-6 pt-8 pb-4 text-[#333333] space-y-4">
        <div className="space-y-1">
          <p className="text-xs text-slate-500 font-medium tracking-wide">Selamat datang,</p>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">{displayFullName}</h2>
          <p className="text-xs text-[#369AF0] font-bold tracking-wide uppercase">{displayPosyandu}</p>
          <p className="text-[10px] text-slate-500 font-normal">{displayPuskesmas}</p>
        </div>

        {/* 3 Transparent Glass Capsules (horizontal grid) to replicate mockup */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          <div className="bg-white/40 backdrop-blur-md rounded-2xl p-3 border border-white/20 text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Total</span>
            <span className="text-lg font-black text-slate-800">{totalCount}</span>
            <span className="text-[8px] text-slate-400 block">Balita</span>
          </div>

          <div className="bg-white/40 backdrop-blur-md rounded-2xl p-3 border border-white/20 text-center shadow-xs">
            <span className="text-[10px] font-bold text-[#369AF0] uppercase block tracking-wider font-extrabold">Baik</span>
            <span className="text-lg font-black text-[#2e88d6]">{goodCount}</span>
            <span className="text-[8px] text-slate-400 block">Normal</span>
          </div>

          <div className="bg-white/40 backdrop-blur-md rounded-2xl p-3 border border-white/20 text-center shadow-xs">
            <span className="text-[10px] font-bold text-pink-600 uppercase block tracking-wider">Rujukan</span>
            <span className="text-lg font-black text-pink-600">{rujukanCount}</span>
            <span className="text-[8px] text-slate-400 block">Kurang</span>
          </div>
        </div>
      </div>

      {/* Main Curved White Container */}
      <div className="bg-white rounded-t-[36px] mt-4 flex-1 p-6 space-y-6 shadow-xl pb-10">
        
        {/* Navigation Indicator / Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Peta Tugas Kader</h3>
            <span className="text-[10px] font-bold text-[#369AF0] uppercase tracking-wider">Pemeriksaan Berkala</span>
          </div>

          {/* Quick Action Large Card */}
          <button
            onClick={() => navigate("/kader/input")}
            className="w-full bg-gradient-to-r from-[#369AF0] to-[#9cbfe0] hover:opacity-95 text-white p-4 rounded-3xl flex items-center justify-between transition-all shadow-md active:scale-95 text-left"
          >
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-black bg-white/20 text-white rounded-full px-2 py-0.5 tracking-wider inline-block">
                Sistem Deteksi Dini
              </span>
              <p className="text-base font-black">Input Pengukuran Baru</p>
              <p className="text-[11px] text-blue-50/90 font-medium">Lengkapi Z-Score berat dan tinggi lahir balita</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white text-[#369AF0] flex items-center justify-center shadow-xs">
              <ArrowRight className="h-5 w-5 stroke-[2.5]" />
            </div>
          </button>
        </div>

        {/* Informative Stats List */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aktivitas Terakhir</h4>

          <div className="space-y-2.5">
            <div className="flex items-center space-x-3.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#369AF0] flex items-center justify-center flex-shrink-0">
                <Users className="h-4.5 w-4.5 stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-slate-800">{isDummy ? "47 Balita Terdaftar" : `${totalCount} Balita Terdaftar`}</p>
                <p className="text-[10px] text-slate-500 font-normal">
                  {totalCount === 0 
                    ? "Belum ada balita yang didata oleh akun Anda" 
                    : `Tingkat kehadiran posyandu bulan ini mencapai 94%`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center flex-shrink-0">
                <Activity className="h-4.5 w-4.5 stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-slate-800">Evaluasi Otomatis WHO</p>
                <p className="text-[10px] text-slate-500 font-normal">Antropometri berpedoman pada z-score Kementerian Kesehatan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Simple helper instruction card */}
        <div className="p-4 bg-blue-50/50 border border-blue-100/60 rounded-2xl">
          <p className="text-xs font-bold text-slate-700 leading-relaxed mb-1 flex items-center space-x-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-[#369AF0] flex-shrink-0" />
            <span>Petunjuk Sinkronisasi</span>
          </p>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Data balita yang Anda kumpulkan akan langsung terhubung ke dashboard Bidan Puskesmas secara real-time demi memudahkan pemantauan dan rujukan.
          </p>
        </div>

      </div>
    </div>
  );
}
