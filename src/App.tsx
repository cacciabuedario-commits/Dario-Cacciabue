import { useState, useEffect } from 'react';
import { Product, Material, Color, CartItem, CustomOrder, OrderStatus } from './types';
import { PRODUCTS, MATERIALS, COLORS } from './data/shopData';
import ProductCard from './components/ProductCard';
import CustomQuoteForm from './components/CustomQuoteForm';
import Cart from './components/Cart';
import AdminPanel from './components/AdminPanel';
import { 
  Box, ShoppingCart, Sparkles, ClipboardList, 
  HelpCircle, Printer, MessageSquare, ShieldCheck, Settings, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getOrdersFromFirebase, saveOrderToFirebase, updateOrderStatusInFirebase } from './lib/firebase';

// Seed some initial 3D printing orders for a live, professional look immediately on boot
const SEEDED_ORDERS: CustomOrder[] = [
  {
    id: 'ORD-4319',
    clientName: 'Andrés Gómez',
    clientEmail: 'andres@gomez.com',
    fileName: 'soporte_auriculares_ergonomico.stl',
    fileSize: 2450000,
    volumeCm3: 84.5,
    dimensions: { x: 120, y: 120, z: 250 },
    materialId: 'pla',
    colorId: 'c-dorado',
    infill: 20,
    layerHeight: 0.12,
    weightGrams: 98.4,
    estimatedPrice: 32.50,
    status: 'printing', // Currently printing! Shows animated spinner
    createdAt: '11/07/2026',
    adminNotes: 'Imprimiendo en impresora #Bambu-X1C-3. Capa 580 de 2083. Temperatura estable.'
  },
  {
    id: 'ORD-7281',
    clientName: 'Sofía Castro',
    clientEmail: 'sofia.castro@diseno.cl',
    fileName: 'maceta_hexagonal_autorriego.stl',
    fileSize: 4120000,
    volumeCm3: 65.2,
    dimensions: { x: 100, y: 100, z: 90 },
    materialId: 'petg',
    colorId: 'c-azul',
    infill: 15,
    layerHeight: 0.20,
    weightGrams: 72.8,
    estimatedPrice: 18.90,
    status: 'completed', // Completed order
    createdAt: '08/07/2026',
    adminNotes: 'Soportes removidos con éxito. Nivel de estanqueidad testeado en agua.'
  },
  {
    id: 'ORD-1092',
    clientName: 'Carlos Pérez',
    clientEmail: 'carlos@perez-ingenieria.ar',
    fileName: 'engranaje_reductor_abs.stl',
    fileSize: 185000,
    volumeCm3: 28.3,
    dimensions: { x: 50, y: 50, z: 15 },
    materialId: 'abs',
    colorId: 'c-negro',
    infill: 40,
    layerHeight: 0.20,
    weightGrams: 31.5,
    estimatedPrice: 14.50,
    status: 'quoted', // Waiting for client approval!
    createdAt: '13/07/2026',
    adminNotes: 'Grosor de dientes validado. Se requiere cama a 100C y cámara cerrada para evitar warping.'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'tienda' | 'personalizado' | 'tracker' | 'carrito'>('tienda');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<CustomOrder[]>(() => {
    // Fallback to local storage or seeded orders immediately on boot before Firebase loads
    const saved = localStorage.getItem('dimension3d_orders');
    return saved ? JSON.parse(saved) : SEEDED_ORDERS;
  });
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(false);
  const [firebaseLoading, setFirebaseLoading] = useState<boolean>(true);

  useEffect(() => {
    document.title = "Dimension 3D - Impresión Personalizada";
  }, []);

  // Fetch orders from Firebase Firestore on mount
  useEffect(() => {
    async function loadFirebaseOrders() {
      try {
        setFirebaseLoading(true);
        const fbOrders = await getOrdersFromFirebase(SEEDED_ORDERS);
        setOrders(fbOrders);
        setFirebaseConnected(true);
      } catch (err) {
        console.warn("Could not connect to Firebase, using local fallback:", err);
        setFirebaseConnected(false);
      } finally {
        setFirebaseLoading(false);
      }
    }
    loadFirebaseOrders();
  }, []);

  // Sync orders to localStorage on change as a fallback / cache
  useEffect(() => {
    localStorage.setItem('dimension3d_orders', JSON.stringify(orders));
  }, [orders]);

  // Cart operations
  const handleAddToCart = (item: CartItem) => {
    setCart(prevCart => {
      // For catalog items, we can check if they already exist with same material and color
      if (item.type === 'catalog') {
        const existingIdx = prevCart.findIndex(
          i => i.productId === item.productId && 
               i.materialId === item.materialId && 
               i.colorId === item.colorId
        );
        if (existingIdx > -1) {
          const updated = [...prevCart];
          updated[existingIdx].quantity += item.quantity;
          return updated;
        }
      }
      return [...prevCart, item];
    });
  };

  const handleUpdateQuantity = (id: string, qty: number) => {
    setCart(prevCart => 
      prevCart.map(item => item.id === id ? { ...item, quantity: qty } : item)
    );
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  // Add custom order from quote directly (outside cart flow)
  const handleAddDirectCustomOrder = async (newOrder: CustomOrder) => {
    // Save locally first for instant UI response
    setOrders(prevOrders => [newOrder, ...prevOrders]);

    // Save to Firebase asynchronously
    try {
      await saveOrderToFirebase(newOrder);
    } catch (err) {
      console.error("Failed to sync custom order to Firebase:", err);
    }

    // Navigate straight to tracker tab so they see it
    setTimeout(() => {
      setActiveTab('tracker');
    }, 400);
  };

  // Cart Checkout
  const handleCheckoutComplete = async (clientName: string, clientEmail: string, deliveryType: 'delivery' | 'pickup', address: string) => {
    // Convert all shopping cart items into printed orders inside our live tracker!
    const newOrders: CustomOrder[] = cart.map((item, idx) => {
      const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        id: orderId,
        clientName,
        clientEmail,
        fileName: item.name,
        fileSize: item.customFile?.size || 145000,
        volumeCm3: item.customFile?.volumeCm3 || parseFloat((item.weight / 1.25).toFixed(1)),
        dimensions: item.customFile?.dimensions || { x: 120, y: 120, z: 80 },
        materialId: item.materialId,
        colorId: item.colorId,
        infill: item.infill || 15,
        layerHeight: item.layerHeight || 0.20,
        weightGrams: item.weight * item.quantity,
        estimatedPrice: parseFloat((item.price * item.quantity).toFixed(2)),
        status: 'approved', // Checkout items are fully paid/approved, go straight to printing queue!
        createdAt: new Date().toLocaleDateString('es-AR'),
        adminNotes: deliveryType === 'delivery' 
          ? `Despacho a: ${address}. Cantidad: ${item.quantity}u.` 
          : `Retiro por taller. Cantidad: ${item.quantity}u.`
      };
    });

    setOrders(prevOrders => [...newOrders, ...prevOrders]);
    setCart([]); // clear cart
    setActiveTab('tracker'); // redirect to tracking

    // Sync to Firebase asynchronously
    try {
      for (const order of newOrders) {
        await saveOrderToFirebase(order);
      }
    } catch (err) {
      console.error("Failed to sync checkout orders to Firebase:", err);
    }
  };

  // Admin status modifier
  const handleUpdateOrderStatus = async (id: string, status: OrderStatus, notes?: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === id 
          ? { ...order, status, adminNotes: notes } 
          : order
      )
    );

    // Sync status update to Firebase
    try {
      await updateOrderStatusInFirebase(id, status, notes);
    } catch (err) {
      console.error(`Failed to update order status for ${id} in Firebase:`, err);
    }
  };

  const cartItemsCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between" id="app-root">
      
      {/* GLOW DECORATIONS */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[250px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[200px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* TOP DECORATIVE STATUS BAR */}
      <div className="bg-slate-900 border-b border-slate-800/60 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-slate-400 z-10">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            Taller: Activo (Bambu X1C x3, Prusa MK4 x2)
          </span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline">Camas calientes listas: PLA, PETG, TPU, ABS</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          {firebaseLoading ? (
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              Sincronizando Firestore...
            </span>
          ) : firebaseConnected ? (
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold sleek-cyan-text-shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              Firestore: Conectado
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
              Firestore: Modo Local
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Slicing validado automáticamente</span>
        </div>
      </div>

      {/* APPLICATION CONTAINER */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 flex-grow flex flex-col gap-6">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-slate-950 shadow-xl shadow-cyan-950/20 relative group sleek-cyan-glow">
              <Printer className="w-6 h-6 text-slate-950" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-slate-950 animate-ping"></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-slate-950"></div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-2xl font-black text-slate-100 tracking-tight">DIMENSION 3D</h1>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 font-bold border border-cyan-900 px-2 py-0.5 rounded-full uppercase tracking-wider">Lab de Impresión</span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">Tienda y cotizador de filamento con previsualización en tiempo real</p>
            </div>
          </div>

          {/* MAIN TABS MENU */}
          <nav className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800/60 shadow-md">
            <button
              type="button"
              id="tab-btn-tienda"
              onClick={() => setActiveTab('tienda')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'tienda' 
                  ? 'bg-cyan-500 text-slate-950 shadow-lg font-black sleek-cyan-glow' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Catálogo Productos
            </button>
            <button
              type="button"
              id="tab-btn-personalizado"
              onClick={() => setActiveTab('personalizado')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'personalizado' 
                  ? 'bg-cyan-500 text-slate-950 shadow-lg font-black sleek-cyan-glow' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              Cotizar STL 3D
            </button>
            <button
              type="button"
              id="tab-btn-tracker"
              onClick={() => setActiveTab('tracker')}
              className={`relative px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'tracker' 
                  ? 'bg-cyan-500 text-slate-950 shadow-lg font-black sleek-cyan-glow' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Cola de Impresión
              {orders.length > 0 && (
                <span className={`w-2 h-2 rounded-full absolute top-1.5 right-1.5 ${
                  orders.some(o => o.status === 'printing') ? 'bg-cyan-400 animate-ping' : 'bg-slate-400'
                }`} />
              )}
            </button>
            <button
              type="button"
              id="tab-btn-carrito"
              onClick={() => setActiveTab('carrito')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'carrito' 
                  ? 'bg-cyan-500 text-slate-950 shadow-lg font-black sleek-cyan-glow' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Carrito
              {cartItemsCount > 0 && (
                <span className="bg-cyan-950 text-cyan-400 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-cyan-900 shadow">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </nav>
        </header>

        {/* MAIN BODY LAYOUT */}
        <main className="flex-grow">
          <AnimatePresence mode="wait">
            {activeTab === 'tienda' && (
              <motion.div
                key="tienda-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
                id="tab-content-tienda"
              >
                {/* Intro banner */}
                <div className="bg-gradient-to-r from-cyan-950/20 via-slate-900/40 to-slate-950 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-slate-100">¿Quieres imprimir algo prediseñado?</h2>
                    <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
                      Explora nuestro catálogo exclusivo de piezas funcionales, decorativas e ingenieriles altamente probadas por nuestra comunidad de diseño. Puedes configurar colores, materiales y cantidades antes de encargar tu impresión.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('personalizado')}
                    className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-cyan-400 font-bold text-xs shrink-0 flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
                  >
                    <Box className="w-4 h-4 text-cyan-400" />
                    Quiero Cotizar mi propio STL
                  </button>
                </div>

                {/* Catalog Products Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="products-grid">
                  {PRODUCTS.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAddToCart={handleAddToCart} 
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'personalizado' && (
              <motion.div
                key="personalizado-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                id="tab-content-personalizado"
              >
                <CustomQuoteForm 
                  onAddCustomToCart={handleAddToCart}
                  onSubmitOrderDirectly={handleAddDirectCustomOrder}
                />
              </motion.div>
            )}

            {activeTab === 'tracker' && (
              <motion.div
                key="tracker-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                id="tab-content-tracker"
              >
                <AdminPanel 
                  orders={orders} 
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                />
              </motion.div>
            )}

            {activeTab === 'carrito' && (
              <motion.div
                key="carrito-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                id="tab-content-carrito"
              >
                <Cart 
                  cartItems={cart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveFromCart}
                  onCheckoutComplete={handleCheckoutComplete}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="bg-slate-900/40 border-t border-slate-800/80 mt-12 py-8 px-4 text-center text-xs text-slate-500 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">DIMENSION 3D</span>
            <span>• © 2026 Impresión FDM & SLA de Alta Precisión</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Slicing Seguro</span>
            <span>•</span>
            <span>Ayuda Técnica STL</span>
            <span>•</span>
            <span>Ubicación: Buenos Aires, Argentina</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
