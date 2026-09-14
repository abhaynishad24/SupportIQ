import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../db.js';
import { mailTransporter } from '../email.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
const ADMIN_EMAIL = 'nishadabhay549@gmail.com';

// 1. User Register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (typeof name !== 'string' || !name.trim() || !email || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Name, email and a password of at least 8 characters are required.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = email.toLowerCase() === ADMIN_EMAIL ? 'ADMIN' : 'USER';

    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name.trim(), email, hashedPassword, userRole]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
};

// 2. User Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = userResult.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const role = user.email.toLowerCase() === ADMIN_EMAIL ? 'ADMIN' : 'USER';
    const token = jwt.sign({ id: user.id, role, email: user.email }, JWT_SECRET, {
      expiresIn: '1d'
    });

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// 3. Forgot Password (Sends Email)
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 Hour

    await pool.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3',
      [resetToken, expires, email]
    );

    if (!mailTransporter || !smtpUser || !smtpPass) {
      return res.status(503).json({ success: false, message: 'Email service is not configured. Add a real SMTP_USER and SMTP_PASS (Gmail App Password) to backend/.env.' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`;

    await mailTransporter.sendMail({
      from: process.env.SMTP_FROM || smtpUser,
      to: email,
      subject: 'Password Reset Request',
      html: `<p>Click the link to reset your password: <a href="${resetLink}">${resetLink}</a></p>`
    });

    res.json({ success: true, message: 'Password reset link sent to your email.' });
  } catch (error: any) {
    console.error('Forgot password error:', error?.message || error);
    res.status(500).json({ success: false, message: 'Reset email could not be sent. Check SMTP settings and backend logs.' });
  }
};

// 4. Reset Password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'A valid token and password of at least 8 characters are required.' });
    }

    const userResult = await pool.query(
      'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
      [hashedPassword, userResult.rows[0].id]
    );

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error: any) {
    console.error('Reset password error:', error?.message || error);
    res.status(500).json({ success: false, message: 'Password reset failed. Check the database connection and try again.' });
  }
};

// 5. Logout
export const logout = async (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
};