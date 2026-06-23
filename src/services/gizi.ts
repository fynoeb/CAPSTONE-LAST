import { PredictRequest, PredictResponse } from './api';

function interpolateLMS(
  x: number,
  xp: number[],
  fpNeg1: number[],
  fpMedian: number[],
  fpPos1: number[]
): [number, number, number] {
  if (x <= xp[0]) return [fpNeg1[0], fpMedian[0], fpPos1[0]];
  if (x >= xp[xp.length - 1]) return [fpNeg1[xp.length - 1], fpMedian[xp.length - 1], fpPos1[xp.length - 1]];
  for (let i = 0; i < xp.length - 1; i++) {
    if (xp[i] <= x && x <= xp[i + 1]) {
      const t = (x - xp[i]) / (xp[i + 1] - xp[i]);
      return [
        fpNeg1[i] + t * (fpNeg1[i + 1] - fpNeg1[i]),
        fpMedian[i] + t * (fpMedian[i + 1] - fpMedian[i]),
        fpPos1[i] + t * (fpPos1[i + 1] - fpPos1[i]),
      ];
    }
  }
  return [fpNeg1[0], fpMedian[0], fpPos1[0]];
}

function hitungZscoreWHO(
  usiaBulan: number,
  jk: number,
  berat: number,
  tinggi: number
): { zsBbu: number; zsTbu: number; zsBbtb: number } {
  const ageXp = [0, 3, 6, 9, 12, 15, 18, 21, 24, 30, 36, 42, 48, 54, 60];

  const bbuNeg1 = jk === 1
    ? [2.9, 5.7, 7.1, 8.0, 8.6, 9.2, 9.8, 10.3, 10.8, 11.8, 12.7, 13.6, 14.4, 15.2, 16.0]
    : [2.8, 5.2, 6.5, 7.4, 7.9, 8.5, 9.1, 9.6, 10.1, 11.1, 12.1, 13.0, 14.0, 14.9, 15.8];
  const bbuMed = jk === 1
    ? [3.3, 6.4, 7.9, 8.9, 9.6, 10.3, 10.9, 11.5, 12.2, 13.3, 14.3, 15.3, 16.3, 17.3, 18.3]
    : [3.2, 5.8, 7.3, 8.2, 8.9, 9.6, 10.2, 10.9, 11.5, 12.7, 13.9, 15.0, 16.1, 17.2, 18.2];
  const bbuPos1 = jk === 1
    ? [3.9, 7.2, 8.9, 10.1, 10.8, 11.5, 12.2, 12.9, 13.6, 15.0, 16.2, 17.4, 18.5, 19.7, 21.0]
    : [3.7, 6.6, 8.2, 9.3, 10.1, 10.9, 11.7, 12.4, 13.0, 14.4, 15.8, 17.2, 18.5, 19.9, 21.2];

  const [sdNeg1Bbu, medBbu, sdPos1Bbu] = interpolateLMS(usiaBulan, ageXp, bbuNeg1, bbuMed, bbuPos1);
  const zsBbu = berat < medBbu
    ? (berat - medBbu) / (medBbu - sdNeg1Bbu)
    : (berat - medBbu) / (sdPos1Bbu - medBbu);

  const tbuNeg1 = jk === 1
    ? [48.0, 59.4, 65.5, 70.1, 73.4, 76.6, 79.6, 82.3, 84.8, 89.2, 93.0, 96.4, 99.5, 102.5, 105.3]
    : [47.2, 58.0, 64.0, 68.4, 71.8, 75.0, 77.8, 80.6, 83.2, 87.8, 91.8, 95.3, 98.4, 101.4, 104.2];
  const tbuMed = jk === 1
    ? [49.9, 61.4, 67.6, 72.3, 75.7, 79.1, 82.3, 85.1, 87.8, 92.2, 96.1, 99.9, 103.3, 106.7, 110.0]
    : [49.1, 59.8, 65.7, 70.1, 74.0, 77.2, 80.2, 83.0, 86.4, 91.0, 95.1, 99.0, 102.7, 106.2, 109.4];
  const tbuPos1 = jk === 1
    ? [51.8, 63.5, 69.8, 74.6, 78.1, 81.5, 85.0, 88.0, 90.9, 95.3, 99.3, 103.3, 106.9, 110.4, 113.8]
    : [51.0, 61.7, 68.0, 72.6, 76.2, 79.5, 82.8, 85.8, 88.8, 93.8, 98.2, 102.2, 106.2, 110.0, 113.1];

  const [sdNeg1Tbu, medTbu, sdPos1Tbu] = interpolateLMS(usiaBulan, ageXp, tbuNeg1, tbuMed, tbuPos1);
  const zsTbu = tinggi < medTbu
    ? (tinggi - medTbu) / (medTbu - sdNeg1Tbu)
    : (tinggi - medTbu) / (sdPos1Tbu - medTbu);

  const heightXp = [45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120];
  const bbtbNeg1 = jk === 1
    ? [2.2, 3.0, 4.0, 5.2, 6.4, 7.6, 8.6, 9.6, 10.5, 11.5, 12.6, 13.7, 14.9, 16.3, 17.8, 19.5]
    : [2.2, 3.0, 3.9, 5.0, 6.1, 7.2, 8.2, 9.2, 10.1, 11.0, 12.1, 13.2, 14.4, 15.8, 17.4, 19.1];
  const bbtbMed = jk === 1
    ? [2.4, 3.3, 4.4, 5.7, 7.0, 8.2, 9.4, 10.5, 11.5, 12.6, 13.7, 15.0, 16.4, 18.0, 19.7, 21.6]
    : [2.4, 3.3, 4.3, 5.5, 6.7, 7.9, 9.0, 10.1, 11.1, 12.1, 13.3, 14.6, 15.9, 17.5, 19.3, 21.3];
  const bbtbPos1 = jk === 1
    ? [2.7, 3.7, 4.9, 6.2, 7.6, 9.0, 10.3, 11.5, 12.6, 13.8, 15.1, 16.5, 18.0, 19.8, 21.8, 24.1]
    : [2.7, 3.7, 4.8, 6.1, 7.4, 8.7, 9.9, 11.1, 12.2, 13.3, 14.7, 16.1, 17.7, 19.5, 21.5, 23.8];

  const [sdNeg1Bbtb, medBbtb, sdPos1Bbtb] = interpolateLMS(tinggi, heightXp, bbtbNeg1, bbtbMed, bbtbPos1);
  const zsBbtb = berat < medBbtb
    ? (berat - medBbtb) / (medBbtb - sdNeg1Bbtb)
    : (berat - medBbtb) / (sdPos1Bbtb - medBbtb);

  return {
    zsBbu: Math.round(zsBbu * 100) / 100,
    zsTbu: Math.round(zsTbu * 100) / 100,
    zsBbtb: Math.round(zsBbtb * 100) / 100,
  };
}

function tentukanKategoriGizi(zsBbu: number, zsTbu: number, zsBbtb: number) {
  let statusBbu: string;
  if (zsBbu < -3) statusBbu = "Berat Badan Sangat Kurang";
  else if (zsBbu < -2) statusBbu = "Berat Badan Kurang";
  else if (zsBbu <= 1) statusBbu = "Berat Badan Normal";
  else statusBbu = "Risiko Berat Badan Lebih";

  let statusTbu: string;
  if (zsTbu < -3) statusTbu = "Sangat Pendek (Severely Stunted)";
  else if (zsTbu < -2) statusTbu = "Pendek (Stunted)";
  else if (zsTbu <= 3) statusTbu = "Normal";
  else statusTbu = "Tinggi";

  let statusBbtb: string;
  if (zsBbtb < -3) statusBbtb = "Gizi Buruk";
  else if (zsBbtb < -2) statusBbtb = "Gizi Kurang";
  else if (zsBbtb <= 1) statusBbtb = "Gizi Baik";
  else if (zsBbtb <= 2) statusBbtb = "Berisiko Gizi Lebih";
  else if (zsBbtb <= 3) statusBbtb = "Gizi Lebih";
  else statusBbtb = "Obesitas";

  return { statusBbu, statusTbu, statusBbtb };
}

function getRecommendation(label: string): string[] {
  const map: Record<string, string[]> = {
    'Intervensi Gizi Intensif': ['Telur', 'Ikan', 'Susu tinggi protein', 'Vitamin zinc', 'Kontrol 2 minggu'],
    'Tinggi Protein dan Energi': ['Daging', 'Tempe', 'Susu', 'Makan 3x sehari'],
    'Pencegahan Stunting Intensif': ['Rujuk ke Puskesmas/Dokter Anak', 'Berikan terapi gizi medis', 'Pantau tinggi badan setiap bulan'],
    'Pencegahan Stunting': ['Protein hewani minimal 1 porsi per hari', 'Vitamin A', 'Pantau tinggi badan'],
    'Pemulihan Berat Badan Intensif': ['Berikan F100/F75 (sesuai arahan medis)', 'Pemberian Makanan Tambahan (PMT)', 'Cek infeksi penyerta'],
    'Tinggi Kalori': ['Karbohidrat tambahan', 'Susu tinggi kalori', 'Biskuit MPASI'],
    'Edukasi Pola Makan': ['Kurangi jajanan manis', 'Perbanyak sayur dan buah', 'Aktivitas fisik ringan'],
    'Pengendalian Berat Badan': ['Diet gizi seimbang', 'Batasi makanan yang digoreng', 'Perbanyak minum air putih'],
    'Intervensi Obesitas': ['Konsultasi ke Ahli Gizi', 'Diet rendah kalori', 'Aktivitas fisik intens (bermain aktif)'],
    'Pertahankan Gizi': ['Lanjut pola makan sehat', 'Lanjutkan stimulasi tumbuh kembang'],
  };
  return map[label] ?? ['Tidak ada rekomendasi spesifik, silakan konsultasi ke Bidan/Dokter.'];
}

function tentukanKategoriAI(zsBbu: number, zsTbu: number, zsBbtb: number): string {
  if (zsBbtb < -2) return 'Intervensi Gizi Intensif';
  if (zsBbtb >= -2 && zsBbtb < -1) return 'Pemulihan Berat Badan Intensif';
  if (zsTbu < -3) return 'Pencegahan Stunting Intensif';
  if (zsTbu >= -3 && zsTbu < -2) return 'Pencegahan Stunting';
  if (zsBbtb > 2) return 'Intervensi Obesitas';
  if (zsBbtb > 1) return 'Pengendalian Berat Badan';
  return 'Pertahankan Gizi';
}

export function analisisGizi(data: PredictRequest): PredictResponse {
  const { zsBbu, zsTbu, zsBbtb } = hitungZscoreWHO(
    data.usia_bulan, data.jk, data.berat, data.tinggi
  );
  const { statusBbu, statusTbu, statusBbtb } = tentukanKategoriGizi(zsBbu, zsTbu, zsBbtb);

  let kategori = tentukanKategoriAI(zsBbu, zsTbu, zsBbtb);
  let saran = getRecommendation(kategori);

  if (zsBbtb < -3) {
    kategori = 'Peringatan Darurat: Segera Rujuk ke Faskes / Dokter Spesialis Anak';
    saran = [
      'Peringatan Darurat: Segera Rujuk ke Faskes / Dokter Spesialis Anak (Darurat Gizi Buruk)',
      'Pemberian formula gizi terapeutik khusus (F75 / F100) sesuai pengawasan medis',
      'Periksakan kemungkinan penyakit penyerta atau infeksi kronis secara medis',
      'Pemberian Makanan Tambahan Pemulihan (PMT-P) kaya protein hewani',
      'Pemantauan antropometri intensif harian atau mingguan di posyandu atau faskes',
    ];
  } else if (zsTbu < -3) {
    kategori = 'Peringatan Darurat: Segera Rujuk ke Faskes / Dokter Spesialis Anak';
    saran = [
      'Peringatan Darurat: Segera Rujuk ke Faskes / Dokter Spesialis Anak (Darurat Sangat Pendek)',
      'Rujukan intervensi gizi spesifik medis dan terapi hormonal serta stimulasi pertumbuhan',
      'Pemberian asupan gizi padat energi dan tinggi zat besi, kalsium, serta zinc',
      'Edukasi pola hidup bersih, sanitasi layak, dan stimulasi motorik serta kognitif',
      'Pengukuran berkala tinggi badan secara kontinu untuk mengejar ketertinggalan',
    ];
  }

  return {
    pesan: 'Analisis Berhasil',
    perhitungan_who: {
      bb_per_u: statusBbu,
      tb_per_u: statusTbu,
      bb_per_tb: statusBbtb,
    },
    rekomendasi_ai: {
      kategori,
      saran_tindak_lanjut: saran,
    },
  };
}
