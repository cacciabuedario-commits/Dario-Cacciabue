import React, { useState } from 'react';
import { CartItem } from '../types';
import { MATERIALS, COLORS } from '../data/shopData';
import { 
  Trash2, ShoppingBag, ArrowRight, Truck, Store, 
  MapPin, CheckCircle, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, q: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckoutComplete: (clientName: string, clientEmail: string, deliveryType: 'delivery' | 'pickup', address: string) => void;
}

export default function Cart({ cartItems, onUpdateQuantity, onRemoveItem, onCheckoutComplete }: CartProps) {
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const getMaterialName = (id: string) => {
    return MATERIALS.find(m => m.id === id)?.displayName || id.toUpperCase();
  };

  const getColorName = (id: string) => {
    return COLORS.find(c => c.id === id)?.name || id;
  };

  const getColorHex = (id: string) => {
    return COLORS.find(c => c.id === id)?.hex || '#ccc';
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalWeight = cartItems.reduce((acc, item) => acc + (item.weight * item.quantity), 0);
  
  const shippingCost = deliveryType === 'delivery' ? 5.0 : 0.0;
  const total = parseFloat((subtotal + shippingCost).toFixed(2));

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    
    setIsSuccess(true);
    // Let animation show for a brief moment before firing callback
    setTimeout(() => {
      onCheckoutComplete(clientName, clientEmail, deliveryType, deliveryType === 'delivery' ? address : 'Retiro por taller');
      setIsSuccess(false);
      setClientName('');
      setClientEmail('');
      setAddress('');
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center py-16 flex flex-col items-center justify-center max-w-lg mx-auto shadow-xl" id="cart-checkout-success">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mb-6 shadow-lg animate-bounce">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black text-slate-100 mb-2">¡Compra Procesada con Éxito!</h3>
        <p className="text-slate-400 text-sm mb-4">
          Estamos cargando tus órdenes en nuestro sistema de impresión y rebanado (slicing) 3D.
        </p>
        <p className="text-xs text-slate-500">
          Redirigiéndote al panel de seguimiento en vivo...
        </p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center shadow-lg" id="cart-empty-view">
        <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 text-slate-500 mb-4 shadow-inner">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-200 mb-1">Tu carrito de impresión está vacío</h3>
        <p className="text-slate-400 text-xs max-w-sm mb-6 leading-relaxed">
          Explora nuestro catálogo de productos prediseñados o sube tu propio archivo STL para cotizar e imprimir a medida.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="cart-main-container">
      
      {/* ITEMS LIST (7 Cols) */}
      <div className="lg:col-span-7 space-y-4">
        <h3 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-cyan-400" />
          Tus Modelos a Imprimir ({cartItems.length})
        </h3>

        <div className="space-y-3" id="cart-items-list">
          {cartItems.map((item) => (
            <div 
              key={item.id} 
              className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-slate-800"
              id={`cart-item-${item.id}`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                {/* Visual color dot + code representation */}
                <div 
                  className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border border-slate-800 shadow-md relative overflow-hidden"
                  style={{ backgroundColor: `${getColorHex(item.colorId)}20` }}
                >
                  <div 
                    className="w-4 h-4 rounded-full border border-slate-800 shadow"
                    style={{ backgroundColor: getColorHex(item.colorId) }}
                  />
                  {item.type === 'custom' && (
                    <div className="absolute top-0 right-0 bg-cyan-500 text-slate-950 text-[7px] px-1 font-bold rounded-bl uppercase sleek-cyan-glow">
                      STL
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-200 truncate leading-tight">{item.name}</h4>
                  
                  {/* Detailed descriptions */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-400 mt-1">
                    <span className="font-semibold text-cyan-400">{getMaterialName(item.materialId)}</span>
                    <span className="text-slate-600">•</span>
                    <span>Color: {getColorName(item.colorId)}</span>
                    <span className="text-slate-600">•</span>
                    <span>Peso: {item.weight * item.quantity}g</span>
                  </div>

                  {item.type === 'custom' && item.infill && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800/60 font-semibold text-slate-300">
                        Infill: {item.infill}%
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800/60 font-semibold text-slate-300">
                        Capa: {item.layerHeight}mm
                      </span>
                      {item.dimensionsStr && (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800/60 font-semibold text-slate-300">
                          {item.dimensionsStr}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Price and Quantities */}
              <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto border-t border-slate-900 sm:border-0 pt-3 sm:pt-0 shrink-0">
                <div className="flex items-center border border-slate-800 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    className="px-2.5 py-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                  >
                    -
                  </button>
                  <span className="px-2 text-xs text-slate-200 font-bold w-6 text-center">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="px-2.5 py-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                  >
                    +
                  </button>
                </div>

                <div className="text-right min-w-[70px]">
                  <div className="text-sm font-extrabold text-emerald-400">${parseFloat((item.price * item.quantity).toFixed(2))}</div>
                  {item.quantity > 1 && <div className="text-[9px] text-slate-500">${item.price} c/u</div>}
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar del carrito"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHECKOUT SUMMARY & FORM (5 Cols) */}
      <div className="lg:col-span-5">
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-slate-100 border-b border-slate-900 pb-3">
            Resumen del Pedido
          </h3>

          <div className="space-y-2.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Modelos a Imprimir:</span>
              <span className="font-bold text-slate-200">{cartItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Peso total de material:</span>
              <span className="font-bold text-slate-200">{totalWeight.toFixed(0)}g</span>
            </div>
            <div className="flex justify-between">
              <span>Costo de Slicing e Impresión:</span>
              <span className="font-extrabold text-slate-200">${subtotal.toFixed(2)}</span>
            </div>
            
            {/* Delivery Method Selection */}
            <div className="border-t border-slate-900 pt-4 mt-3 space-y-2.5">
              <label className="block text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                Método de Entrega
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer gap-1 transition-all ${
                    deliveryType === 'delivery'
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 font-bold sleek-cyan-glow'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Envío a Domicilio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer gap-1 transition-all ${
                    deliveryType === 'pickup'
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 font-bold sleek-cyan-glow'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Retiro en Taller (Gratis)</span>
                </button>
              </div>
            </div>

            <div className="flex justify-between border-t border-slate-900 pt-3 text-xs">
              <span>Envío:</span>
              <span className="font-bold text-slate-200">
                {deliveryType === 'delivery' ? '$5.00' : 'Gratis'}
              </span>
            </div>

            <div className="flex justify-between border-t-2 border-dashed border-slate-800 pt-3 text-sm font-black">
              <span className="text-slate-200">Total a Pagar:</span>
              <span className="text-lg text-emerald-400 font-black">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* CHECKOUT FORM */}
          <form onSubmit={handleCheckout} className="border-t border-slate-900 pt-4 space-y-3.5">
            <h4 className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
              Información de Facturación y Despacho
            </h4>

            <div className="space-y-2">
              <input 
                type="text"
                required
                id="cart-checkout-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nombre Completo"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 placeholder-slate-500"
              />
              <input 
                type="email"
                required
                id="cart-checkout-email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Correo Electrónico"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 placeholder-slate-500"
              />
              
              {deliveryType === 'delivery' && (
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
                  <input 
                    type="text"
                    required
                    id="cart-checkout-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Dirección de Envío"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 placeholder-slate-500"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              id="btn-confirm-checkout"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-black text-xs tracking-wider uppercase transition-all shadow-lg hover:shadow-cyan-500/15 flex items-center justify-center gap-1.5 cursor-pointer sleek-cyan-glow"
            >
              Completar Pedido 3D
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Secure lock guarantee */}
          <div className="flex items-center gap-2 justify-center text-[10px] text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Garantía de Slicing Seguro y Calibración
          </div>
        </div>
      </div>
    </div>
  );
}
