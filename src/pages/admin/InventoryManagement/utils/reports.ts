import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export const downloadInventoryReport = async (items: any[]) => {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(20);
  doc.text('Inventory Report', 14, 22);

  // Add date
  doc.setFontSize(10);
  doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 32);

  // Add summary
  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.cost_price), 0);
  const lowStockItems = items.filter(item => item.quantity <= item.min_quantity).length;
  const outOfStockItems = items.filter(item => item.quantity === 0).length;

  doc.text(`Total Items: ${totalItems}`, 14, 42);
  doc.text(`Total Value: ₹${totalValue.toLocaleString()}`, 14, 48);
  doc.text(`Low Stock Items: ${lowStockItems}`, 14, 54);
  doc.text(`Out of Stock Items: ${outOfStockItems}`, 14, 60);

  // Add inventory table
  (doc as any).autoTable({
    startY: 70,
    head: [['Item', 'Category', 'Quantity', 'Unit', 'Cost Price', 'Total Value', 'Location']],
    body: items.map(item => [
      item.name,
      item.category,
      item.quantity,
      item.unit,
      `₹${item.cost_price}`,
      `₹${(item.quantity * item.cost_price).toLocaleString()}`,
      item.storage_location
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [249, 115, 22] }
  });

  // Save the PDF
  doc.save(`inventory-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};