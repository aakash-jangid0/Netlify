import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    // Note: We're keeping the string type for backward compatibility
    // but removing the enum restriction to allow for dynamic categories
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  preparationTime: {
    type: Number, // in minutes
    required: true,
  },
}, {
  timestamps: true
});

export default mongoose.model('MenuItem', menuItemSchema);