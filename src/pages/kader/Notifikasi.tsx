import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Server, ShieldAlert, BadgeCheck, CheckCircle2 } from "lucide-react";

interface NotificationItem {
  id: string;
  type: "sync" | "update" | "alert";
  title: string;
  content: string;
  time: string;
  read: boolean;
}

export default function Notifikasi() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "nt-1",
      type: "sync",
      title: "Sinkronisasi Berhasil",
      content: "Seluruh data pendataan gizi balita hari ini telah terunggah dan ter-sinkronisasi sempurna dengan server utama Puskesmas.",
      time: "Baru saja",
      read: false,
    },
    {
      type: "update",
      id: "nt-2",
      title: "Pembaruan Standar Z-Score WHO",
      content: "Sistem kalkulator cerdas kini menggunakan parameter kurva pertumbuhan balita WHO 2026 terbaru sesuai arahan Kementerian Kesehatan.",
      time: "2 jam yang lalu",
      read: false,
    },
    {
      type: "alert",
      id: "nt-3",
      title: "Rujukan Terbuka",
      content: "Ada 5 balita di bawah pengenalan posyandu Anda yang membutuhkan konfirmasi rujukan gizi kurang oleh Bidan hari ini.",
      time: "1 hari yang lalu",
      read: true,
    },
    {
      type: "sync",
      id: "nt-4",
      title: "Koneksi Aman Terverifikasi",
      content: "Sesi kerja Anda terlindungi dengan enkripsi SSL 256-bit demi menjaga kerahasiaan rekam medis balita.",
      time: "2 hari yang lalu",
      read: true,
    }
  ]);

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Target header back navigation */}
      <div className="px-6 pt-6 pb-2 text-[#333333] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/kader")}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#369AF0] shadow-sm hover:scale-105 active:scale-95 transition-all"
          >
            <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
          </button>
          <div className="leading-tight">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Notifikasi</h2>
            <p className="text-[11px] text-[#369AF0] font-bold uppercase tracking-wider">Pemberitahuan Sistem</p>
          </div>
        </div>

        {notifications.some(n => !n.read) && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-[10px] uppercase tracking-wider font-extrabold text-[#369AF0] hover:underline"
          >
            Tandai Dibaca
          </button>
        )}
      </div>

      {/* Curved main wrapper section */}
      <div className="bg-white rounded-t-[36px] flex-1 p-6 space-y-4 shadow-xl pb-16 mt-4">
        <div className="flex items-center space-x-2 pb-1 border-b border-slate-50">
          <span className="w-1.5 h-3 bg-[#369AF0] rounded-full" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pemberitahuan Terbaru</span>
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-100 rounded-3xl">
              <p className="text-xs font-bold text-slate-400">Tidak ada notifikasi baru</p>
            </div>
          ) : (
            notifications.map((item) => {
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-3xl border transition-all text-left relative flex items-start space-x-3.5 ${
                    item.read
                      ? "bg-slate-50/45 border-slate-100 text-slate-600"
                      : "bg-[#369AF0]/5 border-[#369AF0]/20 text-slate-800"
                  }`}
                >
                  {/* Icon Select */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    item.type === "sync"
                      ? "bg-blue-50 text-[#369AF0]"
                      : item.type === "update"
                      ? "bg-emerald-50 text-emerald-500"
                      : "bg-pink-50 text-pink-500"
                  }`}>
                    <Bell className="h-4.5 w-4.5 stroke-[2.2]" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <h4 className="text-xs font-extrabold text-slate-800 truncate">{item.title}</h4>
                        {!item.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
                        )}
                      </div>
                      <span className="text-[9px] font-medium text-slate-400 whitespace-nowrap pl-2">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-normal">{item.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Informational banner */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start space-x-3">
          <CheckCircle2 className="h-4.5 w-4.5 text-[#369AF0] mt-0.5 flex-shrink-0" />
          <div className="space-y-0.5 text-left">
            <span className="text-[10px] font-bold text-slate-700 block">Hubungan Puskesmas Aktif</span>
            <span className="text-[9px] text-slate-400 block leading-relaxed">
              Semua data antropometri disalurkan aman di bawah sertifikasi pengawasan BPJS Kesehatan RI.
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate("/kader")}
          className="w-full py-4 mt-2 bg-gradient-to-r from-[#369AF0] to-[#5ba7e8] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-95 text-center block"
        >
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );
}
