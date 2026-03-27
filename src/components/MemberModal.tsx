import { useState, useEffect } from 'react';
import { FamilyMember, NewFamilyMember } from '../types';
import { X, User } from 'lucide-react';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: NewFamilyMember | FamilyMember) => void;
  editingMember?: FamilyMember | null;
  members: FamilyMember[];
}

export default function MemberModal({ isOpen, onClose, onSave, editingMember, members }: MemberModalProps) {
  const [formData, setFormData] = useState<NewFamilyMember>({
    fullName: '',
    gender: 'male',
    isAlive: true,
    birthDate: '',
    deathDate: '',
    address: '',
    parentId: '',
    motherId: '',
    spouseId: '',
    photoUrl: '',
    phone: '',
    bio: '',
  });

  useEffect(() => {
    if (editingMember) {
      setFormData(editingMember);
    } else {
      setFormData({
        fullName: '',
        gender: 'male',
        isAlive: true,
        birthDate: '',
        deathDate: '',
        address: '',
        parentId: '',
        motherId: '',
        spouseId: '',
        photoUrl: '',
        phone: '',
        bio: '',
      });
    }
  }, [editingMember, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert("Ukuran file terlalu besar. Maksimal 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, photoUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editingMember ? { ...formData, id: editingMember.id, ownerId: editingMember.ownerId, createdAt: editingMember.createdAt, updatedAt: new Date() } : formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-emerald-100">
        <div className="sticky top-0 bg-white border-b border-emerald-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-emerald-900">
            {editingMember ? 'Edit Anggota Keluarga' : 'Tambah Anggota Keluarga'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nama Lengkap *</label>
              <input
                required
                type="text"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Fulan bin Fulan"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Jenis Kelamin</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="male">Laki-laki (Pria)</option>
                <option value="female">Perempuan (Wanita)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.isAlive ? 'alive' : 'deceased'}
                onChange={e => setFormData({ ...formData, isAlive: e.target.value === 'alive', deathDate: e.target.value === 'alive' ? '' : formData.deathDate })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="alive">Masih Hidup</option>
                <option value="deceased">Telah Wafat (Almarhum/ah)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tanggal Lahir</label>
              <input
                type="date"
                value={formData.birthDate || ''}
                onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {!formData.isAlive && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tanggal Wafat</label>
                <input
                  type="date"
                  value={formData.deathDate || ''}
                  onChange={e => setFormData({ ...formData, deathDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Alamat Tempat Tinggal</label>
              <textarea
                rows={2}
                value={formData.address || ''}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Alamat lengkap..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Foto Wajah (Maks 500KB)</label>
              <div className="flex items-center gap-4">
                {formData.photoUrl ? (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500">
                    <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, photoUrl: '' })}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                    <User className="w-8 h-8" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Ayah (Nasab)</label>
              <select
                value={formData.parentId || ''}
                onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">-- Tidak Ada / Root --</option>
                {members
                  .filter(m => m.gender === 'male' && m.id !== editingMember?.id)
                  .sort((a, b) => a.fullName.localeCompare(b.fullName))
                  .map(m => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Ibu (Opsional)</label>
              <select
                value={formData.motherId || ''}
                onChange={e => setFormData({ ...formData, motherId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">-- Tidak Ada --</option>
                {members
                  .filter(m => m.gender === 'female' && m.id !== editingMember?.id)
                  .sort((a, b) => a.fullName.localeCompare(b.fullName))
                  .map(m => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Pasangan (Opsional)</label>
              <select
                value={formData.spouseId || ''}
                onChange={e => setFormData({ ...formData, spouseId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">-- Tidak Ada --</option>
                {members
                  .filter(m => m.id !== editingMember?.id && m.gender !== formData.gender)
                  .sort((a, b) => a.fullName.localeCompare(b.fullName))
                  .map(m => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nomor WhatsApp (Opsional)</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="628123456789"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Biografi Singkat</label>
            <textarea
              rows={3}
              value={formData.bio || ''}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Informasi tambahan, tempat lahir, profesi, dll."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
