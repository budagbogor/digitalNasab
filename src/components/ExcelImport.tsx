import { useState, useRef } from 'react';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FileSpreadsheet, Download, Upload, AlertCircle, CheckCircle2, X } from 'lucide-react';
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

export default function ExcelImport({ userId, currentUserRole }: { userId: string, currentUserRole: UserRole }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = currentUserRole === 'admin';

  const downloadTemplate = () => {
    const templateData: ExcelRow[] = [
      {
        'Nama Lengkap': 'CONTOH NAMA LENGKAP',
        'Jenis Kelamin': 'L',
        'Status': 'Hidup',
        'Tanggal Lahir': '1980-01-01',
        'Tanggal Wafat': '-',
        'Telepon': '08123456789',
        'Alamat': 'Jl. Contoh No. 123',
        'Pekerjaan': 'Guru',
        'Pendidikan': 'S1',
        'Bio': 'Keterangan singkat mengenai anggota keluarga.',
        'Nama Ayah': '-',
        'Nama Ibu': '-',
        'Nama Pasangan': '-'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Silsilah");
    
    // Set column widths
    const wscols = [
      { wch: 30 }, // Nama Lengkap
      { wch: 15 }, // Jenis Kelamin
      { wch: 10 }, // Status
      { wch: 15 }, // Tanggal Lahir
      { wch: 15 }, // Tanggal Wafat
      { wch: 15 }, // Telepon
      { wch: 40 }, // Alamat
      { wch: 20 }, // Pekerjaan
      { wch: 15 }, // Pendidikan
      { wch: 50 }, // Bio
      { wch: 30 }, // Nama Ayah
      { wch: 30 }, // Nama Ibu
      { wch: 30 }, // Nama Pasangan
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, "Template_Silsilah_Keluarga.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      setIsLoading(true);
      setMessage({ text: 'Sedang memproses data...', type: '' });
      
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as ExcelRow[];

        if (data.length === 0) {
          throw new Error('File Excel kosong atau format tidak sesuai.');
        }

        // Create a map to store generated IDs for each person by their name
        const nameToIdMap = new Map<string, string>();
        const membersData: any[] = [];

        // First pass: generate IDs and basic data
        for (const row of data) {
          const id = doc(collection(db, 'members')).id;
          const rawFullName = row['Nama Lengkap'];
          const fullName = rawFullName ? String(rawFullName).trim().toUpperCase() : '';
          
          if (!fullName || fullName === '-' || fullName.includes('CONTOH NAMA')) continue;

          nameToIdMap.set(fullName, id);

          const gender = row['Jenis Kelamin'] === 'L' ? 'male' : row['Jenis Kelamin'] === 'P' ? 'female' : 'male';
          const isAlive = row['Status'] === 'Hidup';
          const birthDate = row['Tanggal Lahir'] && row['Tanggal Lahir'] !== '-' ? String(row['Tanggal Lahir']) : '';
          const deathDate = row['Tanggal Wafat'] && row['Tanggal Wafat'] !== '-' ? String(row['Tanggal Wafat']) : '';
          const phone = row['Telepon'] && row['Telepon'] !== '-' ? String(row['Telepon']) : '';
          const address = row['Alamat'] && row['Alamat'] !== '-' ? String(row['Alamat']) : '';
          const occupation = row['Pekerjaan'] && row['Pekerjaan'] !== '-' ? String(row['Pekerjaan']) : '';
          const education = row['Pendidikan'] && row['Pendidikan'] !== '-' ? String(row['Pendidikan']) : '';
          const bio = row['Bio'] && row['Bio'] !== '-' ? String(row['Bio']) : '';

          membersData.push({
            id,
            ownerId: userId,
            fullName,
            gender,
            isAlive,
            birthDate,
            deathDate,
            phone,
            address,
            occupation,
            education,
            bio,
            photoUrl: '',
            parentId: '',
            motherId: '',
            spouseId: '',
            rawFather: row['Nama Ayah'] ? String(row['Nama Ayah']).trim().toUpperCase() : '',
            rawMother: row['Nama Ibu'] ? String(row['Nama Ibu']).trim().toUpperCase() : '',
            rawSpouse: row['Nama Pasangan'] ? String(row['Nama Pasangan']).trim().toUpperCase() : '',
          });
        }

        // Second pass: resolve relationships and write to Firestore in batches
        const batches = [];
        let currentBatch = writeBatch(db);
        let operationCount = 0;

        for (const member of membersData) {
          // Resolve Father
          if (member.rawFather && member.rawFather !== '-') {
            member.parentId = nameToIdMap.get(member.rawFather) || '';
          }
          // Resolve Mother
          if (member.rawMother && member.rawMother !== '-') {
            member.motherId = nameToIdMap.get(member.rawMother) || '';
          }
          // Resolve Spouse
          if (member.rawSpouse && member.rawSpouse !== '-') {
            member.spouseId = nameToIdMap.get(member.rawSpouse) || '';
          }

          const docRef = doc(db, 'members', member.id);
          const { rawFather, rawMother, rawSpouse, ...cleanMember } = member;
          
          currentBatch.set(docRef, {
            ...cleanMember,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          operationCount++;
          if (operationCount === 450) {
            batches.push(currentBatch);
            currentBatch = writeBatch(db);
            operationCount = 0;
          }
        }

        if (operationCount > 0) {
          batches.push(currentBatch);
        }

        for (const batch of batches) {
          await batch.commit();
        }

        setMessage({ text: `Berhasil mengimpor ${membersData.length} anggota keluarga!`, type: 'success' });
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        console.error('Error importing excel:', error);
        setMessage({ text: `Gagal: ${error instanceof Error ? error.message : String(error)}`, type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <button
        onClick={downloadTemplate}
        className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200 shadow-sm"
        title="Download Template Excel"
      >
        <Download className="w-4 h-4 text-emerald-600" />
        <span>Template Excel</span>
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
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-emerald-500 shadow-sm disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Mengimpor...' : 'Import Excel'}</span>
          </button>
        </div>
      )}

      <p className="text-[10px] text-gray-500 mt-1 sm:mt-0 sm:ml-2 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        Gunakan template untuk hasil terbaik
      </p>

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
