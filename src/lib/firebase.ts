import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { CustomOrder } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyCb0Vr7PYc2EKkOcW09ldCmiIYxmZhZy-8",
  authDomain: "cellular-chassis-n40ks.firebaseapp.com",
  projectId: "cellular-chassis-n40ks",
  storageBucket: "cellular-chassis-n40ks.firebasestorage.app",
  messagingSenderId: "440344786154",
  appId: "1:440344786154:web:45004059bde1f430cd9393"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the custom databaseId from config
export const db = getFirestore(app, "ai-studio-dimension3d-db2d6bf9-841f-4b81-bd56-b4164a94a0d4");

const ORDERS_COLLECTION = 'orders';

/**
 * Fetch all orders from Firestore.
 * If the collection is empty, seeds it with initial default orders and returns them.
 */
export async function getOrdersFromFirebase(seededOrders: CustomOrder[]): Promise<CustomOrder[]> {
  try {
    const ordersCol = collection(db, ORDERS_COLLECTION);
    const q = query(ordersCol);
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('Firestore is empty. Seeding database with default orders...');
      // Seed orders one by one
      for (const order of seededOrders) {
        await setDoc(doc(db, ORDERS_COLLECTION, order.id), order);
      }
      return seededOrders;
    }
    
    const orders: CustomOrder[] = [];
    snapshot.forEach((document) => {
      orders.push(document.data() as CustomOrder);
    });
    
    // Sort orders (newer first, assuming standard ID or custom sort if needed, or sort by date/id)
    // Let's sort them so newest created ones are first
    return orders.sort((a, b) => {
      // Parse DD/MM/YYYY or similar if available, fallback to id sort
      const dateA = parseDateString(a.createdAt);
      const dateB = parseDateString(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error('Error fetching orders from Firebase, falling back to local storage:', error);
    throw error;
  }
}

/**
 * Helper to parse custom "DD/MM/YYYY" format
 */
function parseDateString(dateStr: string): Date {
  try {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(dateStr);
  } catch {
    return new Date();
  }
}

/**
 * Save a new order to Firebase.
 */
export async function saveOrderToFirebase(order: CustomOrder): Promise<void> {
  try {
    const orderDocRef = doc(db, ORDERS_COLLECTION, order.id);
    await setDoc(orderDocRef, order);
    console.log(`Order ${order.id} saved to Firebase successfully.`);
  } catch (error) {
    console.error(`Error saving order ${order.id} to Firebase:`, error);
    throw error;
  }
}

/**
 * Update an existing order status and notes in Firebase.
 */
export async function updateOrderStatusInFirebase(id: string, status: string, adminNotes?: string): Promise<void> {
  try {
    const orderDocRef = doc(db, ORDERS_COLLECTION, id);
    const updates: Record<string, any> = { status };
    if (adminNotes !== undefined) {
      updates.adminNotes = adminNotes;
    }
    await updateDoc(orderDocRef, updates);
    console.log(`Order ${id} status updated to ${status} in Firebase.`);
  } catch (error) {
    console.error(`Error updating order ${id} in Firebase:`, error);
    throw error;
  }
}
