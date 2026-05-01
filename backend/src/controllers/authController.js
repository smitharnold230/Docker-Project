const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { createUser, findUserByEmail } = require('../models/userModel');
const { publishUserCreatedEvent } = require('../config/kafka');

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

async function signup(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await findUserByEmail(normalizedEmail);

    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser(normalizedEmail, hashedPassword);
    const publishedEvent = await publishUserCreatedEvent(user);
    const token = createToken(user);

    return res.status(201).json({
      message: 'Signup successful',
      token,
      event: publishedEvent,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await findUserByEmail(email.toLowerCase());

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = createToken(user);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  signup,
  login,
};
