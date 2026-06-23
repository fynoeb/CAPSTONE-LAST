# SIGIZI BALITA (Sistem Informasi & Analisis Gizi Balita)

SIGIZI BALITA adalah platform digital komprehensif yang dirancang untuk membantu Kader Posyandu dan Bidan Puskesmas dalam memonitor, mencatat, serta menganalisis status pertumbuhan dan gizi balita secara real-time. Platform ini mengintegrasikan kecerdasan buatan (Machine Learning) menggunakan model Random Forest Classification untuk memprediksi status gizi dan memberikan rekomendasi intervensi dini yang akurat.

---

## Fitur Utama

### 1. Portal Kerja Kader Posyandu
*   **Registrasi & Pemeriksaan**: Pencatatan data fisik balita meliputi Berat Badan (BB), Tinggi Badan (TB), Lingkar Kepala (LK), Lingkar Lengan Atas (LiLA), dan Metode Pengukuran Tinggi.
*   **Hasil Analisis Instan**: Perhitungan otomatis Z-Score (BB/U, TB/U, BB/TB) berdasarkan standar antropometri Kementerian Kesehatan Republik Indonesia.
*   **Rekomendasi AI**: Prediksi klasifikasi status gizi berbasis Machine Learning beserta rekomendasi tindakan secara langsung.
*   **Riwayat Pemeriksaan**: Penyimpanan terstruktur seluruh log pemeriksaan bulanan balita.

### 2. Portal Dashboard Bidan Puskesmas
*   **Pemantauan Regional**: Monitoring agregat persebaran status gizi balita di seluruh Posyandu wilayah kerja Puskesmas.
*   **Penyaringan Data Cerdas**: Pencarian, pemfilteran, dan peninjauan riwayat gizi spesifik per balita atau per wilayah kerja.
*   **Data Kader**: Manajemen dan koordinasi data kader aktif yang bertugas di masing-masing Posyandu binaan.
*   **Laporan PDF**: Ekspor riwayat gizi balita secara berkala ke dokumen PDF siap cetak.

---

## Arsitektur & Teknologi

*   **Frontend**: 
    *   React 18 dengan TypeScript
    *   Vite (Build Tooling & Bundler)
    *   Tailwind CSS (Desain antarmuka bersih, minimalis, responsif)
    *   Lucide React (Pustaka ikon SVG)
    *   Recharts (Visualisasi grafik statistik pertumbuhan balita)
*   **Backend**: 
    *   Python dengan Flask Framework (API Analisis Gizi)
    *   Scikit-Learn (Model Klasifikasi Random Forest)
    *   Pandas & NumPy (Pra-pemrosesan data)
*   **Basis Data & Autentikasi**: 
    *   Firebase Authentication (Pemisahan akses aman Kader dan Bidan)
    *   Firebase Firestore (Penyimpanan dokumen terstruktur dan sinkronisasi real-time)

---

## Struktur Folder Proyek

```
SIGIZI BALITA/
├── app.py                      # Flask API Server (Machine Learning)
├── model_rf_gizi.pkl           # Trained Random Forest Model file
├── requirements.txt            # Dependensi Python Backend
├── render.yaml                 # Blueprint file untuk deploy ke Render.com
├── vercel.json                 # Konfigurasi routing SPA untuk Vercel
├── package.json                # Dependensi NodeJS Frontend
├── vite.config.ts              # Konfigurasi bundle & optimasi performa Vite
├── src/
│   ├── config/
│   │   ├── firebase.ts         # Inisialisasi Firebase SDK
│   │   └── AuthContext.tsx     # Manajemen sesi / peran pengguna (Kader/Bidan)
│   ├── services/
│   │   ├── api.ts              # Koneksi HTTP Frontend ke ML API
│   │   ├── db.ts               # Interface interaksi Firestore DB
│   │   └── gizi.ts             # Logika antropometri lokal (fall-back)
│   ├── pages/                  # Halaman aplikasi (Kader & Bidan)
│   ├── components/             # Reusable UI components
│   └── layouts/                # Wrapper tata letak navigasi
└── public/
```

---

## Panduan Instalasi & Pengoperasian Lokal

### 1. Persiapan Backend (API Flask)
*   Pastikan Python 3.11+ telah terinstal di komputer Anda.
*   Buka terminal di direktori root proyek dan jalankan perintah berikut:
    ```bash
    # Membuat virtual environment
    python -m venv venv
    
    # Mengaktifkan virtual environment
    # Di Windows:
    venv\Scripts\activate
    # Di macOS/Linux:
    source venv/bin/activate
    
    # Instalasi dependensi
    pip install -r requirements.txt
    
    # Menjalankan server backend
    python app.py
    ```
    API backend akan aktif pada port `5000` (atau port lingkungan `PORT` jika dideklarasikan).

### 2. Persiapan Frontend (React + Vite)
*   Pastikan NodeJS 18+ telah terinstal.
*   Buka terminal baru di direktori root proyek dan jalankan perintah berikut:
    ```bash
    # Instalasi pustaka dependensi frontend
    npm install
    
    # Menjalankan server pengembangan lokal
    npm run dev
    ```
    Frontend lokal akan bertaut secara default pada port `3000` (atau `5173`).

---

## Konfigurasi Environment Variables (`.env`)

Untuk menghubungkan antar layanan secara penuh di masa produksi, buat file `.env` di tingkat akar frontend dengan konfigurasi kunci berikut:

```env
VITE_API_URL=https://<domain-backend-anda>.onrender.com

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## Panduan Deploy

### 1. Deploy API Backend di Render.com
*   Buat akun di [Render.com](https://render.com).
*   Pilih **New Web Service** dan ikuti panduan tautan repositori Git Anda.
*   Render akan otomatis melacak file `render.yaml` di root proyek untuk memproses konfigurasi build dan start:
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `gunicorn app:app`
    *   **Runtime**: Python 3.11.0

### 2. Deploy Frontend di Vercel.com
*   Masuk ke [Vercel.com](https://vercel.com) dan impor repositori yang sama.
*   Vercel akan mendeteksi framework Vite secara otomatis.
*   Masukkan seluruh variabel lingkungan (`VITE_API_URL` dan konfigurasi Firebase) pada menu **Environment Variables** sebelum melakukan deploy.
*   Routing SPA akan otomatis berjalan sempurna berkat konfigurasi `vercel.json` yang tersedia.
