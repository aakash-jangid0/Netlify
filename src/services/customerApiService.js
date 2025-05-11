import { supabase, checkAuthentication } from '../lib/supabase'; // Use the Typescript-friendly Supabase client

export const customerApiService = {
  // Fetch all customers
  async fetchAllCustomers() {
    await checkAuthentication();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
    return data;
  },
  
  // Fetch a single customer by ID
  async fetchCustomerById(id) {
    await checkAuthentication();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching customer by ID:', error);
      throw error;
    }
    return data;
  },
  
  // Create a new customer
  async createCustomer(customerData) {
    await checkAuthentication();
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select();
    
    if (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
    return data[0];
  },
  
  // Update an existing customer
  async updateCustomer(id, customerData) {
    await checkAuthentication();
    const { data, error } = await supabase
      .from('customers')
      .update(customerData)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
    return data[0];
  },
  
  // Delete a customer
  async deleteCustomer(id) {
    await checkAuthentication();
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
    return true;
  },
  
  // Get customer statistics
  async getCustomerStatistics() {
    await checkAuthentication();
    const { data, error } = await supabase
      .rpc('get_customer_statistics');
    
    if (error) {
      console.error('Error getting customer statistics:', error);
      throw error;
    }
    return data[0];
  },
  
  // Search customers
  async searchCustomers(query) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('name');
    
    if (error) throw error;
    return data;
  },
  
  // Filter customers by status
  async filterCustomersByStatus(status) {
    if (status === 'all') {
      return this.fetchAllCustomers();
    }
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('status', status)
      .order('name');
    
    if (error) throw error;
    return data;
  },
  
  // Filter customers by tags
  async filterCustomersByTags(tags) {
    if (!tags || tags.length === 0) {
      return this.fetchAllCustomers();
    }
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .contains('tags', tags)
      .order('name');
    
    if (error) throw error;
    return data;
  }
};