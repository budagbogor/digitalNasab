# 🛠️ Arsitektur & Struktur Teknis - Digital Nasab

Dokumen ini menjelaskan struktur internal aplikasi **Digital Nasab** untuk pengembang dan pemelihara di masa depan.

---

## 🏗️ Struktur Folder Utama

| Folder | Deskripsi |
| :--- | :--- |
| `/src/components` | Berisi seluruh komponen UI. Setiap fitur utama memiliki "View" sendiri (misal: `TreeView.tsx`, `StatsView.tsx`). |
| `/src/contexts` | Tempat state management global. `SettingsContext.tsx` menyimpan kredensial Supabase secara persisten di LocalStorage. |
| `/src/lib` | Inisialisasi library pihak ketiga. `supabase.ts` menyediakan helper `getSupabaseClient()` yang aman dan reaktif. |
| `/public` | Aset statis seperti logo, favicon, dan gambar latar belakang (jika ada). |

---

## 🧱 Komponen Inti (Core Components)

### 1. `TreeView.tsx`
- Menggunakan library **@xyflow/react** untuk merender diagram pohon.
- Logika posisi otomatis menggunakan **Dagre** (Directed Graph Layout).
- Mendukung klik pada node untuk melihat profil detail.

### 2. `StatsView.tsx`
- Menggunakan **Recharts** untuk visualisasi data.
- Menghitung statistik secara dinamis dari array `members` yang diterima dari `App.tsx`.

### 3. `ExcelImport.tsx`
- Menggunakan **XLSX (SheetJS)** untuk parsing file Excel.
- Mendukung fitur "isCompact" agar bisa tampil ramping di header admin.
- Melakukan pembersihan data otomatis (trim, uppercase) sebelum push ke database.

### 4. `Auth.tsx`
- Menangani Login/Registrasi via Supabase Auth.
- Memiliki logika "Admin Whitelist" yang secara otomatis memberikan peran admin pada email tertentu.

---

## 🔄 Alur Data (Data Flow)

1. **Inisialisasi**: `App.tsx` mengecek sesi pengguna melalui `useSettings()`.
2. **Koneksi**: `lib/supabase.ts` membaca API Key dari context untuk membuat koneksi reaktif.
3. **Sinkronisasi Realtime**:
   - Menggunakan `supabase.channel()` untuk mendengarkan perubahan pada tabel `family_members`.
   - Update data di satu perangkat akan langsung merefleksikan perubahan di seluruh perangkat pengguna lain tanpa refresh.
4. **Keamanan**: Peran pengguna (`viewer` atau `admin`) diambil dari tabel `users` untuk membatasi akses tombol edit/hapus.

---

## 📦 Dependensi Kunci

- **Vite 6**: Builder super cepat untuk pengembangan modern.
- **Lucide React**: Set ikon bergaya minimalis dan elegan.
- **Motion (Framer Motion)**: Animasi transisi antar halaman dan modal yang halus.

---

&copy; 2026 Digital Nasab Documentation.
