import { useState, useRef } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { Download, Upload, AlertCircle, CheckCircle2, X, Database } from 'lucide-react';
import * as XLSX from 'xlsx';
import { UserRole } from '../types';

export default function ExcelImport({ userId, currentUserRole, isCompact = false }: { userId: string, currentUserRole: UserRole, isCompact?: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = currentUserRole === 'admin';

  const downloadTemplate = () => {
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

  const exportDatabase = async () => {
    setIsLoading(true);
    setMessage({ text: 'Menyiapkan data ekspor...', type: '' });
    
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('family_members')
        .select('*');

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Tidak ada data untuk diekspor.');
      }

      // Map IDs to Names for human-readable relations
      const idToNameMap = new Map<string, string>();
      data.forEach(m => idToNameMap.set(m.id, m.fullName));

      const exportData = data.map(m => ({
        'ID': m.id,
        'Nama Lengkap': m.fullName,
        'Jenis Kelamin': m.gender === 'female' ? 'P' : 'L',
        'Status': m.isAlive ? 'Hidup' : 'Wafat',
        'Tanggal Lahir': m.birthDate || '-',
        'Tanggal Wafat': m.deathDate || '-',
        'Telepon': m.phone || '-',
        'Alamat': m.address || '-',
        'Pekerjaan': m.occupation || '-',
        'Pendidikan': m.education || '-',
        'Bio': m.bio || '-',
        'Nama Ayah': m.parentId ? idToNameMap.get(m.parentId) || '' : '',
        'Nama Ibu': m.motherId ? idToNameMap.get(m.motherId) || '' : '',
        'Nama Pasangan': m.spouseId ? idToNameMap.get(m.spouseId) || '' : ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Database Silsilah");
      XLSX.writeFile(workbook, `Database_Silsilah_${new Date().toISOString().split('T')[0]}.xlsx`);

      setMessage({ text: 'Database berhasil diekspor!', type: 'success' });
    } catch (err: any) {
      console.error('Export Error:', err);
      setMessage({ text: `Gagal: ${err.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      setIsLoading(true);
      setMessage({ text: 'Memproses file Excel...', type: '' });
      
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (!data || data.length === 0) {
          throw new Error('File tidak valid atau kosong.');
        }

        const client = getSupabaseClient();
        
        // Ambil data yang sudah ada untuk memetakan nama ke ID dan mencegah duplikat
        const { data: existingMembers } = await client.from('family_members').select('id, fullName');
        const nameToIdMap = new Map<string, string>();
        existingMembers?.forEach(m => nameToIdMap.set(m.fullName.toUpperCase(), m.id));

        // Tambahkan pemetaan dari ID Excel jika ada
        data.forEach((row: any) => {
          const excelId = row['ID']?.toString().trim();
          const name = row['Nama Lengkap']?.toString().trim().toUpperCase();
          if (excelId && name) {
            nameToIdMap.set(name, excelId);
          } else if (name && !nameToIdMap.has(name)) {
            nameToIdMap.set(name, crypto.randomUUID());
          }
        });

        const tempMembers: any[] = [];
        const processedIds = new Set<string>();

        for (const row of data) {
          const fullName = row['Nama Lengkap']?.toString().trim().toUpperCase();
          if (!fullName) continue;

          // Prioritaskan ID dari file Excel (untuk edit)
          const id = row['ID']?.toString().trim() || nameToIdMap.get(fullName) || crypto.randomUUID();
          
          if (processedIds.has(id)) continue;
          processedIds.add(id);

          const genderInput = row['Jenis Kelamin']?.toString().trim().toUpperCase();
          const statusInput = row['Status']?.toString().trim().toUpperCase();
          const fatherName = row['Nama Ayah']?.toString().trim().toUpperCase();
          const motherName = row['Nama Ibu']?.toString().trim().toUpperCase();
          const spouseName = row['Nama Pasangan']?.toString().trim().toUpperCase();

          tempMembers.push({
            id,
            fullName: row['Nama Lengkap']?.toString().trim(),
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
            updatedAt: new Date().toISOString()
          });
        }

        if (tempMembers.length === 0) throw new Error('Tidak ada data valid untuk diimpor.');

        const { error: upsertError } = await client
          .from('family_members')
          .upsert(tempMembers, { onConflict: 'id' });

        if (upsertError) throw upsertError;

        setMessage({ text: `Berhasil memproses ${tempMembers.length} data keluarga!`, type: 'success' });
        if (fileInputRef.current) fileInputRef.current.value = '';
        
      } catch (err: any) {
        console.error('Import Error:', err);
        setMessage({ text: `Gagal Impor: ${err.message}`, type: 'error' });
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
        {!isCompact && <span>Template</span>}
      </button>

      {isAdmin && (
        <>
          <button
            onClick={exportDatabase}
            disabled={isLoading}
            className={`flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20 shadow-sm disabled:opacity-50 ${
              isCompact ? 'px-2 py-1.5 text-[10px]' : 'px-4 py-2 text-sm font-medium'
            }`}
            title="Export Database ke Excel"
          >
            <Database className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} text-amber-400`} />
            {!isCompact && <span>Ekspor Data</span>}
          </button>

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
              {!isCompact && <span>{isLoading ? 'Memproses...' : 'Impor Excel'}</span>}
            </button>
          </div>
        </>
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
