import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { auth } from '../middleware/auth.js';

// Get directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the server directory
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Auth route - SUPABASE_URL:', supabaseUrl ? 'Set ✓' : 'Not set ✗');
console.log('Auth route - SUPABASE_ANON_KEY:', supabaseKey ? 'Set ✓' : 'Not set ✗');

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase environment variables missing in auth route!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const router = express.Router();

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again later'
});

// Rate limiting for admin login attempts (more strict)
const adminLoginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: 'Too many admin login attempts, please try again later'
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      });
    }

    // Check if user already exists
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
      
    if (findError && findError.code !== 'PGRST116') {
      // PGRST116 means not found, which is what we want
      console.error('Error checking for existing user:', findError);
      return res.status(500).json({ message: 'Error checking user existence' });
    }
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user (always as regular user, admins must be created manually)
    const user = new User({
      name,
      email,
      password,
      role: 'user'
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Apply appropriate rate limiter based on user role
    if (user.role === 'admin') {
      adminLoginLimiter(req, res, async () => {
        await handleLogin(user, password, res);
      });
    } else {
      loginLimiter(req, res, async () => {
        await handleLogin(user, password, res);
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

async function handleLogin(user, password, res) {
  try {
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      },
    });
  } catch (error) {
    console.error('Login handling error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Update last login (for admin users)
router.post('/update-login', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    user.lastLogin = new Date();
    await user.save();
    res.json({ message: 'Login time updated' });
  } catch (error) {
    console.error('Update login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;