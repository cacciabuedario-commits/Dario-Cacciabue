import { Product, Material, Color } from '../types';

// Import our beautifully generated images
import headphoneStandImg from '../assets/images/headphone_stand_1783979977009.jpg';
import selfWateringPotImg from '../assets/images/self_watering_pot_1783979989165.jpg';
import articulatedDragonImg from '../assets/images/articulated_dragon_1783979999876.jpg';
import deskOrganizerImg from '../assets/images/desk_organizer_1783980010031.jpg';

export const MATERIALS: Material[] = [
  {
    id: 'pla',
    name: 'PLA (Ácido Poliláctico)',
    displayName: 'PLA Económico',
    density: 1.24, // g/cm³
    costPerGram: 0.04, // $ per gram
    description: 'Biodegradable, fácil de imprimir, excelente acabado superficial. Ideal para figuras, maquetas y uso general.',
    strength: 3,
    flexibility: 1,
    finish: 'Mate o Seda satinado'
  },
  {
    id: 'petg',
    name: 'PETG (Tereftalato de Polietileno)',
    displayName: 'PETG Resistente',
    density: 1.27,
    costPerGram: 0.05,
    description: 'Excelente resistencia mecánica y química, resistente a la intemperie y temperatura. Ideal para partes funcionales y recipientes.',
    strength: 4,
    flexibility: 2,
    finish: 'Brillante'
  },
  {
    id: 'tpu',
    name: 'TPU (Poliuretano Termoplástico)',
    displayName: 'TPU Flexible',
    density: 1.21,
    costPerGram: 0.08,
    description: 'Extremadamente flexible y elástico, similar a la goma. Gran absorción de impactos y resistencia al desgaste. Perfecto para fundas o topes.',
    strength: 3,
    flexibility: 5,
    finish: 'Goma Semi-Mate'
  },
  {
    id: 'abs',
    name: 'ABS (Acrilonitrilo Butadieno Estireno)',
    displayName: 'ABS Industrial',
    density: 1.04,
    costPerGram: 0.06,
    description: 'Soporta altas temperaturas, muy resistente a impactos y tenaz. Se puede lijar y post-procesar con acetona. Para aplicaciones mecánicas.',
    strength: 5,
    flexibility: 2,
    finish: 'Mate industrial'
  }
];

export const COLORS: Color[] = [
  { id: 'c-negro', name: 'Negro Profundo', hex: '#1E1E1E', type: 'mate' },
  { id: 'c-blanco', name: 'Blanco Nieve', hex: '#F9F9F9', type: 'mate' },
  { id: 'c-dorado', name: 'Oro Seda Imperial', hex: '#D4AF37', type: 'seda' },
  { id: 'c-plata', name: 'Plata Metalizado', hex: '#C0C0C0', type: 'metalico' },
  { id: 'c-rojo', name: 'Rojo Fuego', hex: '#DC2626', type: 'brillante' },
  { id: 'c-azul', name: 'Azul Eléctrico', hex: '#2563EB', type: 'mate' },
  { id: 'c-naranja', name: 'Naranja Cítrico', hex: '#F97316', type: 'brillante' },
  { id: 'c-verde', name: 'Verde Oliva Silvestre', hex: '#15803D', type: 'mate' }
];

export const PRODUCTS: Product[] = [
  {
    id: 'headphone-stand',
    name: 'Soporte Geométrico Premium para Auriculares',
    description: 'Organiza tu escritorio con un soporte arquitectónico de alta resistencia, diseñado con curvas fluidas y centro de gravedad balanceado.',
    basePrice: 24.99,
    estimatedHours: 6,
    dimensions: '120 x 120 x 250 mm',
    image: headphoneStandImg,
    defaultColorId: 'c-negro',
    defaultMaterialId: 'pla',
    features: [
      'Base pesada anti-deslizante',
      'Curvatura superior protectora de diadema',
      'Diseño en una sola pieza ultra-resistente',
      'Acabado texturizado elegante'
    ]
  },
  {
    id: 'self-watering-pot',
    name: 'Maceta Hexagonal Auto-Riego Inteligente',
    description: 'Sistema modular de dos piezas que almacena agua en la base y la dosifica por capilaridad. Perfecta para suculentas y plantas de interior.',
    basePrice: 16.50,
    estimatedHours: 4.5,
    dimensions: '100 x 100 x 90 mm',
    image: selfWateringPotImg,
    defaultColorId: 'c-blanco',
    defaultMaterialId: 'petg',
    features: [
      'Depósito de agua integrado para hasta 2 semanas',
      'Rejilla de ventilación para raíces sanas',
      'Plástico impermeable no tóxico',
      'Acoplamiento rápido de seguridad'
    ]
  },
  {
    id: 'articulated-dragon',
    name: 'Dragón de Cristal Articulado Coleccionable',
    description: 'Increíble pieza impresa en sistema "Print-in-Place" (todas las articulaciones impresas juntas sin ensambles). Gran flexibilidad y detalles escamosos brillantes.',
    basePrice: 19.99,
    estimatedHours: 5,
    dimensions: '450 x 35 x 30 mm (extendido)',
    image: articulatedDragonImg,
    defaultColorId: 'c-dorado',
    defaultMaterialId: 'pla',
    features: [
      'Más de 40 puntos de articulación fluida',
      'Brillo nacarado metálico',
      'Increíble efecto anti-estrés',
      'Diseño exclusivo de fantasía'
    ]
  },
  {
    id: 'desk-organizer',
    name: 'Organizador Modular Bento de Escritorio',
    description: 'Mantén todo ordenado. Contiene compartimentos específicos para bolígrafos, clips, llaves, memoria USB y ranura para colocar el smartphone.',
    basePrice: 14.99,
    estimatedHours: 3.5,
    dimensions: '180 x 120 x 50 mm',
    image: deskOrganizerImg,
    defaultColorId: 'c-naranja',
    defaultMaterialId: 'pla',
    features: [
      'Ranura universal para celular (horizontal/vertical)',
      'Compartimentos imantados para clips',
      'Bases de goma anti-deslizantes',
      'Diseño bento apilable'
    ]
  }
];
