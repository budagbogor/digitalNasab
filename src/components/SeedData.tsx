import { useState } from 'react';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { NewFamilyMember } from '../types';
import { Database, X } from 'lucide-react';

export default function SeedData({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState('');

  const handleSeed = async () => {
    setShowConfirm(false);
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch('/data.json?t=' + new Date().getTime());
      const data = await response.json();

      // Create a map to store generated IDs for each person by their name
      const nameToIdMap = new Map<string, string>();
      const membersData: any[] = [];

      // First pass: generate IDs and basic data
      for (const row of data) {
        const id = doc(collection(db, 'members')).id;
        const rawFullName = row['Nama Lengkap'];
        const fullName = rawFullName ? String(rawFullName).trim().toUpperCase() : '';
        if (!fullName || fullName === '-') continue;

        nameToIdMap.set(fullName, id);

        const gender = row['Jenis Kelamin'] === 'L' ? 'male' : row['Jenis Kelamin'] === 'P' ? 'female' : 'male'; // Default male if unknown
        const isAlive = row['Status'] === 'Hidup';
        const birthDate = row['Tanggal Lahir'] && row['Tanggal Lahir'] !== '-' ? String(row['Tanggal Lahir']) : '';
        const deathDate = row['Tanggal Wafat'] && row['Tanggal Wafat'] !== '-' ? String(row['Tanggal Wafat']) : '';
        const phone = row['Telepon'] && row['Telepon'] !== '-' ? String(row['Telepon']) : '';
        const address = row['Alamat'] && row['Alamat'] !== '-' ? String(row['Alamat']) : '';
        const bio = row['Bio'] && row['Bio'] !== '-' ? String(row['Bio']) : '';

        membersData.push({
          id,
          ownerId: userId,
          fullName: String(fullName),
          gender,
          isAlive,
          birthDate,
          deathDate,
          phone,
          address,
          bio,
          photoUrl: '',
          parentId: '',
          motherId: '',
          spouseId: '',
          rawParent: row['Nama Orang Tua'] ? String(row['Nama Orang Tua']).trim() : '',
          rawSpouse: row['Nama Pasangan'] ? String(row['Nama Pasangan']).trim() : '',
        });
      }

      // Second pass: resolve relationships and write to Firestore in batches
      const batches = [];
      let currentBatch = writeBatch(db);
      let operationCount = 0;

      for (const member of membersData) {
        if (member.rawParent && member.rawParent !== '-') {
          member.parentId = nameToIdMap.get(member.rawParent) || '';
        }
        if (member.rawSpouse && member.rawSpouse !== '-') {
          member.spouseId = nameToIdMap.get(member.rawSpouse) || '';
        }

        const docRef = doc(db, 'members', member.id);
        const { rawParent, rawSpouse, ...cleanMember } = member;
        currentBatch.set(docRef, {
          ...cleanMember,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        operationCount++;
        if (operationCount === 490) {
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

      setMessage('Data berhasil diimpor!');
    } catch (error) {
      console.error('Error seeding data:', error);
      setMessage(`Terjadi kesalahan: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isLoading}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-blue-500 shadow-sm disabled:opacity-50"
        title="Import Data Excel"
      >
        <Database className="w-4 h-4" />
        <span className="hidden sm:inline">{isLoading ? 'Mengimpor...' : 'Import Data'}</span>
      </button>

      {message && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {message}
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Konfirmasi Import</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin mengimpor data seed? Ini akan menambahkan banyak data ke database Anda.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSeed}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Ya, Import
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
