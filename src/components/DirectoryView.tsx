import { useState } from 'react';
import { FamilyMember, UserRole } from '../types';
import { Search, Edit2, Trash2, User, Flower2, Phone, MapPin } from 'lucide-react';

interface DirectoryViewProps {
  members: FamilyMember[];
  onEdit: (member: FamilyMember) => void;
  onDelete: (memberId: string) => void;
  onMemberClick: (member: FamilyMember) => void;
  currentUserRole: UserRole;
}

export default function DirectoryView({ members, onEdit, onDelete, onMemberClick, currentUserRole }: DirectoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const isAdmin = currentUserRole === 'admin';

  const getMemberName = (id?: string) => members.find(m => m.id === id)?.fullName || '-';

  const filteredMembers = members.filter(member => 
    member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.phone && member.phone.includes(searchTerm)) ||
    (member.address && member.address.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Search Bar */}
      <div className="p-4 border-bottom bg-gray-50">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama, telepon, atau alamat..."
            className="w-full pl-10 pr-4 py-2 border-2 border-emerald-100 rounded-xl focus:border-emerald-500 focus:ring-0 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Tidak ada data yang ditemukan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMembers.map((member) => (
                <div 
                  key={member.id}
                  onClick={() => onMemberClick(member)}
                  className="flex items-center gap-4 p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-emerald-200 hover:shadow-md transition-all group cursor-pointer"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {member.photoUrl ? (
                      <img 
                        src={member.photoUrl} 
                        alt="" 
                        className={`w-12 h-12 rounded-full object-cover border-2 ${!member.isAlive ? 'grayscale border-gray-300' : 'border-emerald-200'}`} 
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${!member.isAlive ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {!member.isAlive ? <Flower2 className="w-6 h-6" /> : <User className="w-6 h-6" />}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 truncate uppercase">{member.fullName}</h3>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${member.gender === 'male' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {member.gender === 'male' ? 'L' : 'P'}
                      </span>
                      {!member.isAlive && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                          Wafat
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <div className="flex items-center gap-1 text-[11px] text-gray-500">
                        <span className="font-semibold">Ayah:</span>
                        <span className="uppercase">{getMemberName(member.parentId)}</span>
                      </div>
                      {member.spouseId && (
                        <div className="flex items-center gap-1 text-[11px] text-gray-500">
                          <span className="font-semibold">Pasangan:</span>
                          <span className="uppercase">{getMemberName(member.spouseId)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      {member.phone && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                      {member.address && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{member.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(member);
                      }}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors bg-gray-50"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Menghapus window.confirm karena sering terblokir di lingkungan iframe
                          onDelete(member.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors bg-gray-50"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
