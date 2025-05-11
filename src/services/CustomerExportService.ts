import { Customer } from '../types/Customer';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export class CustomerExportService {  static exportToCSV(customers: Customer[]): void {
    const csvData = customers.map(customer => ({
      Name: customer.name,
      Email: customer.email,
      Phone: customer.phone,
      'Joined Date': new Date(customer.created_at).toLocaleDateString(),
      'Total Orders': customer.total_orders,
      'Total Spent': `₹${customer.total_spent.toFixed(2)}`,
      Status: customer.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(data, `customers_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
}