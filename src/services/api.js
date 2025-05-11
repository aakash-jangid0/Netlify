import axios from 'axios';

// Make sure the base URL is correct for your environment
const API_URL = 'http://localhost:5000/api'; 

// Verify the customer endpoint is configured properly
export const getCustomers = () => {
  return axios.get(`${API_URL}/customers`);
};

// Add other API service functions as needed