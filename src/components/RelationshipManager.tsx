import React, { useState, useMemo } from 'react';
import { FamilyMember, UserRole } from '../types';
import { Search, Edit2, User, X, CheckCircle2, Activity, Plus, Trash2 } from 'lucide-react';

interface Props {
  members: FamilyMember[];
  currentUserRole: UserRole;
  onUpdateRelation: (member: FamilyMember) => Promise<void>;
  onDeleteRelation: (id: string) => Promise<void>;
  onQuickAddChild: (fullName: string, gender: 'male'|'female', targetId: string, parentGender: 'male'|'female') => Promise<void>;
}

export default function RelationshipManager({ members, currentUserRole, onUpdateRelation, onDeleteRelation, onQuickAddChild }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingChild, setIsSavingChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildGender, setNewChildGender] = useState<'male'|'female'>('male');
  
  // States for the active edit form
  const [editFormData, setEditFormData] = useState<{
    parentId: string;
    motherId: string;
    spouseId: string;
  }>({ parentId: '', motherId: '', spouseId: '' });

  const getMemberName = (id?: string) => {
    if (!id) return '-';
    const m = members.find(m => m.id === id);
    return m ? m.fullName : 'Tidak Diketahui';
  };

  const getChildren = (parentId: string, gender: 'male' | 'female') => {
    return members.filter(m => 
      gender === 'male' ? m.parentId === parentId : m.motherId === parentId
    );
  };

  // Filter Members based on search
  const filteredMembers = useMemo(() => {
    if (!searchTerm) return members;
    return members.filter(m => 
      m.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [members, searchTerm]);

  // Options for dropdowns
  const maleOptions = useMemo(() => members.filter(m => m.gender === 'male'), [members]);
  const femaleOptions = useMemo(() => members.filter(m => m.gender === 'female'), [members]);

  const handleEditClick = (member: FamilyMember) => {
    setEditingId(member.id);
    setEditFormData({
      parentId: member.parentId || '',
      motherId: member.motherId || '',
      spouseId: member.spouseId || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (member: FamilyMember) => {
    setIsSaving(true);
    try {
      const updatedMember: FamilyMember = {
        ...member,
        parentId: editFormData.parentId || undefined,
        motherId: editFormData.motherId || undefined,
        spouseId: editFormData.spouseId || undefined,
      };
      await onUpdateRelation(updatedMember);
      setEditingId(null);
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan relasi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-600" />
            Manajemen Relasi (Keluarga Inti)
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Validasi identitas secara unik untuk menjamin diagram silsilah terlepas dari error persilangan (Bottom-Up Approach).
          </p>
        </div>
        
        <div className="w-full md:w-auto flex items-center gap-2 bg-white rounded-xl shadow-sm border border-gray-200 p-1">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari Identitas Anggota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-transparent border-none focus:ring-0 text-sm"
            />
          </div>
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto min-h-[60vh]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50 border-b border-emerald-100 text-emerald-800 text-sm">
                <th className="p-4 font-semibold w-1/4">Identitas (Target)</th>
                <th className="p-4 font-semibold w-1/6">Ayah (Laki-laki)</th>
                <th className="p-4 font-semibold w-1/6">Ibu (Perempuan)</th>
                <th className="p-4 font-semibold w-1/6">Pasangan</th>
                <th className="p-4 font-semibold w-1/5">Relasi Anak (Otomatis)</th>
                <th className="p-4 font-semibold text-center w-[120px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMembers.map((member) => {
                const isEditing = editingId === member.id;
                const children = getChildren(member.id, member.gender);

                return (
                  <tr key={member.id} className={`hover:bg-gray-50 transition-colors ${isEditing ? 'bg-orange-50/50 hover:bg-orange-50/50' : ''}`}>
                    
                    {/* KOLOM IDENTITAS */}
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-3">
                        {member.photoUrl ? (
                          <img src={member.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border shadow-sm" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-sm text-white ${member.gender === 'male' ? 'bg-emerald-500' : 'bg-rose-400'}`}>
                            {member.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-gray-800 uppercase text-sm">{member.fullName}</div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5" title="UUID Identitas Asli">ID: {member.id.split('-')[0]}...</div>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${member.gender === 'male' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {member.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* KOLOM AYAH */}
                    <td className="p-4 align-top">
                      {isEditing ? (
                        <select
                          value={editFormData.parentId}
                          onChange={(e) => setEditFormData({ ...editFormData, parentId: e.target.value })}
                          className="w-full rounded-lg border-gray-300 text-sm p-2 bg-white focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value="">-- Kosong --</option>
                          {maleOptions.filter(m => m.id !== member.id && m.id !== member.spouseId).map(m => (
                            <option key={m.id} value={m.id}>{m.fullName} ({m.id.split('-')[0]})</option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm font-medium text-gray-700">{getMemberName(member.parentId)}</div>
                      )}
                    </td>

                    {/* KOLOM IBU */}
                    <td className="p-4 align-top">
                      {isEditing ? (
                        <select
                          value={editFormData.motherId}
                          onChange={(e) => setEditFormData({ ...editFormData, motherId: e.target.value })}
                          className="w-full rounded-lg border-gray-300 text-sm p-2 bg-white focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value="">-- Kosong --</option>
                          {femaleOptions.filter(m => m.id !== member.id && m.id !== member.spouseId).map(m => (
                            <option key={m.id} value={m.id}>{m.fullName} ({m.id.split('-')[0]})</option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm font-medium text-gray-700">{getMemberName(member.motherId)}</div>
                      )}
                    </td>

                    {/* KOLOM PASANGAN */}
                    <td className="p-4 align-top">
                      {isEditing ? (
                        <select
                          value={editFormData.spouseId}
                          onChange={(e) => setEditFormData({ ...editFormData, spouseId: e.target.value })}
                          className="w-full rounded-lg border-gray-300 text-sm p-2 bg-white focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value="">-- Kosong --</option>
                          {members.filter(m => m.id !== member.id && m.id !== member.parentId && m.id !== member.motherId).map(m => (
                            <option key={m.id} value={m.id}>{m.fullName} ({m.id.split('-')[0]})</option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm font-medium text-gray-700">
                          {getMemberName(member.spouseId)}
                          {member.spouseId && (
                            <span className="ml-2 inline-flex items-center text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">❤️</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* KOLOM ANAK (Otomatis/Read-Only + Quick Add) */}
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-1">
                          {children.length > 0 ? (
                            children.map(child => (
                              <span key={child.id} className="text-[11px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded-md break-words">
                                {child.fullName}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-gray-400 italic bg-gray-50 px-2 py-1 border border-dashed border-gray-200 rounded-md">Tidak ada data anak</span>
                          )}
                        </div>
                        {isEditing && (
                          <div className="flex flex-col gap-1 mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg shadow-inner">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tambah Anak Baru</span>
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="text" placeholder="Nama Lengkap..." 
                                className="text-xs p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 w-full bg-white"
                                value={newChildName} onChange={e => setNewChildName(e.target.value)}
                              />
                              <select 
                                className="text-[10px] p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 bg-white"
                                value={newChildGender} onChange={e => setNewChildGender(e.target.value as any)}
                              >
                                <option value="male">L</option><option value="female">P</option>
                              </select>
                              <button 
                                onClick={async () => {
                                  if (!newChildName.trim()) return;
                                  setIsSavingChild(true);
                                  await onQuickAddChild(newChildName, newChildGender, member.id, member.gender);
                                  setNewChildName(''); 
                                  setIsSavingChild(false);
                                }}
                                disabled={isSavingChild || !newChildName.trim()}
                                className="bg-emerald-600 text-white p-1.5 rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                                title="Tambah Anak Cepat"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* KOLOM AKSI */}
                    <td className="p-4 align-top text-center">
                      {currentUserRole === 'admin' ? (
                        isEditing ? (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleSaveEdit(member)}
                              disabled={isSaving}
                              className="w-full flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Simpan
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                              className="w-full flex items-center justify-center gap-1 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                            >
                              <X className="w-4 h-4" /> Batal
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEditClick(member)}
                              className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 hover:bg-emerald-50 text-emerald-700 transition"
                              title="Edit Relasi Keluarga"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteRelation(member.id)}
                              className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 hover:bg-red-50 text-red-600 transition"
                              title="Hapus Anggota"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      ) : (
                        <span className="text-[10px] text-gray-400 block p-2 bg-gray-50 border rounded-lg">Tanpa Akses</span>
                      )}
                    </td>

                  </tr>
                );
              })}
              
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    Tidak ada anggota keluarga ditemukan dengan pencarian "{searchTerm}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
