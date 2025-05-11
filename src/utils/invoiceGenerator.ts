import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { Invoice } from '../types/invoice';
import { supabase } from '../lib/supabase';
import { generatePDF, downloadInvoice as utilsDownloadInvoice, printInvoice as utilsPrintInvoice, emailInvoice as utilsEmailInvoice } from './invoiceUtils';

// Keep the original interfaces for backward compatibility
interface InvoiceItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
}

interface InvoiceData {
  id?: string;
  order_id?: string;
  display_order_id?: string; // Human-readable order ID
  invoiceNumber: string; // This should match the order display ID format
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  tableNumber?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_amount: number;
  total: number;
  paymentMethod: string;
  date: Date;
}

// Helper function to convert InvoiceData to Invoice format
const convertToInvoiceFormat = (data: InvoiceData): Invoice => {
  return {
    id: data.id || '',
    order_id: data.order_id || '',
    display_order_id: data.display_order_id || data.order_id || `#${data.invoiceNumber}`,
    invoice_number: data.invoiceNumber,
    customer_name: data.customerName,
    customer_phone: data.customerPhone,
    customer_email: data.customerEmail,
    billing_address: '',
    invoice_date: data.date.toISOString(),
    subtotal: data.subtotal,
    tax_amount: data.tax_amount,
    discount_amount: 0,
    total_amount: data.total,
    status: 'issued',
    payment_method: data.paymentMethod,
    notes: '',
    terms_and_conditions: '',
    is_printed: false,
    print_count: 0,
    created_at: data.date.toISOString(),
    updated_at: data.date.toISOString(),
    items: data.items.map(item => ({
      id: item.id || '',
      invoice_id: data.id || '',
      item_name: item.name,
      description: '',
      quantity: item.quantity,
      unit_price: item.price,
      tax_rate: item.tax_rate,
      tax_amount: item.tax_amount,
      discount_amount: 0,
      total_amount: item.total,
      created_at: data.date.toISOString()
    }))
  };
};

// Generate and save an invoice to the database
export const saveInvoiceToDatabase = async (data: InvoiceData): Promise<string | null> => {
  try {
    // Convert to standard invoice format
    const invoice = convertToInvoiceFormat(data);
    
    // Generate a random uuid for the invoice if not provided
    const invoiceId = invoice.id || crypto.randomUUID();
    invoice.id = invoiceId;
    
    // If order_id is provided, transform it to use only the last 6 characters for display
    if (invoice.order_id) {
      invoice.display_order_id = invoice.display_order_id || `#${invoice.order_id.slice(-6)}`;
    }
    
    // Insert the invoice into the database
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        id: invoiceId,
        order_id: invoice.order_id,
        invoice_number: invoice.invoice_number,
        display_order_id: invoice.display_order_id,
        customer_name: invoice.customer_name,
        customer_phone: invoice.customer_phone, 
        customer_email: invoice.customer_email,
        billing_address: invoice.billing_address,
        invoice_date: invoice.invoice_date,
        subtotal: invoice.subtotal,
        tax_amount: invoice.tax_amount,
        discount_amount: invoice.discount_amount,
        total_amount: invoice.total_amount,
        status: invoice.status,
        payment_method: invoice.payment_method,
        notes: invoice.notes,
        terms_and_conditions: invoice.terms_and_conditions,
        is_printed: invoice.is_printed,
        print_count: invoice.print_count
      })
      .select()
      .single();
      
    if (invoiceError) {
      console.error('Error saving invoice:', invoiceError);
      return null;
    }
    
    // Insert invoice items
    if (invoice.items && invoice.items.length > 0) {
      const itemsToInsert = invoice.items.map(item => ({
        invoice_id: invoiceId,
        item_name: item.item_name,
        description: item.description || '',
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        tax_amount: item.tax_amount,
        discount_amount: item.discount_amount || 0,
        total_amount: item.total_amount
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);
        
      if (itemsError) {
        console.error('Error saving invoice items:', itemsError);
        // Consider rollback or cleanup of the invoice if items fail
      }
    }
    
    return invoiceId;
  } catch (error) {
    console.error('Unexpected error saving invoice:', error);
    return null;
  }
};

export const generateInvoice = (data: InvoiceData): jsPDF => {
  // If order_id is provided, transform it to use only the last 6 characters
  if (data.order_id) {
    data.display_order_id = `#${data.order_id.slice(-6)}`;
    data.invoiceNumber = data.order_id.slice(-6).toUpperCase();
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5' // A5 page
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = 10;

  // Logo placeholder
  doc.setDrawColor(0, 0, 0);
  doc.setFillColor(0, 0, 0);
  doc.circle(pageWidth / 2, cursorY + 5, 6, 'F');
  cursorY += 15;

  // Restaurant Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Tastybites', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 6;

  // Address
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Malad west Mumbai Maharashtra', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 4;
  doc.text('Email: tastybites@example.com', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 4;

  // Receipt Title
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIPT', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 2;
  doc.setLineWidth(0.1);
  doc.line(10, cursorY, pageWidth - 10, cursorY);
  cursorY += 6;

  // Invoice details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Name: ${data.customerName}`, 12, cursorY);
  doc.text(`Invoice No: ${data.invoiceNumber}`, pageWidth - 12, cursorY, { align: 'right' });
  cursorY += 5;
  doc.text(`Date: ${format(data.date, 'dd MMM yyyy')}`, pageWidth - 12, cursorY, { align: 'right' });
  
  // Add table number or order ID details
  if (data.tableNumber) {
    doc.text(`Table: #${data.tableNumber}`, 12, cursorY);
    cursorY += 5;
  }
  if (data.order_id) {
    doc.text(`Order: ${data.order_id}`, 12, cursorY);
    cursorY += 5;
  } else if (data.display_order_id) {
    doc.text(`Order: ${data.display_order_id}`, 12, cursorY);
    cursorY += 5;
  }
  
  // Add customer phone and email if available
  if (data.customerPhone) {
    doc.text(`Phone: ${data.customerPhone}`, 12, cursorY);
    cursorY += 5;
  }
  if (data.customerEmail) {
    doc.text(`Email: ${data.customerEmail}`, 12, cursorY);
    cursorY += 5;
  }

  doc.setLineWidth(0.1);
  doc.line(10, cursorY, pageWidth - 10, cursorY);
  cursorY += 5;

  // Table header
  doc.setFont('helvetica', 'bold');
  doc.text('Item', 12, cursorY);
  doc.text('Price', pageWidth / 2 - 15, cursorY, { align: 'right' });
  doc.text('Qty', pageWidth / 2 + 5, cursorY, { align: 'center' });
  doc.text('Total', pageWidth - 12, cursorY, { align: 'right' });
  cursorY += 5;
  doc.setFont('helvetica', 'normal');

  // Items
  data.items.forEach(item => {
    // Handle long item names by truncating or wrapping
    const maxNameLength = 18; // Adjust based on your layout
    let displayName = item.name;
    if (item.name.length > maxNameLength) {
      displayName = item.name.substring(0, maxNameLength) + '...';
    }
    
    doc.text(displayName, 12, cursorY);
    doc.text(`₹${item.price.toFixed(2)}`, pageWidth / 2 - 15, cursorY, { align: 'right' });
    doc.text(item.quantity.toString(), pageWidth / 2 + 5, cursorY, { align: 'center' });
    doc.text(`₹${item.total.toFixed(2)}`, pageWidth - 12, cursorY, { align: 'right' });
    cursorY += 5;
  });

  cursorY += 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Sub-Total:`, pageWidth - 35, cursorY);
  doc.text(`₹ ${data.subtotal.toFixed(2)}`, pageWidth - 12, cursorY, { align: 'right' });
  cursorY += 5;

  // Calculate CGST and SGST as half of the total tax amount
  const halfTaxAmount = data.tax_amount / 2;

  doc.text(`CGST: 9%`, pageWidth - 35, cursorY);
  doc.text(`₹ ${halfTaxAmount.toFixed(2)}`, pageWidth - 12, cursorY, { align: 'right' });
  cursorY += 5;

  doc.text(`SGST: 9%`, pageWidth - 35, cursorY);
  doc.text(`₹ ${halfTaxAmount.toFixed(2)}`, pageWidth - 12, cursorY, { align: 'right' });
  cursorY += 6;

  doc.text(`Total Tax:`, pageWidth - 35, cursorY);
  doc.text(`₹ ${data.tax_amount.toFixed(2)}`, pageWidth - 12, cursorY, { align: 'right' });
  cursorY += 5;

  doc.line(10, cursorY, pageWidth - 10, cursorY);
  cursorY += 5;

  // Payment method and total
  doc.setFont('helvetica', 'bold');
  doc.text(`Mode:`, 12, cursorY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.paymentMethod, 28, cursorY);
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Total:`, pageWidth - 35, cursorY);
  doc.text(`₹ ${data.total.toFixed(2)}`, pageWidth - 12, cursorY, { align: 'right' });
  cursorY += 5;

  doc.line(10, cursorY + 2, pageWidth - 10, cursorY + 2);
  cursorY += 8;

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('**SAVE PAPER SAVE NATURE !!', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 4;
  doc.setFont('helvetica', 'normal');
  doc.text('YOU CAN NOW CALL US ON 1800 226344 (TOLL-FREE) FOR QUERIES/COMPLAINTS.', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 4;
  doc.text(`Time: ${format(data.date, 'HH:mm')}`, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 2;

  return doc;
};

export const downloadInvoice = (data: InvoiceData) => {
  const doc = generateInvoice(data);
  doc.save(`invoice-${data.invoiceNumber}.pdf`);
};

export const printInvoice = (data: InvoiceData) => {
  try {
    const doc = generateInvoice(data);
    
    if (typeof window !== 'undefined') {
      // First approach - Auto print with window open
      doc.autoPrint();
      
      try {
        // Open the PDF in a new window
        const blobUrl = doc.output('bloburl');
        const printWindow = window.open(blobUrl, '_blank');
        
        if (!printWindow) {
          console.error('Browser blocked opening new window. Trying alternative method...');
          // Fallback to downloading if popup is blocked
          downloadInvoice(data);
          return;
        }
      } catch (error) {
        console.error('Error opening print window:', error);
        // Fallback to iframe approach
        const blob = doc.output('blob');
        const blobUrl = URL.createObjectURL(blob);
        
        // Create iframe for printing
        const iframeId = 'invoice-print-frame';
        let iframe = document.getElementById(iframeId) as HTMLIFrameElement;
        
        if (!iframe) {
          iframe = document.createElement('iframe');
          iframe.id = iframeId;
          iframe.style.display = 'none';
          document.body.appendChild(iframe);
        }
        
        iframe.src = blobUrl;
        
        // Try to print after the iframe loads
        iframe.onload = () => {
          try {
            iframe.contentWindow?.print();
          } catch (printError) {
            console.error('Failed to print from iframe:', printError);
            // Last resort - try download
            downloadInvoice(data);
          }
        };
      }
    }
  } catch (err) {
    console.error('Error in printInvoice:', err);
    throw err;
  }
};

export const emailInvoice = async (data: InvoiceData, email: string) => {
  const doc = generateInvoice(data);
  const pdfBlob = doc.output('blob');
  
  const formData = new FormData();
  formData.append('invoice', pdfBlob, `invoice-${data.invoiceNumber}.pdf`);
  formData.append('email', email);
  formData.append('invoice_number', data.invoiceNumber);

  // Send to edge function for email processing
  const response = await fetch('/api/send-invoice', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Failed to send invoice');
  }

  return response.json();
};
