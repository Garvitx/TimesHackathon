// controllers/editor.controller.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/editor/summaries
 * Return all summaries (sorted by updatedAt desc).
 */
export const listSummaries = async (req, res, next) => {
  try {
    const summaries = await prisma.summary.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return res.json({ summaries });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/editor/summaries/:id
 * Return a single summary by ID.
 */
export const getSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const summary = await prisma.summary.findUnique({
      where: { id },
    });
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }
    return res.json({ summary });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/editor/summaries/:id
 * Allow editing of certain fields: title, status, errorMsg.
 * Body may contain { title?: string, status?: string, errorMsg?: string }
 */
export const updateSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, status, errorMsg } = req.body;

    // Check if summary exists
    const existing = await prisma.summary.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    // Build a data object with only the fields that were provided
    const dataToUpdate = {};
    if (typeof title === 'string') {
      dataToUpdate.title = title;
    }
    if (typeof status === 'string') {
      dataToUpdate.status = status;
    }
    if (typeof errorMsg === 'string') {
      dataToUpdate.errorMsg = errorMsg;
    }

    const updated = await prisma.summary.update({
      where: { id },
      data: dataToUpdate,
    });

    return res.json({ summary: updated });
  } catch (err) {
    next(err);
  }
};
