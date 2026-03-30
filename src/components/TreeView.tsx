import { useCallback, useMemo, useEffect } from 'react';
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
const spouseGap = 20; // Jarak sangat dekat antar pasangan

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ 
    rankdir: direction,
    nodesep: 80, // Jarak antar individu/keluarga
    ranksep: 150, // Jarak antar generasi dari atas ke bawah
    marginx: 50,
    marginy: 50,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // 1. Identifikasi Pasangan
  const spouseMap = new Map<string, string>(); // Suami -> Istri
  const isSpouse = new Set<string>();

  edges.forEach(edge => {
    if (edge.id.startsWith('e-spouse-')) {
      if (!isSpouse.has(edge.source) && !isSpouse.has(edge.target)) {
        spouseMap.set(edge.source, edge.target);
        isSpouse.add(edge.target);
      }
    }
  });

  // 2. Tambahkan Node ke Dagre (Gunakan Virtual Width untuk Pasangan sejajar horizontal)
  nodes.forEach((node) => {
    if (!isSpouse.has(node.id)) {
      const hasSpouse = spouseMap.has(node.id);
      g.setNode(node.id, { 
        width: hasSpouse ? (nodeWidth * 2 + spouseGap) : nodeWidth,
        height: nodeHeight 
      });
    }
  });

  // 3. Alihkan jalur istri ke suami di Dagre agar dianggap satu keluarga yang utuh
  edges.forEach((edge) => {
    if (!edge.id.startsWith('e-spouse-')) {
      let source = edge.source;
      let target = edge.target;

      spouseMap.forEach((wifeId, husbandId) => {
        if (source === wifeId) source = husbandId;
        if (target === wifeId) target = husbandId;
      });

      if (g.hasNode(source) && g.hasNode(target)) {
        g.setEdge(source, target);
      }
    }
  });

  dagre.layout(g);

  // 4. Mapping Posisi node secara horizontal
  const layoutedNodes = nodes.map((node) => {
    let x, y;
    
    // Cek apakah ini istri yang mengikuti suami
    let husbandId: string | undefined;
    spouseMap.forEach((wifeId, hId) => {
      if (node.id === wifeId) husbandId = hId;
    });

    if (husbandId) {
      const hPos = g.node(husbandId);
      y = hPos.y;
      // Letakkan di sebelah KANAN suami
      x = hPos.x + (nodeWidth / 2) + (spouseGap / 2) + (nodeWidth / 2);
    } else {
      const pos = g.node(node.id);
      if (spouseMap.has(node.id)) {
        // Jika ini suami, geser ke KIRI dalam virtual bloknya
        y = pos.y;
        x = pos.x - (nodeWidth / 2) - (spouseGap / 2);
      } else {
        x = pos.x;
        y = pos.y;
      }
    }

    return {
      ...node,
      targetPosition: Position.Top,      // Garis ortu masuk dari atas
      sourcePosition: Position.Bottom,   // Garis anak keluar ke bawah
      position: {
        x: x - nodeWidth / 2,
        y: y - nodeHeight / 2,
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
  const { member, onEditClick, onInfoClick, currentUserRole } = data;
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
      {/* Handles untuk Keturunan (Atas - Bawah) */}
      <Handle type="target" id="target" position={Position.Top} className="w-3 h-3 !bg-emerald-600 border-2 !border-white shadow-sm" />
      <Handle type="source" id="source" position={Position.Bottom} className="w-3 h-3 !bg-emerald-600 border-2 !border-white shadow-sm" />
      
      {/* Handles untuk Pasangan (Kiri - Kanan) */}
      <Handle type="source" id="spouse-source" position={Position.Right} style={{ top: '50%' }} className="w-3 h-3 !bg-amber-500 border-2 !border-white shadow-sm" />
      <Handle type="target" id="spouse-target" position={Position.Left} style={{ top: '50%' }} className="w-3 h-3 !bg-amber-500 border-2 !border-white shadow-sm" />
      
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

  useEffect(() => {
    const initialNodes: Node[] = members.map((member) => ({
      id: member.id,
      type: 'custom',
      data: { member, onEditClick, onInfoClick: onNodeClick, currentUserRole },
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
            type: 'smoothstep', // Menggunakan smoothstep agar melengkung rapi
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
      'TB' 
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [members, onNodeClick, onEditClick, setNodes, setEdges]);

  return (
    <div className="absolute inset-0 bg-emerald-50/30">
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
