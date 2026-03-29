import { FamilyMember, UserRole } from '../types';
import { X, Phone, User, Heart, Flower2, Calendar, MapPin, Edit2, Trash2, Briefcase, GraduationCap } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: FamilyMember | null;
  members: FamilyMember[];
  onEdit?: (member: FamilyMember) => void;
  onDelete?: (memberId: string) => void;
  currentUserRole: UserRole;
}

export default function ProfileModal({ isOpen, onClose, member, members, onEdit, onDelete, currentUserRole }: ProfileModalProps) {
  if (!isOpen || !member) return null;

  const isAdmin = currentUserRole === 'admin';

  const getParentName = (id?: string) => members.find(m => m.id === id)?.fullName || 'Tidak diketahui';
  const getSpouseName = (id?: string) => members.find(m => m.id === id)?.fullName || 'Tidak diketahui';

  const isMale = member.gender === 'male';
  const isDeceased = !member.isAlive;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-emerald-100">
        
        {/* Header */}
        <div className={`relative h-32 ${isDeceased ? 'bg-gray-200' : isMale ? 'bg-emerald-600' : 'bg-pink-600'}`}>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-black/20 rounded-full transition-colors z-10">
            <X className="w-5 h-5" />
          </button>
          
          {/* Avatar */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            {member.photoUrl ? (
              <img src={member.photoUrl} alt="Foto" className={`w-24 h-24 rounded-full border-4 border-white object-cover ${isDeceased ? 'grayscale opacity-80 bg-gray-200' : 'bg-emerald-100'}`} />
            ) : (
              <div className={`w-24 h-24 rounded-full border-4 border-white flex items-center justify-center ${isDeceased ? 'bg-gray-100 text-gray-400' : isMale ? 'bg-emerald-100 text-emerald-600' : 'bg-pink-100 text-pink-600'}`}>
                {isDeceased ? <Flower2 className="w-10 h-10" /> : <User className="w-10 h-10" />}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="pt-16 pb-8 px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-1 uppercase">{member.fullName}</h2>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDeceased ? 'bg-gray-100 text-gray-600' : isMale ? 'bg-emerald-100 text-emerald-700' : 'bg-pink-100 text-pink-700'}`}>
              {isMale ? 'Laki-laki' : 'Perempuan'}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDeceased ? 'bg-gray-800 text-white' : 'bg-green-100 text-green-700'}`}>
              {isDeceased ? 'Rahimahullah (Wafat)' : 'Masih Hidup'}
            </span>
          </div>

          <div className="space-y-4 text-left bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
            {(member.birthDate || member.deathDate) && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Tanggal
                </p>
                <p className="text-gray-800 text-sm">
                  {member.birthDate ? `Lahir: ${formatDate(member.birthDate)}` : ''}
                  {member.deathDate ? ` - Wafat: ${formatDate(member.deathDate)}` : ''}
                </p>
              </div>
            )}
            {member.address && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Alamat
                </p>
                <p className="text-gray-800 text-sm">{member.address}</p>
              </div>
            )}
            {member.occupation && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> Pekerjaan
                </p>
                <p className="text-gray-800 text-sm">{member.occupation}</p>
              </div>
            )}
            {member.education && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" /> Pendidikan
                </p>
                <p className="text-gray-800 text-sm">{member.education}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Nasab (Ayah)</p>
              <p className="text-gray-800 uppercase">{getParentName(member.parentId)}</p>
            </div>
            {member.motherId && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Ibu</p>
                <p className="text-gray-800 uppercase">{getParentName(member.motherId)}</p>
              </div>
            )}
            {member.spouseId && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-500" /> Pasangan
                </p>
                <p className="text-gray-800 uppercase">{getSpouseName(member.spouseId)}</p>
              </div>
            )}
            {member.bio && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Biografi</p>
                <p className="text-gray-800 text-sm leading-relaxed">{member.bio}</p>
              </div>
            )}
          </div>

          {member.isAlive && member.phone && (
            <a
              href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-xl transition-colors font-medium mb-3"
            >
              <Phone className="w-5 h-5" />
              Hubungi via WhatsApp
            </a>
          )}

          <div className="flex gap-3">
            {onEdit && (
              <button
                onClick={() => { onClose(); onEdit(member); }}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 py-3 px-6 rounded-xl transition-colors font-medium border border-emerald-300/30"
              >
                <Edit2 className="w-4 h-4" />
                Edit Data
              </button>
            )}
            {isAdmin && onDelete && (
              <button
                onClick={() => {
                  if (window.confirm('Apakah Anda yakin ingin menghapus anggota keluarga ini?')) {
                    onDelete(member.id);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 py-3 px-6 rounded-xl transition-colors font-medium border border-red-300/30"
              >
                <Trash2 className="w-4 h-4" />
                Hapus
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
