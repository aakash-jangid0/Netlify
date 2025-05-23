export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  customerInfo: {
    name: string;
    phone?: string;
    email?: string;
    tableNumber?: string;
  };
  orderType: 'dine-in' | 'takeaway';
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'upi';
  paymentStatus: 'pending' | 'completed' | 'failed';
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  preparationTime: number;
  isAvailable: boolean;
  dietaryTags: string[];
  spiceLevel?: 'mild' | 'medium' | 'hot' | 'extra-hot';
}