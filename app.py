from flask import Flask, request, jsonify
import joblib
import pandas as pd
import numpy as np
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://*.vercel.app"
]}})

try:
    model_rf = joblib.load('model_rf_gizi.pkl')
    print("Model AI berhasil dimuat")
except Exception as e:
    print(f"Gagal memuat model: {e}")

def interpolate_lms(x, xp, fp_sd_neg1, fp_median, fp_sd_pos1):
    if x <= xp[0]:
        return fp_sd_neg1[0], fp_median[0], fp_sd_pos1[0]
    if x >= xp[-1]:
        return fp_sd_neg1[-1], fp_median[-1], fp_sd_pos1[-1]
    
    for i in range(len(xp) - 1):
        if xp[i] <= x <= xp[i+1]:
            x0, x1 = xp[i], xp[i+1]
            t = (x - x0) / (x1 - x0)
            
            sd_neg1 = fp_sd_neg1[i] + t * (fp_sd_neg1[i+1] - fp_sd_neg1[i])
            median = fp_median[i] + t * (fp_median[i+1] - fp_median[i])
            sd_pos1 = fp_sd_pos1[i] + t * (fp_sd_pos1[i+1] - fp_sd_pos1[i])
            
            return sd_neg1, median, sd_pos1
    return fp_sd_neg1[0], fp_median[0], fp_sd_pos1[0]

def hitung_zscore_who(usia_bulan, jk, berat, tinggi):
    age_xp = [0, 3, 6, 9, 12, 15, 18, 21, 24, 30, 36, 42, 48, 54, 60]
    
    if jk == 1:
        bbu_sd_neg1 = [2.9, 5.7, 7.1, 8.0, 8.6, 9.2, 9.8, 10.3, 10.8, 11.8, 12.7, 13.6, 14.4, 15.2, 16.0]
        bbu_median  = [3.3, 6.4, 7.9, 8.9, 9.6, 10.3, 10.9, 11.5, 12.2, 13.3, 14.3, 15.3, 16.3, 17.3, 18.3]
        bbu_sd_pos1  = [3.9, 7.2, 8.9, 10.1, 10.8, 11.5, 12.2, 12.9, 13.6, 15.0, 16.2, 17.4, 18.5, 19.7, 21.0]
    else:
        bbu_sd_neg1 = [2.8, 5.2, 6.5, 7.4, 7.9, 8.5, 9.1, 9.6, 10.1, 11.1, 12.1, 13.0, 14.0, 14.9, 15.8]
        bbu_median  = [3.2, 5.8, 7.3, 8.2, 8.9, 9.6, 10.2, 10.9, 11.5, 12.7, 13.9, 15.0, 16.1, 17.2, 18.2]
        bbu_sd_pos1  = [3.7, 6.6, 8.2, 9.3, 10.1, 10.9, 11.7, 12.4, 13.0, 14.4, 15.8, 17.2, 18.5, 19.9, 21.2]
        
    sd_neg1, median, sd_pos1 = interpolate_lms(usia_bulan, age_xp, bbu_sd_neg1, bbu_median, bbu_sd_pos1)
    if berat < median:
        zs_bbu = (berat - median) / (median - sd_neg1)
    else:
        zs_bbu = (berat - median) / (sd_pos1 - median)
        
    if jk == 1:
        tbu_sd_neg1 = [48.0, 59.4, 65.5, 70.1, 73.4, 76.6, 79.6, 82.3, 84.8, 89.2, 93.0, 96.4, 99.5, 102.5, 105.3]
        tbu_median  = [49.9, 61.4, 67.6, 72.3, 75.7, 79.1, 82.3, 85.1, 87.8, 92.2, 96.1, 99.9, 103.3, 106.7, 110.0]
        tbu_sd_pos1  = [51.8, 63.5, 69.8, 74.6, 78.1, 81.5, 85.0, 88.0, 90.9, 95.3, 99.3, 103.3, 106.9, 110.4, 113.8]
    else:
        tbu_sd_neg1 = [47.2, 58.0, 64.0, 68.4, 71.8, 75.0, 77.8, 80.6, 83.2, 87.8, 91.8, 95.3, 98.4, 101.4, 104.2]
        tbu_median  = [49.1, 59.8, 65.7, 70.1, 74.0, 77.2, 80.2, 83.0, 86.4, 91.0, 95.1, 99.0, 102.7, 106.2, 109.4]
        tbu_sd_pos1  = [51.0, 61.7, 68.0, 72.6, 76.2, 79.5, 82.8, 85.8, 88.8, 93.8, 98.2, 102.2, 106.2, 110.0, 113.1]
        
    sd_neg1_t, median_t, sd_pos1_t = interpolate_lms(usia_bulan, age_xp, tbu_sd_neg1, tbu_median, tbu_sd_pos1)
    if tinggi < median_t:
        zs_tbu = (tinggi - median_t) / (median_t - sd_neg1_t)
    else:
        zs_tbu = (tinggi - median_t) / (sd_pos1_t - median_t)
        
    height_xp = [45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120]
    
    if jk == 1:
        bbtb_sd_neg1 = [2.2, 3.0, 4.0, 5.2, 6.4, 7.6, 8.6, 9.6, 10.5, 11.5, 12.6, 13.7, 14.9, 16.3, 17.8, 19.5]
        bbtb_median  = [2.4, 3.3, 4.4, 5.7, 7.0, 8.2, 9.4, 10.5, 11.5, 12.6, 13.7, 15.0, 16.4, 18.0, 19.7, 21.6]
        bbtb_sd_pos1  = [2.7, 3.7, 4.9, 6.2, 7.6, 9.0, 10.3, 11.5, 12.6, 13.8, 15.1, 16.5, 18.0, 19.8, 21.8, 24.1]
    else:
        bbtb_sd_neg1 = [2.2, 3.0, 3.9, 5.0, 6.1, 7.2, 8.2, 9.2, 10.1, 11.0, 12.1, 13.2, 14.4, 15.8, 17.4, 19.1]
        bbtb_median  = [2.4, 3.3, 4.3, 5.5, 6.7, 7.9, 9.0, 10.1, 11.1, 12.1, 13.3, 14.6, 15.9, 17.5, 19.3, 21.3]
        bbtb_sd_pos1  = [2.7, 3.7, 4.8, 6.1, 7.4, 8.7, 9.9, 11.1, 12.2, 13.3, 14.7, 16.1, 17.7, 19.5, 21.5, 23.8]
        
    sd_neg1_h, median_h, sd_pos1_h = interpolate_lms(tinggi, height_xp, bbtb_sd_neg1, bbtb_median, bbtb_sd_pos1)
    if berat < median_h:
        zs_bbtb = (berat - median_h) / (median_h - sd_neg1_h)
    else:
        zs_bbtb = (berat - median_h) / (sd_pos1_h - median_h)
        
    return round(float(zs_bbu), 2), round(float(zs_tbu), 2), round(float(zs_bbtb), 2)

def tentukan_kategori_gizi(zs_bbu, zs_tbu, zs_bbtb):
    if zs_bbu < -3: status_bbu = "Berat Badan Sangat Kurang"
    elif -3 <= zs_bbu < -2: status_bbu = "Berat Badan Kurang"
    elif -2 <= zs_bbu <= 1: status_bbu = "Berat Badan Normal"
    else: status_bbu = "Risiko Berat Badan Lebih"

    if zs_tbu < -3: status_tbu = "Sangat Pendek (Severely Stunted)"
    elif -3 <= zs_tbu < -2: status_tbu = "Pendek (Stunted)"
    elif -2 <= zs_tbu <= 3: status_tbu = "Normal"
    else: status_tbu = "Tinggi"

    if zs_bbtb < -3: status_bbtb = "Gizi Buruk"
    elif -3 <= zs_bbtb < -2: status_bbtb = "Gizi Kurang"
    elif -2 <= zs_bbtb <= 1: status_bbtb = "Gizi Baik"
    elif 1 < zs_bbtb <= 2: status_bbtb = "Berisiko Gizi Lebih"
    elif 2 < zs_bbtb <= 3: status_bbtb = "Gizi Lebih"
    else: status_bbtb = "Obesitas"

    return status_bbu, status_tbu, status_bbtb

def get_recommendation(label):
    recommendations = {
        'Intervensi Gizi Intensif': ['Telur', 'Ikan', 'Susu tinggi protein', 'Vitamin zinc', 'Kontrol 2 minggu'],
        'Tinggi Protein dan Energi': ['Daging', 'Tempe', 'Susu', 'Makan 3x sehari'],
        'Pencegahan Stunting Intensif': ['Rujuk ke Puskesmas/Dokter Anak', 'Berikan terapi gizi medis', 'Pantau tinggi badan setiap bulan'],
        'Pencegahan Stunting': ['Protein hewani minimal 1 porsi per hari', 'Vitamin A', 'Pantau tinggi badan'],
        'Pemulihan Berat Badan Intensif': ['Berikan F100/F75 (sesuai arahan medis)', 'Pemberian Makanan Tambahan (PMT)', 'Cek infeksi penyerta'],
        'Tinggi Kalori': ['Karbohidrat tambahan', 'Susu tinggi kalori', 'Biskuit MPASI'],
        'Edukasi Pola Makan': ['Kurangi jajanan manis', 'Perbanyak sayur dan buah', 'Aktivitas fisik ringan'],
        'Pengendalian Berat Badan': ['Diet gizi seimbang', 'Batasi makanan yang digoreng', 'Perbanyak minum air putih'],
        'Intervensi Obesitas': ['Konsultasi ke Ahli Gizi', 'Diet rendah kalori', 'Aktivitas fisik intens (bermain aktif)'],
        'Pertahankan Gizi': ['Lanjut pola makan sehat', 'Lanjutkan stimulasi tumbuh kembang']
    }
    return recommendations.get(label, ['Tidak ada rekomendasi spesifik, silakan konsultasi ke Bidan/Dokter.'])

@app.route('/api/analisa', methods=['POST'])
def analisa_gizi():
    try:
        data = request.json
        usia_bulan = float(data.get('usia_bulan'))
        jk = int(data.get('jk')) 
        berat = float(data.get('berat'))
        tinggi = float(data.get('tinggi'))
        
        zs_bbu, zs_tbu, zs_bbtb = hitung_zscore_who(usia_bulan, jk, berat, tinggi)
        status_bbu, status_tbu, status_bbtb = tentukan_kategori_gizi(zs_bbu, zs_tbu, zs_bbtb)
        
        input_data = pd.DataFrame([{
            'JK': jk,
            'BB Lahir': data.get('bb_lahir', 3.0), 
            'TB Lahir': data.get('tb_lahir', 49.0),
            'Berat': berat,
            'Tinggi': tinggi,
            'Cara Ukur': data.get('cara_ukur', 0),
            'LiLA': data.get('lila', 0.0),
            'Naik Berat Badan': data.get('naik_bb', 1),
            'Jml Vit A': data.get('jml_vit_a', 1.0),
            'KPSP': data.get('kpsp', 0),
            'KIA': data.get('kia', 0),
            'Kelas Ibu Balita': data.get('kelas_ibu', 0),
            'MBG': data.get('mbg', 0),
            'Detail': data.get('detail', 0),
            'usia_bulan': usia_bulan
        }])

        prediksi_ai = "Pertahankan Gizi"
        try:
            if 'model_rf' in globals() and model_rf is not None:
                prediksi_ai = model_rf.predict(input_data)[0]
        except Exception as e:
            print(f"Error Prediksi AI: {e}")
            prediksi_ai = "Pertahankan Gizi"
            
        daftar_saran_detail = get_recommendation(prediksi_ai)

        if zs_bbtb < -3:
            prediksi_ai = "Peringatan Darurat: Segera Rujuk ke Faskes / Dokter Spesialis Anak"
            daftar_saran_detail = [
                "Peringatan Darurat: Segera Rujuk ke Faskes / Dokter Spesialis Anak (Darurat Gizi Buruk)",
                "Pemberian formula gizi terapeutik khusus (F75 / F100) sesuai pengawasan medis",
                "Periksakan kemungkinan penyakit penyerta atau infeksi kronis secara medis",
                "Pemberian Makanan Tambahan Pemulihan (PMT-P) kaya protein hewani",
                "Pemantauan antropometri intensif harian atau mingguan di posyandu atau faskes"
            ]
        elif zs_tbu < -3:
            prediksi_ai = "Peringatan Darurat: Segera Rujuk ke Faskes / Dokter Spesialis Anak"
            daftar_saran_detail = [
                "Peringatan Darurat: Segera Rujuk ke Faskes / Dokter Spesialis Anak (Darurat Sangat Pendek)",
                "Rujukan intervensi gizi spesifik medis dan terapi hormonal serta stimulasi pertumbuhan",
                "Pemberian asupan gizi padat energi dan tinggi zat besi, kalsium, serta zinc",
                "Edukasi pola hidup bersih, sanitasi layak, dan stimulasi motorik serta kognitif",
                "Pengukuran berkala tinggi badan secara kontinu untuk mengejar ketertinggalan"
            ]

        hasil_response = {
            "pesan": "Analisis Berhasil",
            "perhitungan_who": {
                "bb_per_u": status_bbu,
                "tb_per_u": status_tbu,
                "bb_per_tb": status_bbtb
            },
            "rekomendasi_ai": {
                "kategori": prediksi_ai,
                "saran_tindak_lanjut": list(daftar_saran_detail)
            }
        }
        return jsonify(hasil_response), 200
    except Exception as e:
        print(f"Error pada internal server: {e}")
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
