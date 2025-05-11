import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { OrderItem } from '../types/counter';

interface UseOrderFormProps {
  orderItems: OrderItem[];
  onSubmitOrder: () => void;
}

export function useOrderForm({ orderItems, onSubmitOrder }: UseOrderFormProps) {
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');

  const validateOrder = (): boolean => {
    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return false;
    }

    if (orderType === 'dine-in' && !tableNumber.trim()) {
      toast.error('Please enter table number');
      return false;
    }

    if (orderItems.length === 0) {
      toast.error('Please add items to the order');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (validateOrder()) {
      onSubmitOrder();
    }
  };

  return {
    customerName,
    setCustomerName,
    tableNumber,
    setTableNumber,
    orderType,
    setOrderType,
    paymentMethod,
    setPaymentMethod,
    handleSubmit
  };
}