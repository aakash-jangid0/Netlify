import { useState } from 'react';
import { MenuItem } from '../types/menu';
import { toast } from 'react-hot-toast';

// Define OrderItem type locally since it's not exported from another file
interface OrderItem extends MenuItem {
  quantity: number;
  notes?: string;
}

export function useOrderManagement() {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const addOrderItem = (item: MenuItem) => {
    // Prevent adding unavailable items
    if (!item.isAvailable) {
      toast.error(`${item.name} is currently unavailable`);
      return;
    }
    
    setOrderItems(prev => {
      const existingItem = prev.find(i => i.id === item.id);
      if (existingItem) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`Added ${item.name} to order`);
  };

  const updateQuantity = (id: string, quantity: number) => {
    setOrderItems(prev =>
      quantity === 0
        ? prev.filter(item => item.id !== id)
        : prev.map(item =>
            item.id === id ? { ...item, quantity } : item
          )
    );
  };

  const updateNotes = (id: string, notes: string) => {
    setOrderItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, notes } : item
      )
    );
  };

  const clearOrder = () => {
    setOrderItems([]);
  };

  return {
    orderItems,
    addOrderItem,
    updateQuantity,
    updateNotes,
    clearOrder
  };
}