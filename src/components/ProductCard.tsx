import React, { useState } from 'react';
import { Product, Material, Color, CartItem } from '../types';
import { MATERIALS, COLORS } from '../data/shopData';
import { Check, ShoppingCart, Info, Award } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  key?: string;
  product: Product;
  onAddToCart: (item: CartItem) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [selectedMaterialId, setSelectedMaterialId] = useState(product.defaultMaterialId);
  const [selectedColorId, setSelectedColorId] = useState(product.defaultColorId);
  const [quantity, setQuantity] = useState(1);
  const [showNotification, setShowNotification] = useState(false);

  const selectedMaterial = MATERIALS.find(m => m.id === selectedMaterialId) || MATERIALS[0];
  const selectedColor = COLORS.find(c => c.id === selectedColorId) || COLORS[0];

  // Calculate dynamic price based on material choice
  // e.g. base price + TPU material surcharge (density/cost differences)
  const getDynamicPrice = () => {
    let multiplier = 1.0;
    if (selectedMaterialId === 'tpu') multiplier = 1.25; // Flexible prints require slower speeds & more care
    if (selectedMaterialId === 'abs') multiplier = 1.15; // ABS needs high temp chamber
    if (selectedMaterialId === 'petg') multiplier = 1.08; // PETG is premium
    return parseFloat((product.basePrice * multiplier).toFixed(2));
  };

  const currentSinglePrice = getDynamicPrice();
  const totalPrice = parseFloat((currentSinglePrice * quantity).toFixed(2));

  // Weight estimation in grams
  const estimatedWeight = selectedMaterialId === 'tpu' ? 140 : selectedMaterialId === 'abs' ? 115 : 130;

  const handleAddToCart = () => {
    const item: CartItem = {
      id: `${product.id}-${selectedMaterialId}-${selectedColorId}-${Date.now()}`,
      type: 'catalog',
      productId: product.id,
      name: product.name,
      materialId: selectedMaterialId,
      colorId: selectedColorId,
      quantity,
      price: currentSinglePrice,
      weight: estimatedWeight,
      dimensionsStr: product.dimensions
    };
    onAddToCart(item);
    
    // Trigger local animation notification
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 2500);
  };

  return (
    <div 
      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:border-slate-700/60 transition-all flex flex-col md:flex-row h-full sleek-card-hover"
      id={`product-card-${product.id}`}
    >
      {/* Product Image Section */}
      <div className="relative md:w-1/2 aspect-video md:aspect-auto min-h-[260px] bg-slate-950 overflow-hidden group">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
          id={`product-img-${product.id}`}
        />
        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur border border-slate-800/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs text-cyan-400 font-semibold shadow-md sleek-cyan-glow">
          <Award className="w-3.5 h-3.5" />
          Listo para Imprimir
        </div>
        <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur border border-slate-800/60 px-2 py-0.5 rounded text-[10px] text-slate-400">
          Tamaño: {product.dimensions}
        </div>
      </div>

      {/* Configuration Section */}
      <div className="p-6 md:w-1/2 flex flex-col justify-between" id={`product-info-${product.id}`}>
        <div>
          <h3 className="text-xl font-bold text-slate-100 tracking-tight mb-2">
            {product.name}
          </h3>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed">
            {product.description}
          </p>

          {/* Features bullet points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
            {product.features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </div>
            ))}
          </div>

          <div className="space-y-4 border-t border-slate-800/60 pt-4">
            {/* Material Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  Filamento / Material
                </label>
                <div className="group relative flex items-center gap-1 text-[10px] text-cyan-400 cursor-help">
                  <Info className="w-3 h-3" />
                  <span>Saber más</span>
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 p-3 bg-slate-950 border border-slate-800 rounded-lg shadow-xl z-20 text-slate-300 font-normal normal-case leading-normal">
                    <p className="font-semibold text-slate-100 mb-1">{selectedMaterial.name}</p>
                    <p className="text-[11px] mb-1.5 text-slate-400">{selectedMaterial.description}</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px] border-t border-slate-800 pt-1.5 text-slate-400">
                      <div>Tenacidad: {Array(selectedMaterial.strength).fill('★').join('')}</div>
                      <div>Flexibilidad: {Array(selectedMaterial.flexibility).fill('★').join('')}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MATERIALS.map(mat => (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => setSelectedMaterialId(mat.id)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs text-center transition-all cursor-pointer font-medium ${
                      selectedMaterialId === mat.id
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-cyan-950/20 shadow-md sleek-cyan-glow'
                        : 'bg-slate-950 border-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {mat.id.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">
                Color de Impresión: <span className="text-slate-200 font-medium lowercase capitalize">{selectedColor.name} ({selectedColor.type})</span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {COLORS.map(color => {
                  const isSelected = selectedColorId === color.id;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setSelectedColorId(color.id)}
                      className={`relative w-8 h-8 rounded-full cursor-pointer transition-all ${
                        isSelected 
                          ? 'ring-2 ring-offset-2 ring-offset-slate-950 ring-cyan-400 scale-110 shadow-lg sleek-cyan-glow' 
                          : 'hover:scale-105 border border-slate-800/80'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {isSelected && (
                        <Check 
                          className={`absolute inset-0 m-auto w-4.5 h-4.5 ${
                            color.id === 'c-blanco' ? 'text-slate-950' : 'text-white'
                          }`} 
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer buying action */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Precio Estimado</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-400">${totalPrice}</span>
              {quantity > 1 && <span className="text-xs text-slate-400">(${currentSinglePrice} c/u)</span>}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Peso estimado: {estimatedWeight * quantity}g • {product.estimatedHours * quantity}hs aprox</div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quantity Selector */}
            <div className="flex items-center border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
              <button
                type="button"
                id={`quantity-minus-${product.id}`}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                -
              </button>
              <span className="px-3 text-sm text-slate-200 font-semibold w-8 text-center">{quantity}</span>
              <button
                type="button"
                id={`quantity-plus-${product.id}`}
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Add Button */}
            <button
              type="button"
              id={`add-to-cart-${product.id}`}
              onClick={handleAddToCart}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-lg hover:shadow-cyan-500/20 hover:scale-[1.02] flex items-center gap-2 cursor-pointer text-sm sleek-cyan-glow"
            >
              <ShoppingCart className="w-4 h-4" />
              Pedir
            </button>
          </div>
        </div>
      </div>

      {/* Floating dynamic notification inside card */}
      {showNotification && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="absolute inset-x-0 bottom-4 mx-auto w-fit bg-emerald-500 text-slate-950 text-xs px-4 py-2 rounded-full font-bold shadow-xl flex items-center gap-1.5 z-10 border border-emerald-400/20"
        >
          <Check className="w-4 h-4 text-slate-950" />
          ¡Agregado al carrito de impresión!
        </motion.div>
      )}
    </div>
  );
}
