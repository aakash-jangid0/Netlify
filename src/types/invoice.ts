export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  order_id: string;
  display_order_id: string; // Human-readable order ID (short form)
  invoice_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  billing_address?: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: 'draft' | 'issued' | 'paid' | 'cancelled' | 'refunded';
  payment_method?: string;
  notes?: string;
  terms_and_conditions?: string;
  is_printed: boolean;
  print_count: number;
  last_printed_at?: string;
  created_at: string;
  updated_at: string;
  items: InvoiceItem[];
}