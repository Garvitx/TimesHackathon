// controllers/auth.controller.js

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import config from '../../config/default.js';
import { sendPasswordResetEmail } from '../../utils/mailer.js';

const prisma = new PrismaClient();

const signup = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    if (!['Admin', 'Editor'].includes(role) && req.user?.role !== 'Admin') {
      return res.status(403).json({ error: 'Invalid role or insufficient permissions' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, role: role || 'Editor' },
    });
    res.status(201).json({ message: 'User created', userId: user.id });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};

const createEditor = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const editor = await prisma.user.create({
      data: { email, passwordHash, role: 'Editor' },
    });
    res.status(201).json({ message: 'Editor created', userId: editor.id });
  } catch (err) {
    next(err);
  }
};

const deleteEditor = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'Editor') {
      return res.status(404).json({ error: 'Editor not found' });
    }
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'Editor deleted' });
  } catch (err) {
    next(err);
  }
};

const listEditors = async (req, res, next) => {
  try {
    const editors = await prisma.user.findMany({
      where: { role: 'Editor' },
      select: { id: true, email: true, role: true },
    });
    res.json({ editors });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const { id, email, role } = req.user;
    res.json({ user: { id, email, role } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/forgot-password
 * Public endpoint. Accepts { email }. Always returns 200 OK with generic message.
 * If email belongs to an Editor, generate a short‐lived JWT reset token and send an email.
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Look up only Editors by email
    const editor = await prisma.user.findFirst({
      where: { email, role: 'Editor' },
    });

    if (editor) {
      // 1) Generate a reset‐token (JWT) valid for a short time
      const payload = { userId: editor.id, type: 'reset' };
      const resetToken = jwt.sign(payload, config.JWT_RESET_SECRET, {
        expiresIn: config.RESET_TOKEN_EXPIRY, // e.g. "1h"
      });

      // 2) Construct the reset link
      const resetLink = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;

      // 3) Send email
      await sendPasswordResetEmail({ toEmail: editor.email, resetLink });
      // Note: we do NOT send editor.email back to client; this is purely a private send.
    }

    // Always respond with 200 and a generic message so nobody can probe which emails exist
    return res.json({
      message:
        'If an account with that email exists, you will receive a password reset link shortly.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password
 * Public endpoint. Accepts { token, password }.
 * Verify token, check that user still exists & is an Editor, then update passwordHash.
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // 1) Verify the JWT
    let payload;
    try {
      payload = jwt.verify(token, config.JWT_RESET_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // 2) Ensure token type is 'reset'
    if (payload.type !== 'reset' || !payload.userId) {
      return res.status(400).json({ error: 'Invalid token payload' });
    }

    // 3) Look up the user, ensure they are still an Editor
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.role !== 'Editor') {
      return res.status(400).json({ error: 'Invalid token or user no longer an editor' });
    }

    // 4) Hash the new password and update
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
};

export default {
  signup,
  login,
  createEditor,
  deleteEditor,
  listEditors,
  me,
  forgotPassword,
  resetPassword,
};
