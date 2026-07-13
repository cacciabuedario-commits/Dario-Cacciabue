import { useState } from 'react';
import { CustomOrder, OrderStatus } from '../types';
import { MATERIALS, COLORS } from '../data/shopData';
import { 
  ClipboardList, Cpu, AlertCircle, CheckCircle, Clock, 
  Truck, HelpCircle, Eye, RefreshCw, ChevronRight, Check
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminPanelProps {
  orders: CustomOrder[];
  onUpdateOrderStatus: (id: string, status: OrderStatus, notes?: string) => void;
}

export default function AdminPanel({ orders, onUpdateOrderStatus }: AdminPanelProps) {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'printing' | 'completed'>('all');
  const [editingNotes, setEditingNotes] = useState<{ [id: string]: string }>({});

  const getMaterialName = (id: string) => {
    return MATERIALS.find(m => m.id === id)?.displayName || id.toUpperCase();
  };

  const getColorName = (id: string) => {
    return COLORS.find(c => c.id === id)?.name || id;
  };

  const getColorHex = (id: string) => {
    return COLORS.find(c => c.id === id)?.hex || '#475569';
  };

  // Status mapping to visual indicators
  const statusConfig: { [key in OrderStatus]: { label: string; bg: string; icon: any; desc: string } } = {
    pending: {
      label: 'En Espera de Análisis',
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      icon: Clock,
      desc: 'Nuestro taller está rebanando (slicing) tu archivo para verificar espesores de pared y voladizos.',
    },
    quoted: {
      label: 'Cotizado - Listo para Aprobar',
      bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
      icon: Eye,
      desc: 'Tu archivo es imprimible. Por favor aprueba la cotización para iniciar el calentamiento de camas.',
    },
    approved: {
      label: 'En Cola de Impresión',
      bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      icon: ClipboardList,
      desc: 'Modelo aprobado. Asignado a la impresora #Bambu-X1C-1. Esperando filamento.',
    },
    printing: {
      label: 'Imprimiendo en 3D...',
      bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 sleek-cyan-text-shadow',
      icon: Cpu,
      desc: 'Temperatura Extrusor: 220°C • Cama: 60°C. Boquilla depositando material capa por capa.',
    },
    shipped: {
      label: 'Despachado / Listo',
      bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
      icon: Truck,
      desc: '¡Pieza terminada! Limpieza de soportes completada. Listo para retirar o enviado por correo.',
    },
    completed: {
      label: 'Entregado',
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      icon: CheckCircle,
      desc: '¡Disfruta de tu pieza 3D! Gracias por confiar en el taller Dimension 3D.',
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return order.status === 'pending' || order.status === 'quoted';
    if (activeTab === 'printing') return order.status === 'approved' || order.status === 'printing';
    if (activeTab === 'completed') return order.status === 'shipped' || order.status === 'completed';
    return true;
  });

  const getProgressPercentage = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 15;
      case 'quoted': return 30;
      case 'approved': return 50;
      case 'printing': return 75;
      case 'shipped': return 90;
      case 'completed': return 100;
      default: return 0;
    }
  };

  return (
    <div className="space-y-6" id="orders-admin-panel">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5.5 h-5.5 text-cyan-400" />
            Seguimiento de Órdenes y Cola de Impresión
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Revisa el estado de calibración, nivelación de cama e impresión 3D de tus piezas cargadas.
          </p>
        </div>

        {/* Admin/User Simulation Toggle */}
        <div className="flex items-center gap-3 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            id="panel-toggle-client"
            onClick={() => setIsAdminMode(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              !isAdminMode 
                ? 'bg-slate-900 text-cyan-400 border border-slate-800/80 shadow sleek-cyan-glow' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vista Cliente
          </button>
          <button
            type="button"
            id="panel-toggle-admin"
            onClick={() => setIsAdminMode(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              isAdminMode 
                ? 'bg-cyan-500 text-slate-950 shadow sleek-cyan-glow' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Simulador Operador
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center shadow-lg" id="panel-empty">
          <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 text-slate-500 mb-4 shadow-inner">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-200 mb-1">No tienes órdenes activas</h3>
          <p className="text-slate-400 text-xs max-w-sm mb-6 leading-relaxed">
            Realiza la compra de un producto del catálogo o sube un archivo .STL en el cotizador personalizado para ver la cola de impresión.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* TABS SELECTOR */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-1" id="panel-tabs">
            {(['all', 'pending', 'printing', 'completed'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 border-b-2 text-xs font-extrabold capitalize tracking-wider cursor-pointer transition-all ${
                  activeTab === tab
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'all' && 'Todos'}
                {tab === 'pending' && 'En Revisión / Cotización'}
                {tab === 'printing' && 'En Impresora'}
                {tab === 'completed' && 'Listos / Entregados'}
              </button>
            ))}
          </div>

          {/* LIST OF ORDERS */}
          <div className="space-y-4" id="panel-orders-list">
            {filteredOrders.map(order => {
              const config = statusConfig[order.status];
              const StatusIcon = config.icon;
              const isEditingNotes = order.id in editingNotes;

              return (
                <div 
                  key={order.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-md flex flex-col gap-5 hover:border-slate-800 transition-all"
                  id={`panel-order-${order.id}`}
                >
                  {/* Top Header Card */}
                  <div className="flex flex-wrap items-start justify-between gap-3.5 border-b border-slate-900 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/40 sleek-cyan-glow">{order.id}</span>
                        <span className="text-slate-500 text-xs">• Creado: {order.createdAt}</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                        Pieza: {order.fileName}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Cliente: <strong className="text-slate-300">{order.clientName}</strong> ({order.clientEmail})
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 shadow ${config.bg}`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${order.status === 'printing' ? 'animate-spin' : ''}`} style={order.status === 'printing' ? { animationDuration: '3s' } : {}} />
                        {config.label}
                      </div>
                      <span className="text-emerald-400 font-extrabold text-sm">${order.estimatedPrice}</span>
                    </div>
                  </div>

                  {/* Visual Progress Bar (Client View) */}
                  {!isAdminMode && (
                    <div className="space-y-3.5 bg-slate-900/40 p-4 rounded-xl border border-slate-800/40">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>Progreso de Fabricación:</span>
                        <span className="font-bold text-cyan-400">{getProgressPercentage(order.status)}%</span>
                      </div>
                      
                      {/* Bar tracker */}
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-1000 ease-out shadow-cyan-500/20 sleek-cyan-glow"
                          style={{ width: `${getProgressPercentage(order.status)}%` }}
                        />
                      </div>

                      {/* Descriptive Status */}
                      <div className="text-xs flex items-start gap-2 text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800/40 mt-1">
                        <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{config.desc}</p>
                          {order.adminNotes && (
                            <p className="text-amber-400 text-[11px] mt-1.5 italic">
                              <strong>Nota técnica:</strong> "{order.adminNotes}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Dynamic interactive action for CLIENT: Approve Quote if status is 'quoted' */}
                      {order.status === 'quoted' && (
                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            id={`approve-quote-btn-${order.id}`}
                            onClick={() => onUpdateOrderStatus(order.id, 'approved', 'Aprobado por el cliente. Listo para rebanar e imprimir.')}
                            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md hover:scale-102 cursor-pointer transition-all"
                          >
                            <Check className="w-4 h-4" />
                            Aprobar Cotización e Imprimir
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin Controls Panel (Simulated Workshop) */}
                  {isAdminMode && (
                    <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-4">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-400">
                        <Cpu className="w-4 h-4" />
                        CONSOLA DE CONTROL DE OPERADOR DE TALLER
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Status Change Selector */}
                        <div className="space-y-2">
                          <label className="block text-[11px] text-slate-400 uppercase font-semibold">
                            Cambiar Estado Técnico
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {(['pending', 'quoted', 'approved', 'printing', 'shipped', 'completed'] as OrderStatus[]).map(st => (
                              <button
                                key={st}
                                type="button"
                                id={`admin-status-${order.id}-${st}`}
                                onClick={() => onUpdateOrderStatus(order.id, st, editingNotes[order.id] || order.adminNotes)}
                                className={`py-1.5 px-2 rounded-lg text-[10px] text-left font-bold transition-all border cursor-pointer flex items-center justify-between ${
                                  order.status === st
                                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow sleek-cyan-glow'
                                    : 'bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-300'
                                }`}
                              >
                                <span className="capitalize">{st === 'pending' ? 'pendiente' : st === 'quoted' ? 'cotizado' : st === 'approved' ? 'en cola' : st === 'printing' ? 'imprimiendo' : st === 'shipped' ? 'despachado' : 'entregado'}</span>
                                {order.status === st && <Check className="w-3 h-3" />}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Admin Notes Field */}
                        <div className="space-y-2">
                          <label className="block text-[11px] text-slate-400 uppercase font-semibold">
                            Notas del Operador (Información de Slicing/Soportes)
                          </label>
                          <textarea
                            value={editingNotes[order.id] !== undefined ? editingNotes[order.id] : (order.adminNotes || '')}
                            id={`admin-notes-${order.id}`}
                            onChange={(e) => setEditingNotes({ ...editingNotes, [order.id]: e.target.value })}
                            placeholder="Escribe notas como: 'Espesor verificado. Se necesitan soportes en voladizos.'"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 h-[74px] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 resize-none placeholder-slate-600"
                          />
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-emerald-400 font-semibold" id={`save-feedback-${order.id}`}></span>
                            <button
                              type="button"
                              id={`save-notes-${order.id}`}
                              onClick={() => {
                                onUpdateOrderStatus(order.id, order.status, editingNotes[order.id]);
                                const feedbackEl = document.getElementById(`save-feedback-${order.id}`);
                                if (feedbackEl) {
                                  feedbackEl.textContent = '¡Nota guardada!';
                                  setTimeout(() => { feedbackEl.textContent = ''; }, 3000);
                                }
                              }}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-bold text-slate-300 transition-colors cursor-pointer"
                            >
                              Guardar Notas
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary Footer of Card */}
                  <div className="flex flex-wrap items-center justify-between text-xs border-t border-slate-900 pt-3 text-slate-400 gap-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Material: <strong className="text-slate-300">{getMaterialName(order.materialId)}</strong></span>
                      <span className="flex items-center gap-1">
                        Color: 
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-slate-800" 
                          style={{ backgroundColor: getColorHex(order.colorId) }}
                          title={getColorName(order.colorId)}
                        />
                        <strong className="text-slate-300">{getColorName(order.colorId)}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] font-mono">
                      <span>Volumen: {order.volumeCm3} cm³</span>
                      <span>Infill: {order.infill}%</span>
                      <span>Capa: {order.layerHeight} mm</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
