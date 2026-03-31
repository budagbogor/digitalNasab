import { useCallback, useMemo, useEffect, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Handle,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { FamilyMember, UserRole } from '../types';
import { User, Flower2, Edit2, Info } from 'lucide-react';

const nodeWidth = 280;
const nodeHeight = 100;
const spouseGap = 40; // Jarak antar pasangan agar lebih jelas

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const g = new dagre.graphlib.Graph();
  
  g.setGraph({
    rankdir: direction, // 'LR' (Kiri ke Kanan) atau 'TB' (Atas ke Bawah)
    nodesep: 80,        // Jarak antar rata-rata node
    ranksep: 250,       // Jarak antar generasi
    marginx: 50,
    marginy: 50,
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Masukkan semua node anchor dengan dimensi dinamis (mendukung slot berlapis untuk spouse)
  nodes.forEach(node => {
    const spouseCount = node.data?.spouses?.length || 0;
    // Base height 100, ditambah 100 untuk setiap Istri, ditambah gap 10
    const dynamicHeight = nodeHeight + (spouseCount * (nodeHeight + 10)); 
    g.setNode(node.id, { width: nodeWidth, height: dynamicHeight });
  });

  // Masukkan edges keturunan murni
  edges.forEach(edge => {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target, { weight: 1, minlen: 1 });
    }
  });

  // Hitung layout
  dagre.layout(g);

  // Map posisi dari Dagre ke node ReactFlow
  const layoutedNodes = nodes.map(node => {
    const nodeWithPosition = g.node(node.id);
    const spouseCount = node.data?.spouses?.length || 0;
    const dynamicHeight = nodeHeight + (spouseCount * (nodeHeight + 10));
    
    return {
      ...node,
      targetPosition: direction === 'LR' ? Position.Left : Position.Top,
      sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - dynamicHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};


interface TreeViewProps {
  members: FamilyMember[];
  onNodeClick: (member: FamilyMember) => void;
  onEditClick: (member: FamilyMember) => void;
  currentUserRole: UserRole;
}

const CustomNode = ({ data }: { data: any }) => {
  const { member, spouses, onEditClick, onInfoClick, layoutDirection } = data;
  const isHorizontal = layoutDirection === 'LR';
  const isMale = member.gender === 'male';
  const isDeceased = !member.isAlive;

  // Warna yang jauh lebih kontras untuk membedakan Pria dan Wanita
  const bgColor = isDeceased ? 'bg-slate-100' : isMale ? 'bg-emerald-50' : 'bg-rose-50';
  const borderColor = isDeceased ? 'border-slate-400' : isMale ? 'border-emerald-500' : 'border-rose-500';
  const textColor = isDeceased ? 'text-slate-800' : isMale ? 'text-emerald-950' : 'text-rose-950';
  const badgeBg = isDeceased ? 'bg-slate-200 text-slate-700' : isMale ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800';

  return (
    <div className="flex flex-col gap-[10px]">
      {/* Anchor Card */}
      <div 
        className={`relative px-3 py-3 shadow-md rounded-xl border-2 ${bgColor} ${borderColor} w-[280px] hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer bg-white`}
        onClick={() => onInfoClick(member)}
      >
        {/* Handles untuk Keturunan (Dinamis: LR atau TB) */}
        <Handle 
          type="target" 
          id="target" 
          position={isHorizontal ? Position.Left : Position.Top} 
          className="w-3 h-3 !bg-emerald-600 border-2 !border-white shadow-sm" 
        />
        <Handle 
          type="source" 
          id="source" 
          position={isHorizontal ? Position.Right : Position.Bottom} 
          className="w-3 h-3 !bg-emerald-600 border-2 !border-white shadow-sm" 
        />
        
        <div className="flex items-center gap-3">
          {member.photoUrl ? (
            <img src={member.photoUrl} alt="Foto" className={`w-12 h-12 rounded-full object-cover border-2 shadow-sm ${isDeceased ? 'grayscale opacity-80 border-slate-300' : isMale ? 'border-emerald-400' : 'border-rose-400'}`} />
          ) : (
            <div className={`p-2 rounded-full shadow-sm border-2 bg-white ${borderColor} ${textColor}`}>
              {isDeceased ? <Flower2 className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-sm leading-tight truncate uppercase ${textColor}`}>{member.fullName}</h3>
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${badgeBg}`}>
                {isMale ? 'Laki-laki' : 'Perempuan'}
              </span>
              {isDeceased && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-200 text-slate-700 border border-slate-300">
                  {isDeceased ? 'Almarhum/ah' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="absolute -top-3 -right-3 flex gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); onEditClick(member); }}
            className="p-2 text-gray-600 hover:text-emerald-600 transition-colors bg-white rounded-full shadow-md border-2 border-gray-200 hover:border-emerald-400"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Spouse Cards */}
      {spouses && spouses.map((spouse: FamilyMember) => {
        const sIsMale = spouse.gender === 'male';
        const sIsDeceased = !spouse.isAlive;
        const sBgColor = sIsDeceased ? 'bg-slate-100' : sIsMale ? 'bg-sky-50' : 'bg-fuchsia-50';
        const sBorderColor = sIsDeceased ? 'border-slate-400' : sIsMale ? 'border-sky-500' : 'border-fuchsia-400';
        const sTextColor = sIsDeceased ? 'text-slate-800' : sIsMale ? 'text-sky-950' : 'text-fuchsia-950';

        return (
          <div 
            key={spouse.id}
            className={`relative px-3 py-3 shadow-md rounded-xl border-2 ${sBgColor} ${sBorderColor} w-[280px] hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer opacity-95`}
            onClick={() => onInfoClick(spouse)}
          >
            {/* Indikator Spouse (Menutupi border atas) */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-800 text-[10px] px-3 py-0.5 rounded-full font-bold border border-amber-300 shadow-sm z-10 flex items-center gap-1">
              ❤️ Pasangan
            </div>
            
            <div className="flex items-center gap-3">
              {spouse.photoUrl ? (
                <img src={spouse.photoUrl} alt="Foto" className={`w-10 h-10 rounded-full object-cover border-2 shadow-sm ${sIsDeceased ? 'grayscale opacity-80 border-slate-300' : sIsMale ? 'border-sky-400' : 'border-fuchsia-400'}`} />
              ) : (
                <div className={`p-1.5 rounded-full bg-white shadow-sm border-2 ${sBorderColor} ${sTextColor}`}>
                  {sIsDeceased ? <Flower2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-sm leading-tight truncate uppercase ${sTextColor}`}>{spouse.fullName}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${sIsDeceased ? 'bg-slate-200 text-slate-700' : sIsMale ? 'bg-sky-200 text-sky-800' : 'bg-fuchsia-200 text-fuchsia-800'}`}>
                    {sIsMale ? 'Laki-laki' : 'Perempuan'} {sIsDeceased ? '(Alm)' : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute -top-3 -right-3 flex gap-1 z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); onEditClick(spouse); }}
                className="p-1.5 text-gray-600 hover:text-emerald-600 transition-colors bg-white rounded-full shadow-md border-2 border-gray-200 hover:border-emerald-400"
                title="Edit"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export default function TreeView({ members, onNodeClick, onEditClick, currentUserRole }: TreeViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('LR'); // Default Horizontal (LR)

  useEffect(() => {
    // === FILTER: Tampilkan node hanya jika memiliki minimal 1 koneksi ===
    // Buat set ID anggota yang "terhubung" dalam silsilah
    const connectedIds = new Set<string>();

    // 1. Anggota yang memiliki parentId atau spouseId (terhubung ke atas/ke samping)
    members.forEach(m => {
      if (m.parentId) {
        connectedIds.add(m.id);        // anak → terhubung
        connectedIds.add(m.parentId);  // orang tua → terhubung
      }
      if (m.spouseId) {
        connectedIds.add(m.id);        // diri sendiri → terhubung
        connectedIds.add(m.spouseId);  // pasangan → terhubung
      }
    });

    // 2. Selalu sertakan Iman Diharjo sebagai akar utama
    const rootMember = members.find(m => m.fullName.toLowerCase().includes('iman diharjo'));
    if (rootMember) connectedIds.add(rootMember.id);

    // Saring members: hanya yang terhubung
    const connectedMembers = members.filter(m => connectedIds.has(m.id));

    // Identifikasi siapa yang menjadi Anchor (Darah) dan Dependents (Pasangan luar)
    const anchorIds = new Set<string>();
    connectedMembers.forEach(n => {
      if (n.parentId) anchorIds.add(n.id);
    });
    const rootMemberLocal = connectedMembers.find(n => n.fullName.toLowerCase().includes('iman diharjo'));
    if (rootMemberLocal) anchorIds.add(rootMemberLocal.id);

    // Filter Pasangan (Orang luar)
    // Atur force anchor buat member yang melayang tapi punya spouse
    connectedMembers.forEach(n => {
      if (!anchorIds.has(n.id)) {
        const spouse = connectedMembers.find(s => s.id === n.spouseId || s.spouseId === n.id);
        if (spouse) {
          if (!anchorIds.has(spouse.id)) {
             // Jika keduanya orang luar, force male jadi anchor
             if (n.gender === 'male') anchorIds.add(n.id);
          }
        } else {
          anchorIds.add(n.id); // Floating tunggal
        }
      }
    });

    const anchors = connectedMembers.filter(m => anchorIds.has(m.id));
    const dependents = connectedMembers.filter(m => !anchorIds.has(m.id));

    // === Bangun Nodes (Hanya Anchors) ===
    const initialNodes: Node[] = anchors.map((member) => {
      // Cari pasangannya
      const mySpouses = dependents.filter(d => d.spouseId === member.id || member.spouseId === d.id);
      
      return {
        id: member.id,
        type: 'custom',
        data: { 
          member, 
          spouses: mySpouses,
          onEditClick, 
          onInfoClick: onNodeClick, 
          layoutDirection
        },
        position: { x: 0, y: 0 },
      };
    });

    const initialEdges: Edge[] = [];
    
    // Edges hanya untuk nasab (parentId)
    anchors.forEach((member) => {
      if (member.parentId && anchorIds.has(member.parentId)) {
        initialEdges.push({
          id: `e-${member.parentId}-${member.id}`,
          source: member.parentId,
          target: member.id,
          sourceHandle: 'source',
          targetHandle: 'target',
          type: 'step', // Jalur orthogonal (siku 90 derajat)
          animated: true,
          style: { stroke: '#059669', strokeWidth: 2.5 }, 
          markerEnd: { type: MarkerType.ArrowClosed, color: '#059669', width: 15, height: 15 },
          markerStart: 'junction-dot', // Menjadi indikator koneksi fisik
        });
      }
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
      layoutDirection 
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [members, onNodeClick, onEditClick, layoutDirection, setNodes, setEdges]);

  return (
    <div className="absolute inset-0 bg-emerald-50/30 overflow-hidden">
      {/* Definisi SVG Custom Marker untuk Junction Dot */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker
            id="junction-dot"
            markerWidth="12"
            markerHeight="12"
            refX="6"
            refY="6"
            orient="auto"
          >
            <circle cx="6" cy="6" r="4" fill="#059669" />
          </marker>
        </defs>
      </svg>

      {/* Mode Switcher */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-1 bg-white/90 backdrop-blur-sm p-1.5 rounded-2xl shadow-xl border border-emerald-100">
        <button
          onClick={() => setLayoutDirection('LR')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            layoutDirection === 'LR' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105' 
              : 'text-gray-500 hover:bg-emerald-50'
          }`}
        >
          <div className="w-4 h-3 flex flex-col gap-0.5 border border-current rounded-sm p-px">
            <div className="w-full h-px bg-current"></div>
            <div className="w-full h-px bg-current"></div>
          </div>
          HORIZONTAL
        </button>
        <button
          onClick={() => setLayoutDirection('TB')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            layoutDirection === 'TB' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105' 
              : 'text-gray-500 hover:bg-emerald-50'
          }`}
        >
          <div className="w-3 h-4 flex gap-0.5 border border-current rounded-sm p-px">
            <div className="h-full w-px bg-current"></div>
            <div className="h-full w-px bg-current"></div>
          </div>
          VERTIKAL
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        attributionPosition="bottom-right"
      >
        {/* Definisi Marker Kustom untuk Dot Pertemuan */}
        <svg style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <marker
              id="junction-dot"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
            >
              <circle cx="5" cy="5" r="4" fill="#059669" />
            </marker>
          </defs>
        </svg>

        <Background color="#10b981" gap={24} size={2} />
        <Controls className="bg-white shadow-lg border-emerald-100 rounded-xl overflow-hidden" />
        
        {/* Legenda */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-emerald-100 z-10 hidden md:block">
          <h4 className="text-xs font-bold text-emerald-900 mb-2 uppercase tracking-wider">Legenda Silsilah</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-emerald-600"></div>
              <span className="text-[10px] text-gray-600 font-medium">Garis Nasab (Ayah)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 border-t-2 border-dashed border-amber-500"></div>
              <span className="text-[10px] text-gray-600 font-medium">Hubungan Pasangan</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-500"></div>
              <span className="text-[10px] text-gray-600 font-medium">Anggota Pria</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-100 border border-rose-500"></div>
              <span className="text-[10px] text-gray-600 font-medium">Anggota Wanita</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-100 border border-slate-400"></div>
              <span className="text-[10px] text-gray-600 font-medium">Almarhum/ah</span>
            </div>
          </div>
        </div>
      </ReactFlow>
    </div>
  );
}
