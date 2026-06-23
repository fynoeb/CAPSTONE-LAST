import { analisisGizi } from './gizi';

export interface PredictRequest {
  usia_bulan: number;
  jk: number;
  berat: number;
  tinggi: number;
  bb_lahir?: number;
  tb_lahir?: number;
  cara_ukur?: number;
  lila?: number;
  naik_bb?: number;
  jml_vit_a?: number;
  kpsp?: number;
  kia?: number;
  kelas_ibu?: number;
  mbg?: number;
  detail?: number;
}

export interface PredictResponse {
  pesan: string;
  perhitungan_who: {
    bb_per_u: string;
    tb_per_u: string;
    bb_per_tb: string;
  };
  rekomendasi_ai: {
    kategori: string;
    saran_tindak_lanjut: string[];
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export async function predictGizi(data: PredictRequest): Promise<PredictResponse> {
  if (API_BASE_URL) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 800);

      const response = await fetch(`${API_BASE_URL}/api/analisa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        if (result && result.perhitungan_who && result.rekomendasi_ai) {
          return result;
        }
      }
      console.warn(`API responded with status ${response.status}, falling back to local analysis`);
    } catch (error) {
      console.warn('API connection slow, timed out, or failed. Falling back to offline client-side analysis:', error);
    }
  }
  return Promise.resolve(analisisGizi(data));
}
