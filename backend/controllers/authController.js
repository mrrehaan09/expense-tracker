import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── @route  POST /api/auth/register ─────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters.' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Duplicate email check
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    res.status(201).json({
      message: 'Registration successful.',
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('[register]', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ─── @route  POST /api/auth/login ────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email address.' });
    }

    // User lookup
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Password comparison
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    res.status(200).json({
      message: 'Login successful.',
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('[login]', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ─── @route  GET /api/auth/me  (protected) ───────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json({ user });
  } catch (err) {
    console.error('[getMe]', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};
