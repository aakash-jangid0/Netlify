import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  items: [{
    id: String,
    name: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  customerInfo: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    tableNumber: {
      type: String,
      required: true
    }
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  coupon: {
    id: String,
    code: String,
    discount_type: {
      type: String,
      enum: ['percentage', 'fixed_amount']
    },
    discount_value: Number,
    discount_amount: Number
  }
});

export default mongoose.model('Order', orderSchema);