export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  estimatedHours: number;
  dimensions: string;
  image: string;
  defaultColorId: string;
  defaultMaterialId: string;
  features: string[];
}

export interface Material {
  id: string;
  name: string;
  displayName: string;
  density: number; // g/cm³
  costPerGram: number; // Cost in USD or simulated value
  description: string;
  strength: number; // 1 to 5
  flexibility: number; // 1 to 5
  finish: string; // matte, silk, semi-gloss
}

export interface Color {
  id: string;
  name: string;
  hex: string;
  type: 'mate' | 'brillante' | 'seda' | 'translucido' | 'metalico';
}

export interface CartItem {
  id: string; // unique cart item id
  type: 'catalog' | 'custom';
  productId?: string; // only for catalog
  name: string;
  materialId: string;
  colorId: string;
  quantity: number;
  price: number;
  weight: number; // grams
  infill?: number; // for custom
  layerHeight?: number; // for custom
  dimensionsStr?: string;
  customFile?: {
    name: string;
    size: number;
    volumeCm3: number;
    dimensions: { x: number; y: number; z: number };
  };
}

export type OrderStatus = 'pending' | 'quoted' | 'approved' | 'printing' | 'shipped' | 'completed';

export interface CustomOrder {
  id: string;
  clientName: string;
  clientEmail: string;
  fileName: string;
  fileSize: number;
  volumeCm3: number;
  dimensions: { x: number; y: number; z: number };
  materialId: string;
  colorId: string;
  infill: number; // percentage
  layerHeight: number; // mm
  weightGrams: number;
  estimatedPrice: number;
  status: OrderStatus;
  createdAt: string;
  adminNotes?: string;
}
