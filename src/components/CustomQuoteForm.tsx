import React, { useState, useRef } from 'react';
import { parseSTL, ParsedSTL } from '../lib/stlParser';
import { generateSampleTorusKnot } from '../lib/sampleMesh';
import { MATERIALS, COLORS } from '../data/shopData';
import STLViewer from './STLViewer';
import { CustomOrder, CartItem } from '../types';
import { 
  Upload, FileCode, CheckCircle2, Info, Scale, 
  Clock, Coins, Sparkles, Sliders, Box, Layers, User, Mail, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomQuoteFormProps {
  onAddCustomToCart: (item: CartItem) => void;
  onSubmitOrderDirectly: (order: CustomOrder) => void;
}

export default function CustomQuoteForm({ onAddCustomToCart, onSubmitOrderDirectly }: CustomQuoteFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Parsed STL data state
  const [parsedData, setParsedData] = useState<ParsedSTL | null>(null);
  
  // Custom print options state
  const [selectedMaterialId, setSelectedMaterialId] = useState('pla');
  const [selectedColorId, setSelectedColorId] = useState('c-negro');
  const [infill, setInfill] = useState(15); // standard 15% infill
  const [layerHeight, setLayerHeight] = useState(0.20); // standard 0.20mm
  const [quantity, setQuantity] = useState(1);
  
  // Client info state for direct order submission
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showCartNotification, setShowCartNotification] = useState(false);

  const selectedMaterial = MATERIALS.find(m => m.id === selectedMaterialId) || MATERIALS[0];
  const selectedColor = COLORS.find(c => c.id === selectedColorId) || COLORS[0];

  // Drag and drop states
  const [isDragActive, setIsDragActive] = useState(false);

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.stl')) {
      setError('Por favor sube un archivo con formato .STL válido.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const parsed = parseSTL(buffer);
        
        if (parsed.triangleCount === 0) {
          throw new Error('No se detectaron triángulos válidos en el archivo STL.');
        }
        
        setParsedData(parsed);
      } catch (err) {
        console.error(err);
        setError('Error al procesar el archivo STL. Puede que esté dañado o vacío.');
        setFile(null);
        setParsedData(null);
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setError('Error al leer el archivo.');
      setIsParsing(false);
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Load programmatic sample torus knot
  const loadSampleModel = () => {
    setIsParsing(true);
    setError(null);
    
    // Simulate slight loading for feel
    setTimeout(() => {
      try {
        const sample = generateSampleTorusKnot();
        
        // Mock File object
        const mockFile = new File([], 'calibracion_torus_nudo_3d.stl');
        setFile(mockFile);
        setParsedData(sample);
      } catch (err) {
        setError('No se pudo cargar el modelo de prueba.');
      } finally {
        setIsParsing(false);
      }
    }, 400);
  };

  // Printing Quoting Calculations (Real-time)
  const calculateStatsAndPrice = () => {
    if (!parsedData) return { weight: 0, time: 0, materialCost: 0, machineCost: 0, setupFee: 0, total: 0 };

    const vol = parsedData.volumeCm3;
    const density = selectedMaterial.density;
    
    // Weight: volume * density * (shell_offset + infill_offset)
    // 20% outer shell (perimeter) is solid, remaining 80% scales with infill density
    const infillRatio = infill / 100;
    const weightGrams = vol * density * (0.22 + 0.78 * infillRatio);
    const finalWeight = parseFloat(Math.max(1, weightGrams).toFixed(1));

    // Print Time: Volume and resolution dependent
    // Base print speed modifier
    let speedMod = 1.0;
    if (selectedMaterialId === 'tpu') speedMod = 1.7; // TPU prints very slowly
    if (selectedMaterialId === 'abs') speedMod = 1.15; // ABS needs slow speeds
    
    // Layer height modifier: smaller layers take much longer (e.g. 0.12mm takes ~60% longer than 0.20mm)
    const heightMod = 0.20 / layerHeight;
    
    // Base estimation: ~12 mins per cm3 of filament at 0.2mm standard height
    const baseMinutesPerCm3 = 12;
    const estimatedMinutes = vol * baseMinutesPerCm3 * heightMod * speedMod;
    const printTimeHours = parseFloat(Math.max(0.5, estimatedMinutes / 60).toFixed(1));

    // Pricing formulas
    const materialCost = finalWeight * selectedMaterial.costPerGram;
    const machineCost = printTimeHours * 1.60; // $1.60 machine rate per hour (wear, power, space)
    const setupFee = 3.50; // $3.50 fixed setup slicing and bed prep fee

    const singleTotal = materialCost + machineCost + setupFee;
    const totalWithQuantity = parseFloat((singleTotal * quantity).toFixed(2));

    return {
      weight: finalWeight,
      time: printTimeHours,
      materialCost: parseFloat((materialCost * quantity).toFixed(2)),
      machineCost: parseFloat((machineCost * quantity).toFixed(2)),
      setupFee: parseFloat((setupFee * quantity).toFixed(2)),
      total: totalWithQuantity,
      singlePrice: parseFloat(singleTotal.toFixed(2))
    };
  };

  const quote = calculateStatsAndPrice();

  // Add to Cart Action
  const handleAddToCart = () => {
    if (!parsedData || !file) return;

    const item: CartItem = {
      id: `custom-${selectedMaterialId}-${selectedColorId}-${Date.now()}`,
      type: 'custom',
      name: `Pedido Personalizado: ${file.name}`,
      materialId: selectedMaterialId,
      colorId: selectedColorId,
      quantity,
      price: quote.singlePrice,
      weight: quote.weight,
      infill,
      layerHeight,
      dimensionsStr: `${Math.round(parsedData.dimensions.x)}x${Math.round(parsedData.dimensions.y)}x${Math.round(parsedData.dimensions.z)} mm`,
      customFile: {
        name: file.name,
        size: file.size || 1048576, // 1MB mock if sample
        volumeCm3: parsedData.volumeCm3,
        dimensions: parsedData.dimensions
      }
    };

    onAddCustomToCart(item);

    setShowCartNotification(true);
    setTimeout(() => {
      setShowCartNotification(false);
    }, 3000);
  };

  // Submit Direct Order (Quoting System)
  const handleSubmitDirectOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedData || !file || !clientName || !clientEmail) return;

    const newOrder: CustomOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName,
      clientEmail,
      fileName: file.name,
      fileSize: file.size || 145000,
      volumeCm3: parseFloat(parsedData.volumeCm3.toFixed(2)),
      dimensions: {
        x: parseFloat(parsedData.dimensions.x.toFixed(1)),
        y: parseFloat(parsedData.dimensions.y.toFixed(1)),
        z: parseFloat(parsedData.dimensions.z.toFixed(1))
      },
      materialId: selectedMaterialId,
      colorId: selectedColorId,
      infill,
      layerHeight,
      weightGrams: quote.weight,
      estimatedPrice: quote.total,
      status: 'pending', // Starts as pending workshop review
      createdAt: new Date().toLocaleDateString('es-AR')
    };

    onSubmitOrderDirectly(newOrder);
    setIsSubmitted(true);
  };

  const handleResetForm = () => {
    setFile(null);
    setParsedData(null);
    setClientName('');
    setClientEmail('');
    setIsSubmitted(false);
    setSelectedMaterialId('pla');
    setSelectedColorId('c-negro');
    setInfill(15);
    setLayerHeight(0.20);
    setQuantity(1);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl" id="custom-quote-form">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-400" />
          Servicio de Impresión Personalizada STL
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Carga tu diseño 3D en formato `.STL` para obtener una cotización física instantánea y previsualizar tu filamento en 3D interactivo.
        </p>
      </div>

      {!file ? (
        // FILE UPLOAD DROP ZONE
        <div 
          id="dropzone"
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center min-h-[340px] ${
            isDragActive 
              ? 'border-cyan-500 bg-cyan-500/5 shadow-inner sleek-cyan-glow' 
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/60'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".stl" 
            className="hidden" 
            id="stl-file-upload-input"
          />
          
          {isParsing ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-200 font-bold">Procesando geometría 3D...</p>
              <p className="text-slate-500 text-xs mt-1">Calculando volumen exacto y contornos</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-4 shadow-md">
                <Upload className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-1">Arrastra tu archivo .STL aquí</h3>
              <p className="text-slate-500 text-xs mb-6 max-w-sm leading-normal">
                Formatos soportados: STL binario y ASCII. Tamaño máximo sugerido: 40 MB.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  id="btn-upload-file"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all cursor-pointer shadow-lg hover:scale-102 sleek-cyan-glow"
                >
                  Seleccionar Archivo
                </button>
                <button
                  type="button"
                  id="btn-load-sample-stl"
                  onClick={loadSampleModel}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-sm transition-all cursor-pointer hover:scale-102"
                >
                  Usar Modelo de Prueba 3D
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-medium">
              {error}
            </div>
          )}
        </div>
      ) : (
        // ACTIVE CONFIGURATION & VIEWER PAGE
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 3D VIEWER COLUMN (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center justify-between bg-slate-950 border border-slate-800/80 p-3 rounded-xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileCode className="w-5 h-5 text-cyan-400 shrink-0" />
                <div className="truncate">
                  <div className="text-xs text-slate-400 font-semibold">Archivo Cargado</div>
                  <div className="text-sm font-bold text-slate-200 truncate">{file.name}</div>
                </div>
              </div>
              <button
                type="button"
                id="btn-remove-stl"
                onClick={handleResetForm}
                className="text-[11px] font-bold text-slate-400 hover:text-red-400 px-2 py-1 rounded bg-slate-900 border border-slate-800/60 cursor-pointer"
              >
                Cambiar
              </button>
            </div>

            {parsedData && (
              <STLViewer 
                positions={parsedData.positions} 
                colorHex={selectedColor.hex}
                finishType={selectedColor.type}
                className="aspect-square w-full"
              />
            )}

            {/* Model stats summary */}
            {parsedData && (
              <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 space-y-2.5">
                <h4 className="text-[11px] font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1">
                  <Box className="w-3.5 h-3.5" />
                  Dimensiones de la Pieza
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-900 border border-slate-800/40 p-2 rounded-lg">
                    <span className="block text-[10px] text-slate-500 font-medium">Ancho (X)</span>
                    <span className="text-xs font-bold text-slate-300">{Math.round(parsedData.dimensions.x * 10) / 10} mm</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800/40 p-2 rounded-lg">
                    <span className="block text-[10px] text-slate-500 font-medium">Largo (Y)</span>
                    <span className="text-xs font-bold text-slate-300">{Math.round(parsedData.dimensions.y * 10) / 10} mm</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800/40 p-2 rounded-lg">
                    <span className="block text-[10px] text-slate-500 font-medium">Alto (Z)</span>
                    <span className="text-xs font-bold text-slate-300">{Math.round(parsedData.dimensions.z * 10) / 10} mm</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Volumen Neto:</span>
                  <span className="font-bold text-slate-200">{parsedData.volumeCm3.toFixed(2)} cm³</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Triángulos:</span>
                  <span className="font-mono text-slate-300">{parsedData.triangleCount.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* CONFIGURATION OPTIONS (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                // FORM OPTIONS
                <motion.div 
                  key="options-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  {/* Material config */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        Tipo de Filamento
                      </label>
                      <span className="text-[11px] text-cyan-400 font-semibold">{selectedMaterial.finish}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {MATERIALS.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMaterialId(m.id)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedMaterialId === m.id
                              ? 'bg-cyan-500/10 border-cyan-500 shadow-lg shadow-cyan-950/20 sleek-cyan-glow'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <div className="font-bold text-xs text-slate-200">{m.displayName}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{m.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colors config */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase">
                      Color de Impresión: <span className="text-slate-200 font-semibold capitalize">{selectedColor.name}</span>
                    </label>
                    <div className="flex flex-wrap gap-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800/60">
                      {COLORS.map(c => {
                        const isSel = selectedColorId === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedColorId(c.id)}
                            className={`relative w-8 h-8 rounded-full cursor-pointer transition-all ${
                              isSel 
                                ? 'ring-2 ring-offset-2 ring-offset-slate-950 ring-cyan-400 scale-110 shadow-lg sleek-cyan-glow' 
                                : 'hover:scale-105 border border-slate-800'
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          >
                            {isSel && (
                              <CheckCircle2 
                                className={`absolute inset-0 m-auto w-4.5 h-4.5 ${
                                  c.id === 'c-blanco' ? 'text-slate-950' : 'text-white'
                                }`} 
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sliders (Infill and Layers) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
                    {/* Infill Density Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1">
                          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                          Densidad Relleno (Infill)
                        </span>
                        <span className="font-bold text-cyan-400">{infill}%</span>
                      </div>
                      <input 
                        type="range"
                        id="infill-density-range"
                        min="10"
                        max="80"
                        step="5"
                        value={infill}
                        onChange={(e) => setInfill(parseInt(e.target.value))}
                        className="w-full accent-cyan-500 bg-slate-900 rounded-lg appearance-none h-1.5 cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
                        <span>10% (Liviano)</span>
                        <span>25% (Fuerte)</span>
                        <span>60%+ (Sólido)</span>
                      </div>
                    </div>

                    {/* Layer Height Selector */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1">
                        <Box className="w-3.5 h-3.5 text-cyan-400" />
                        Resolución (Capa)
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { val: 0.12, name: 'Detalle (0.12)' },
                          { val: 0.20, name: 'Estándar (0.20)' },
                          { val: 0.28, name: 'Borrador (0.28)' }
                        ].map(opt => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => setLayerHeight(opt.val)}
                            className={`py-2 rounded-lg border text-[10px] text-center font-bold transition-all cursor-pointer ${
                              layerHeight === opt.val
                                ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 sleek-cyan-glow'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                            }`}
                          >
                            {opt.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Stats panel */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse-once">
                    {/* Live Weight */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-cyan-400 border border-slate-800/60 sleek-cyan-glow">
                        <Scale className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Peso Estimado</div>
                        <div className="text-lg font-black text-slate-200">{quote.weight * quantity}g</div>
                        <div className="text-[9px] text-slate-400">Total de filamento</div>
                      </div>
                    </div>

                    {/* Live Time */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-amber-400 border border-slate-800/60">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Tiempo de Impresión</div>
                        <div className="text-lg font-black text-slate-200">{quote.time * quantity} hs</div>
                        <div className="text-[9px] text-slate-400">Duración estimada</div>
                      </div>
                    </div>

                    {/* Live Cost */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400 border border-slate-800/60">
                        <Coins className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Cotización Total</div>
                        <div className="text-lg font-black text-emerald-400">${quote.total}</div>
                        <div className="text-[9px] text-slate-400">Mano de obra y material</div>
                      </div>
                    </div>
                  </div>

                  {/* BUY OR DIRECT INVOICE FORM SECTIONS */}
                  <div className="border-t border-slate-800/60 pt-5 space-y-4">
                    {/* Choice 1: Add custom STL directly to Cart */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-between bg-slate-950/40 p-4 rounded-xl border border-slate-800/40">
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">¿Quieres agregar al Carrito?</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Agrégalo para pagarlo junto con otros productos de la tienda.</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Quantity picker */}
                        <div className="flex items-center border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                          <button
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="px-2 py-1 text-slate-400 hover:text-slate-100"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs text-slate-200 font-semibold w-6 text-center">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(quantity + 1)}
                            className="px-2 py-1 text-slate-400 hover:text-slate-100"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          id="btn-add-custom-to-cart"
                          onClick={handleAddToCart}
                          className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md sleek-cyan-glow"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Agregar al Carrito
                        </button>
                      </div>
                    </div>

                    {/* Choice 2: Direct Custom Order Form Submission */}
                    <form onSubmit={handleSubmitDirectOrder} className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-3.5">
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-300">
                        <Info className="w-4 h-4 text-cyan-400" />
                        <span>¿Prefieres enviar tu diseño para revisión directa?</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Ingresa tus datos y enviaremos tu STL para que nuestro taller apruebe el archivo. No requiere pagar ahora.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                            <User className="w-3 h-3 text-slate-500" />
                            Nombre Completo
                          </div>
                          <input 
                            type="text"
                            required
                            id="custom-order-client-name"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="Ej. Juan Pérez"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                            <Mail className="w-3 h-3 text-slate-500" />
                            Correo Electrónico
                          </div>
                          <input 
                            type="email"
                            required
                            id="custom-order-client-email"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            placeholder="juan@email.com"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        id="btn-submit-custom-order"
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg hover:shadow-cyan-500/10 cursor-pointer sleek-cyan-glow"
                      >
                        Enviar Solicitud de Impresión
                      </button>
                    </form>
                  </div>
                </motion.div>
              ) : (
                // SUCCESS SUBMISSION MESSAGE
                <motion.div 
                  key="success-form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12 px-6 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center h-full"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mb-4 shadow-lg animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-100 mb-2">¡Pedido Personalizado Recibido!</h3>
                  <p className="text-slate-400 text-sm max-w-md leading-relaxed mb-6">
                    Hola <strong className="text-slate-200">{clientName}</strong>, tu archivo <code className="bg-slate-900 px-1.5 py-0.5 rounded text-sky-400 font-mono text-xs">{file.name}</code> ha sido enviado con éxito a nuestro taller de impresión 3D.
                  </p>
                  
                  <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 w-full max-w-sm mb-6 text-left space-y-1.5 text-xs text-slate-400">
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">Material:</span> <span className="font-bold text-slate-200">{selectedMaterial.displayName}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">Color:</span> <span className="font-bold text-slate-200">{selectedColor.name}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">Resolución:</span> <span className="font-bold text-slate-200">{layerHeight} mm</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-slate-500">Relleno:</span> <span className="font-bold text-slate-200">{infill}%</span></div>
                    <div className="flex justify-between border-t border-slate-800 pt-1.5 text-sm font-extrabold text-slate-300"><span>Costo Cotizado:</span> <span className="text-emerald-400">${quote.total}</span></div>
                  </div>

                  <p className="text-xs text-slate-500 mb-6">
                    Se ha generado una orden de seguimiento en la pestaña "Mis Pedidos". Hemos enviado detalles a {clientEmail}.
                  </p>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      id="btn-sub-reset"
                      onClick={handleResetForm}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Cargar otro STL
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Cart added notification */}
      {showCartNotification && (
        <motion.div 
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 50, x: '-50%' }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 font-black text-sm px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-50 border border-emerald-400/25"
        >
          <CheckCircle2 className="w-5 h-5 text-slate-950" />
          ¡STL agregado con éxito al Carrito de Impresión!
        </motion.div>
      )}
    </div>
  );
}
