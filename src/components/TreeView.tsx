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

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  const g = new dagre.graphlib.Graph();
  g.setGraph({ 
    rankdir: direction,
    nodesep: 120, 
    ranksep: 250, // Jarak antar generasi lebih lebar untuk kerapihan
    marginx: 100,
    marginy: 100,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // 1. Identifikasi Pasangan dan Hubungan
  const spouseMap = new Map<string, string>(); // Node -> Pasangan
  const parentMap = new Map<string, string>(); // Anak -> Parent
  
  edges.forEach(edge => {
    if (edge.id.startsWith('e-spouse-')) {
      spouseMap.set(edge.source, edge.target);
      spouseMap.set(edge.target, edge.source);
    } else {
      parentMap.set(edge.target, edge.source);
    }
  });

  // 2. Hitung Level Generasi (BFS mulai dari Akar: Iman Diharjo)
  const genLevels = new Map<string, number>();
  const visited = new Set<string>();
  const queue: { id: string, level: number }[] = [];

  // Cari Akar Utama (Iman Diharjo)
  const rootNode = nodes.find(node => {
    const name = (node.data.member as FamilyMember).fullName.toLowerCase();
    return name.includes('iman diharjo');
  });

  // Ambil semua kandidat akar (tidak punya orang tua)
  const rootCandidates = nodes.filter(node => {
    const member = node.data.member as FamilyMember;
    return !member.parentId && !member.motherId;
  });

  // Mulai BFS dari Iman Diharjo (jika ada) atau kandidat pertama
  const startNode = rootNode || rootCandidates[0];
  if (startNode) {
    queue.push({ id: startNode.id, level: 1 });
    genLevels.set(startNode.id, 1);
    visited.add(startNode.id);
  }

  // Tambahkan root candidates lain ke queue (jika ada silsilah terpisah)
  rootCandidates.forEach(node => {
    if (!visited.has(node.id)) {
      queue.push({ id: node.id, level: 1 });
      genLevels.set(node.id, 1);
      visited.add(node.id);
    }
  });

  // Proses BFS Generasi
  let head = 0;
  while (head < queue.length) {
    const { id, level } = queue[head++];
    
    // 2.1 Sinkronisasi Pasangan (Setiap anggota di level L, pasangannya juga di level L)
    const spouseId = spouseMap.get(id);
    if (spouseId && !genLevels.has(spouseId)) {
      genLevels.set(spouseId, level);
      visited.add(spouseId);
      // Tidak dimasukkan ke queue karena silsilah patrilineal (fokus nasab laki-laki)
    }

    // 2.2 Cari Anak (Jalur Nasab -> Level L + 1)
    edges.forEach(edge => {
      // Pastikan edge ini adalah jalur keturunan (bukan spouse edge)
      if (!edge.id.startsWith('e-spouse-') && edge.source === id) {
        if (!visited.has(edge.target)) {
          genLevels.set(edge.target, level + 1);
          visited.add(edge.target);
          queue.push({ id: edge.target, level: level + 1 });
        }
      }
    });
  }

  // 2.3 Tangani node yang tersisa (jika ada data terputus)
  nodes.forEach(node => {
    if (!genLevels.has(node.id)) {
      genLevels.set(node.id, 1);
    }
  });

  // 3. Tambahkan Node ke Dagre
  nodes.forEach((node) => {
    g.setNode(node.id, { 
      width: nodeWidth, 
      height: nodeHeight 
    });
  });

  // 4. Tambahkan Edge ke Dagre
  edges.forEach((edge) => {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      const isSpouseEdge = edge.id.startsWith('e-spouse-');
      g.setEdge(edge.source, edge.target, {
        weight: isSpouseEdge ? 100 : 1, // Prioritas tinggi agar pasangan tetap sedekat mungkin
      });
    }
  });

  dagre.layout(g);

  // 5. Mapping Posisi (FORCE ALIGNMENT PER GENERASI)
  const GEN_DISTANCE = 600; // Tingkatkan jarak agar tidak menumpuk
  
  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    const level = genLevels.get(node.id) || 1;
    const targetPos = isHorizontal ? Position.Left : Position.Top;
    const sourcePos = isHorizontal ? Position.Right : Position.Bottom;

    // Koordinat sumbu utama dipaksa berdasarkan level
    let x, y;
    if (isHorizontal) {
      x = (level - 1) * GEN_DISTANCE;
      y = pos.y * 1.5; // Beri skala tambahan pada sumbu sekunder agar tidak dempet vertikal
    } else {
      x = pos.x * 1.5; // Beri skala tambahan pada sumbu sekunder agar tidak dempet horizontal
      y = (level - 1) * GEN_DISTANCE;
    }

    return {
      ...node,
      targetPosition: targetPos,
      sourcePosition: sourcePos,
      position: {
        x: x - nodeWidth / 2,
        y: y - nodeHeight / 2,
      },
      data: { ...node.data, level }
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
  const { member, onEditClick, onInfoClick, currentUserRole, layoutDirection } = data;
  const isHorizontal = layoutDirection === 'LR';
  const isMale = member.gender === 'male';
  const isDeceased = !member.isAlive;
  const isAdmin = currentUserRole === 'admin';

  // Warna yang jauh lebih kontras untuk membedakan Pria dan Wanita
  const bgColor = isDeceased ? 'bg-slate-100' : isMale ? 'bg-emerald-50' : 'bg-rose-50';
  const borderColor = isDeceased ? 'border-slate-400' : isMale ? 'border-emerald-500' : 'border-rose-500';
  const textColor = isDeceased ? 'text-slate-800' : isMale ? 'text-emerald-950' : 'text-rose-950';
  const badgeBg = isDeceased ? 'bg-slate-200 text-slate-700' : isMale ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800';

  return (
    <div 
      className={`relative px-3 py-3 shadow-md rounded-xl border-2 ${bgColor} ${borderColor} w-[280px] hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer`}
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
      
      {/* Handles untuk Pasangan (Dinamis agar tidak tabrakan dengan garis nasab) */}
      <Handle 
        type="source" 
        id="spouse-source" 
        position={isHorizontal ? Position.Bottom : Position.Right} 
        className="w-3 h-3 !bg-amber-500 border-2 !border-white shadow-sm" 
      />
      <Handle 
        type="target" 
        id="spouse-target" 
        position={isHorizontal ? Position.Top : Position.Left} 
        className="w-3 h-3 !bg-amber-500 border-2 !border-white shadow-sm" 
      />
      
      <div className="flex items-center gap-3">
        {member.photoUrl ? (
          <img src={member.photoUrl} alt="Foto" className={`w-12 h-12 rounded-full object-cover border-2 shadow-sm ${isDeceased ? 'grayscale opacity-80 border-slate-300' : isMale ? 'border-emerald-400' : 'border-rose-400'}`} />
        ) : (
          <div className={`p-2 rounded-full bg-white shadow-sm border-2 ${borderColor} ${textColor}`}>
            {isDeceased ? <Flower2 className="w-6 h-6" /> : <User className="w-6 h-6" />}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-sm leading-tight truncate uppercase ${textColor}`}>{member.fullName}</h3>
          
          {/* Badge Status & Gender */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${badgeBg}`}>
              {isMale ? 'Laki-laki' : 'Perempuan'}
            </span>
            {isDeceased && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-200 text-slate-700 border border-slate-300">
                {isMale ? 'Almarhum' : 'Almarhumah'}
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
    const initialNodes: Node[] = members.map((member) => ({
      id: member.id,
      type: 'custom',
      data: { 
        member, 
        onEditClick, 
        onInfoClick: onNodeClick, 
        currentUserRole,
        layoutDirection // Kirim mode layout ke node
      },
      position: { x: 0, y: 0 },
    }));

    const initialEdges: Edge[] = [];
    
    members.forEach((member) => {
      if (member.parentId) {
        initialEdges.push({
          id: `e-${member.parentId}-${member.id}`,
          source: member.parentId,
          target: member.id,
          sourceHandle: 'source',
          targetHandle: 'target',
          type: 'smoothstep',
          animated: true,
          // Garis Ayah ke Anak: Hijau, tebal
          style: { stroke: '#059669', strokeWidth: 3 }, 
          markerEnd: { type: MarkerType.ArrowClosed, color: '#059669', width: 15, height: 15 },
          // Menambahkan Dot Pertemuan di pangkal garis (Source)
          markerStart: 'junction-dot',
        });
      }
      if (member.spouseId) {
        const edgeId1 = `e-spouse-${member.id}-${member.spouseId}`;
        const edgeId2 = `e-spouse-${member.spouseId}-${member.id}`;
        if (!initialEdges.some(e => e.id === edgeId1 || e.id === edgeId2)) {
          initialEdges.push({
            id: edgeId1,
            source: member.id,
            target: member.spouseId,
            sourceHandle: 'spouse-source',
            targetHandle: 'spouse-target',
            type: 'smoothstep', 
            // Garis Pasangan: Kuning/Emas putus-putus
            style: { stroke: '#f59e0b', strokeWidth: 3, strokeDasharray: '8,5' }, 
            label: '❤️',
            labelStyle: { fill: '#b45309', fontWeight: 800, fontSize: 12 },
            labelBgStyle: { fill: '#fef3c7', fillOpacity: 0.8, rx: 4, ry: 4 },
          });
        }
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
