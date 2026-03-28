import { useMemo } from 'react';
import { FamilyMember } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Users, UserCheck, UserMinus, UserCircle, UserCircle2, MapPin, Briefcase, GraduationCap, Calendar } from 'lucide-react';

interface StatsViewProps {
  members: FamilyMember[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function StatsView({ members }: StatsViewProps) {
  const stats = useMemo(() => {
    const total = members.length;
    const alive = members.filter(m => m.isAlive).length;
    const deceased = total - alive;
    const male = members.filter(m => m.gender === 'male').length;
    const female = total - male;

    // Age calculation
    const now = new Date();
    const ageData = members.map(m => {
      if (!m.birthDate) return null;
      const birth = new Date(m.birthDate);
      let age = now.getFullYear() - birth.getFullYear();
      const m_diff = now.getMonth() - birth.getMonth();
      if (m_diff < 0 || (m_diff === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    }).filter((age): age is number => age !== null);

    const ageCategories = [
      { name: 'Balita (0-5)', count: ageData.filter(a => a <= 5).length },
      { name: 'Anak (6-12)', count: ageData.filter(a => a > 5 && a <= 12).length },
      { name: 'Remaja (13-18)', count: ageData.filter(a => a > 12 && a <= 18).length },
      { name: 'Dewasa (19-59)', count: ageData.filter(a => a > 18 && a <= 59).length },
      { name: 'Lansia (60+)', count: ageData.filter(a => a >= 60).length },
    ];

    // Occupations
    const occupationMap: Record<string, number> = {};
    members.forEach(m => {
      const occ = m.occupation?.trim() || 'Tidak Diketahui';
      occupationMap[occ] = (occupationMap[occ] || 0) + 1;
    });
    const topOccupations = Object.entries(occupationMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Locations
    const locationMap: Record<string, number> = {};
    members.forEach(m => {
      const loc = m.address?.split(',').pop()?.trim() || 'Tidak Diketahui';
      locationMap[loc] = (locationMap[loc] || 0) + 1;
    });
    const topLocations = Object.entries(locationMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Education
    const educationMap: Record<string, number> = {};
    members.forEach(m => {
      const edu = m.education?.trim() || 'Tidak Diketahui';
      educationMap[edu] = (educationMap[edu] || 0) + 1;
    });
    const educationData = Object.entries(educationMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const genderData = [
      { name: 'Laki-laki', value: male },
      { name: 'Perempuan', value: female },
    ];

    const statusData = [
      { name: 'Hidup', value: alive },
      { name: 'Wafat', value: deceased },
    ];

    return {
      total, alive, deceased, male, female,
      ageCategories,
      topOccupations,
      topLocations,
      educationData,
      genderData,
      statusData
    };
  }, [members]);

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard icon={<Users className="w-5 h-5" />} label="Total Anggota" value={stats.total} color="bg-emerald-500" />
          <StatCard icon={<UserCheck className="w-5 h-5" />} label="Masih Hidup" value={stats.alive} color="bg-blue-500" />
          <StatCard icon={<UserMinus className="w-5 h-5" />} label="Telah Wafat" value={stats.deceased} color="bg-gray-500" />
          <StatCard icon={<UserCircle className="w-5 h-5" />} label="Laki-laki" value={stats.male} color="bg-emerald-600" />
          <StatCard icon={<UserCircle2 className="w-5 h-5" />} label="Perempuan" value={stats.female} color="bg-pink-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Age Distribution */}
          <ChartCard title="Klasifikasi Umur" icon={<Calendar className="w-5 h-5" />}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.ageCategories}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Gender & Status Distribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ChartCard title="Distribusi Gender" icon={<UserCircle className="w-5 h-5" />}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ec4899'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Status Kehidupan" icon={<UserCheck className="w-5 h-5" />}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Top 10 Occupations */}
          <ChartCard title="Top 10 Pekerjaan" icon={<Briefcase className="w-5 h-5" />}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats.topOccupations} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="name" type="category" width={100} fontSize={10} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Sebaran Wilayah */}
          <ChartCard title="Sebaran Wilayah" icon={<MapPin className="w-5 h-5" />}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats.topLocations}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Pendidikan */}
          <ChartCard title="Tingkat Pendidikan" icon={<GraduationCap className="w-5 h-5" />}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.educationData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
      <div className={`p-2 rounded-xl ${color} text-white mb-2`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ChartCard({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
          {icon}
        </div>
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}
