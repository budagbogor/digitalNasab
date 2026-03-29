# 🌳 Digital - Silsilah Keluarga Iman Diharjo

![Digital Nasab Banner](https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=1200&h=400)

**Digital Nasab** adalah platform manajemen silsilah keluarga modern yang dirancang khusus untuk Keluarga Besar **Iman Diharjo**. Aplikasi ini menggabungkan tradisi pencatatan nasab dengan teknologi cloud mutakhir untuk memastikan warisan keluarga tetap terjaga, terorganisir, dan mudah diakses oleh generasi mendatang.

---

## ✨ Fitur Utama

- **🌿 Interactive Tree View**: Visualisasi pohon keluarga yang dinamis dengan sistem navigasi *smooth zoom* dan *drag*.
- **📊 Statistik Keluarga**: Analisis data demografi keluarga (jumlah anggota hidup/wafat, perbandingan gender, dan sebaran pekerjaan).
- **📋 Direktori Digital**: Daftar anggota keluarga yang dapat dicari dan difilter dengan cepat berdasarkan nama atau status.
- **💬 Forum Keluarga**: Ruang komunikasi antar anggota keluarga untuk berbagi kabar dan pengumuman.
- **🛡️ Manajemen Akses**: Sistem peran (*Admin* & *Viewer*) untuk menjaga keamanan data sensitif keluarga.
- **📥 Excel Import/Export**: Kemudahan migrasi data massal melalui format Excel yang terstandarisasi.
- **🕌 Desain Premium & Islami**: Antarmuka mewah berbasis *Emerald & Amber* dengan tipografi Arab yang estetik.

---

## 🚀 Teknologi yang Digunakan

- **Frontend**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **State Management**: React Context API
- **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + Realtime Sync)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🛠️ Panduan Instalasi Lokal

1. **Clone Repositori**:
   ```bash
   git clone https://github.com/budagbogor/silsilah-iman-diharjo.git
   cd silsilah-iman-diharjo
   ```

2. **Instal Dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Lingkungan**:
   Aplikasi ini menggunakan sistem pengaturan dinamis. Anda dapat memasukkan `Supabase URL` dan `Anon Key` langsung melalui menu **Settings** di pojok kanan atas aplikasi setelah dijalankan.

4. **Jalankan Aplikasi**:
   ```bash
   npm run dev
   ```
   Akses di: `http://localhost:3000`

---

## 📂 Struktur Proyek

```text
src/
├── components/      # Komponen UI utama (TreeView, Modals, Views)
├── contexts/        # Pengaturan Global (SettingsContext)
├── lib/             # Konfigurasi library eksternal (Supabase)
├── types.ts         # Definisi tipe data TypeScript global
└── App.tsx          # Entry point aplikasi & Routing sederhana
```

---

## 🚢 Panduan Deployment Vercel

Aplikasi ini telah dioptimasi untuk **Vercel**. Pastikan Anda:
1. Menghubungkan repositori ini ke Vercel Dashboard.
2. Menggunakan **Vite** sebagai framework preset.
3. Konfigurasi `vercel.json` sudah tersedia di root untuk menangani SPA Routing.

---

## 🛡️ Keamanan & Lisensi

- Data keluarga bersifat **Privat**. Pastikan kredensial Supabase Anda tidak disebarluaskan.
- Dikembangkan dengan 💚 oleh Tim **Antigravity AI**.

&copy; 2026 Digital Nasab Authority. Semuanya Terjaga.
