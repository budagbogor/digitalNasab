import { useState, useRef } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { Download, Upload, AlertCircle, CheckCircle2, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { UserRole } from '../types';

interface ExcelRow {
  'Nama Lengkap': string;
  'Jenis Kelamin': 'L' | 'P';
  'Status': 'Hidup' | 'Wafat';
  'Tanggal Lahir'?: string;
  'Tanggal Wafat'?: string;
  'Telepon'?: string;
  'Alamat'?: string;
  'Pekerjaan'?: string;
  'Pendidikan'?: string;
  'Bio'?: string;
  'Nama Ayah'?: string;
  'Nama Ibu'?: string;
  'Nama Pasangan'?: string;
}

export default function ExcelImport({ userId, currentUserRole, isCompact = false }: { userId: string, currentUserRole: UserRole, isCompact?: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = currentUserRole === 'admin';

  const downloadTemplate = () => {
    // ... (logic sama, tidak berubah)
    const templateData = [
      {
        'Nama Lengkap': 'BUDI SANTOSO',
        'Jenis Kelamin': 'L',
        'Status': 'Hidup',
        'Tanggal Lahir': '1985-05-20',
        'Tanggal Wafat': '-',
        'Telepon': '08123456789',
        'Alamat': 'Jl. Melati No. 5, Jakarta',
        'Pekerjaan': 'PNS',
        'Pendidikan': 'S1 Hukum',
        'Bio': 'Anak pertama dari keluarga Santoso.',
        'Nama Ayah': 'SANTOSO WIDODO',
        'Nama Ibu': 'SITI AMINAH',
        'Nama Pasangan': 'SARI DEWI'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Silsilah");
    XLSX.writeFile(workbook, "Template_Silsilah_Keluarga.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... logic upload tetap sama
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      setIsLoading(true);
      setMessage({ text: 'Membaca file Excel...', type: '' });
      
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (!data || data.length === 0) {
          throw new Error('File kosong atau format kolom tidak sesuai.');
        }

        const nameToIdMap = new Map<string, string>();
        const tempMembers: any[] = [];

        data.forEach((row: any) => {
          const name = row['Nama Lengkap']?.toString().trim().toUpperCase();
          if (name && !nameToIdMap.has(name)) {
            nameToIdMap.set(name, crypto.randomUUID());
          }
        });

        const processedNames = new Set<string>();
        for (const row of data) {
          const fullName = row['Nama Lengkap']?.toString().trim().toUpperCase();
          if (!fullName || processedNames.has(fullName)) continue;

          processedNames.add(fullName);
          const id = nameToIdMap.get(fullName) || crypto.randomUUID();
          const genderInput = row['Jenis Kelamin']?.toString().trim().toUpperCase();
          const statusInput = row['Status']?.toString().trim().toUpperCase();

          const fatherName = row['Nama Ayah']?.toString().trim().toUpperCase();
          const motherName = row['Nama Ibu']?.toString().trim().toUpperCase();
          const spouseName = row['Nama Pasangan']?.toString().trim().toUpperCase();

          tempMembers.push({
            id,
            fullName,
            gender: genderInput === 'P' ? 'female' : 'male',
            isAlive: statusInput !== 'WAFAT',
            birthDate: row['Tanggal Lahir'] && row['Tanggal Lahir'] !== '-' ? String(row['Tanggal Lahir']) : '',
            deathDate: row['Tanggal Wafat'] && row['Tanggal Wafat'] !== '-' ? String(row['Tanggal Wafat']) : '',
            phone: row['Telepon'] && row['Telepon'] !== '-' ? String(row['Telepon']) : '',
            address: row['Alamat'] && row['Alamat'] !== '-' ? String(row['Alamat']) : '',
            occupation: row['Pekerjaan'] && row['Pekerjaan'] !== '-' ? String(row['Pekerjaan']) : '',
            education: row['Pendidikan'] && row['Pendidikan'] !== '-' ? String(row['Pendidikan']) : '',
            bio: row['Bio'] && row['Bio'] !== '-' ? String(row['Bio']) : '',
            parentId: fatherName && nameToIdMap.has(fatherName) ? nameToIdMap.get(fatherName) : null,
            motherId: motherName && nameToIdMap.has(motherName) ? nameToIdMap.get(motherName) : null,
            spouseId: spouseName && nameToIdMap.has(spouseName) ? nameToIdMap.get(spouseName) : null,
            photoUrl: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }

        if (tempMembers.length === 0) throw new Error('Tidak ada data valid untuk diimpor.');

        const client = getSupabaseClient();
        const { error: insertError } = await client
          .from('family_members')
          .upsert(tempMembers, { onConflict: 'id' });

        if (insertError) throw insertError;

        setMessage({ text: `Berhasil mengimpor ${tempMembers.length} anggota keluarga!`, type: 'success' });
        if (fileInputRef.current) fileInputRef.current.value = '';
        
      } catch (err: any) {
        console.error('Import Error:', err);
        const errorMsg = err.message || err.details || 'Terjadi kesalahan sistem';
        setMessage({ text: `Gagal: ${errorMsg}`, type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className={`flex items-center ${isCompact ? 'gap-1' : 'flex-col sm:flex-row gap-2'}`}>
      <button
        onClick={downloadTemplate}
        className={`flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20 shadow-sm ${
          isCompact ? 'px-2 py-1.5 text-[10px]' : 'px-4 py-2 text-sm font-medium'
        }`}
        title="Download Template Excel"
      >
        <Download className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} text-emerald-400`} />
        {!isCompact && <span>Template Excel</span>}
      </button>

      {isAdmin && (
        <div className="relative">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className={`flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors border border-emerald-500 shadow-sm disabled:opacity-50 ${
              isCompact ? 'px-2 py-1.5 text-[10px]' : 'px-4 py-2 text-sm font-medium'
            }`}
            title="Import File Excel"
          >
            {isLoading ? (
              <div className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} border-2 border-white/30 border-t-white rounded-full animate-spin`} />
            ) : (
              <Upload className={isCompact ? 'w-3 h-3' : 'w-4 h-4'} />
            )}
            {!isCompact && <span>{isLoading ? 'Impor...' : 'Import Excel'}</span>}
          </button>
        </div>
      )}

      {message.text && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300 ${
          message.type === 'success' ? 'bg-emerald-600 text-white' : 
          message.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'
        }`}>
          {message.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
          {message.type === 'error' && <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{message.text}</span>
          <button 
            onClick={() => setMessage({ text: '', type: '' })}
            className="ml-2 hover:bg-white/20 p-1 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
