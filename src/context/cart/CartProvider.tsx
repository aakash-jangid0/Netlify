import React, { createContext, useReducer, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { CartContextType } from './CartContext';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartState {
  cartItems: CartItem[];
  lastAction?: {
    type: string;
    itemName?: string;
  };
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

type CartAction =
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItem = state.cartItems.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          cartItems: state.cartItems.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
          lastAction: { type: 'ADD_EXISTING', itemName: action.payload.name }
        };
      }
      return {
        cartItems: [...state.cartItems, { ...action.payload, quantity: 1 }],
        lastAction: { type: 'ADD_NEW', itemName: action.payload.name }
      };
    }
    case 'REMOVE_FROM_CART': {
      const itemToRemove = state.cartItems.find(item => item.id === action.payload);
      return {
        cartItems: state.cartItems.filter(item => item.id !== action.payload),
        lastAction: { type: 'REMOVE', itemName: itemToRemove?.name }
      };
    }
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        const itemToRemove = state.cartItems.find(item => item.id === action.payload.id);
        return {
          cartItems: state.cartItems.filter(item => item.id !== action.payload.id),
          lastAction: { type: 'REMOVE', itemName: itemToRemove?.name }
        };
      }
      return {
        cartItems: state.cartItems.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
        lastAction: { type: 'UPDATE' }
      };
    }
    case 'CLEAR_CART':
      return {
        cartItems: [],
        lastAction: { type: 'CLEAR' }
      };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    cartItems: [],
  });

  // Load cart from localStorage on initialization
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        parsedCart.cartItems.forEach((item: CartItem) => {
          dispatch({ type: 'ADD_TO_CART', payload: item });
        });
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify({ cartItems: state.cartItems }));
  }, [state.cartItems]);

  // Show toast notifications when cart changes
  const prevCartRef = useRef<CartItem[]>();
  useEffect(() => {
    if (prevCartRef.current && state.lastAction) {
      switch (state.lastAction.type) {
        case 'ADD_NEW':
          toast.success(`${state.lastAction.itemName} added to cart`);
          break;
        case 'ADD_EXISTING':
          toast.success(`${state.lastAction.itemName} quantity increased`);
          break;
        case 'REMOVE':
          toast.success(`${state.lastAction.itemName} removed from cart`);
          break;
        case 'CLEAR':
          toast.success('Cart cleared');
          break;
        default:
          break;
      }
    }
    prevCartRef.current = state.cartItems;
  }, [state.cartItems, state.lastAction]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_TO_CART', payload: item as CartItem });
  };

  const removeFromCart = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider
      value={{
        cartItems: state.cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
