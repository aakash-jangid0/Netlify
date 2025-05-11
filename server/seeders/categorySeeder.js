import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';

// Load environment variables
dotenv.config();

// Initial categories to seed the database
const initialCategories = [
  {
    name: 'Main Course',
    slug: 'main',
    displayOrder: 0
  },
  {
    name: 'Appetizers',
    slug: 'appetizer',
    displayOrder: 1
  },
  {
    name: 'Desserts',
    slug: 'dessert',
    displayOrder: 2
  },
  {
    name: 'Beverages',
    slug: 'beverage',
    displayOrder: 3
  },
];

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tastybites')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Check if categories already exist
      const existingCategories = await Category.find();
      
      if (existingCategories.length === 0) {
        // If no categories exist, seed the database
        await Category.insertMany(initialCategories);
        console.log('Categories seeded successfully!');
      } else {
        console.log('Categories already exist, skipping seed operation');
      }
    } catch (error) {
      console.error('Error seeding categories:', error);
    } finally {
      // Close the connection
      mongoose.connection.close();
    }
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });
