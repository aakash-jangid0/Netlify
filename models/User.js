import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    count: { type: Number, default: 0 },
    lastAttempt: { type: Date }
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12); // Increased rounds for better security
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // Check if account is locked
    if (this.isLocked && this.lockUntil > Date.now()) {
      throw new Error('Account is locked. Please try again later.');
    }

    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    
    // Handle failed login attempts
    if (!isMatch) {
      this.loginAttempts.count += 1;
      this.loginAttempts.lastAttempt = new Date();

      // Lock account after 5 failed attempts
      if (this.loginAttempts.count >= 5) {
        this.isLocked = true;
        this.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
      }

      await this.save();
      return false;
    }

    // Reset login attempts on successful login
    if (this.loginAttempts.count > 0) {
      this.loginAttempts.count = 0;
      this.isLocked = false;
      this.lockUntil = null;
      await this.save();
    }

    return true;
  } catch (error) {
    throw error;
  }
};

export default mongoose.model('User', userSchema);