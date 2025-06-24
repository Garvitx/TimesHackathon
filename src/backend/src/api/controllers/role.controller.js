// src/api/controllers/role.controller.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * GET /api/admin/roles/users
 * Get all users with their roles and activity info
 */
export const getAllUsersWithRoles = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get summary counts for each user (to show activity)
    const usersWithActivity = await Promise.all(
      users.map(async (user) => {
        // Count summaries created by looking at recent activity
        // Since we don't have userId in Summary model, we'll use a different approach
        // For now, we'll just return basic user info
        return {
          ...user,
          totalSummaries: 0, // Placeholder - can be enhanced later
          lastLogin: null,   // Placeholder - can be enhanced later
          isActive: true,    // Placeholder - can be enhanced later
        };
      })
    );

    return res.json({
      users: usersWithActivity,
      totalUsers: users.length,
      adminCount: users.filter(u => u.role === 'Admin').length,
      editorCount: users.filter(u => u.role === 'Editor').length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/roles/users/:userId
 * Update a user's role
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const adminUser = req.user; // Current admin user

    // Validate role
    if (!['Admin', 'Editor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be Admin or Editor' });
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from demoting themselves
    if (targetUser.id === adminUser.id && role !== 'Admin') {
      return res.status(400).json({ 
        error: 'You cannot change your own admin role' 
      });
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    console.log(`Admin ${adminUser.email} changed ${updatedUser.email}'s role to ${role}`);

    return res.json({
      message: `User role updated to ${role}`,
      user: updatedUser
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/roles/permissions
 * Get current permission settings and role definitions
 */
export const getPermissions = async (req, res, next) => {
  try {
    // Define role permissions (this could be moved to a config file)
    const rolePermissions = {
      Admin: {
        permissions: [
          'view_dashboard',
          'manage_users',
          'manage_roles',
          'view_analytics',
          'export_data',
          'system_settings',
          'view_summaries',
          'create_summaries',
          'edit_summaries',
          'delete_summaries',
          'batch_processing'
        ],
        description: 'Full system access with user management capabilities'
      },
      Editor: {
        permissions: [
          'view_dashboard',
          'view_summaries',
          'create_summaries',
          'edit_summaries',
          'batch_processing'
        ],
        description: 'Content creation and editing capabilities'
      }
    };

    // Get current user counts
    const userCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    });

    const roleCounts = userCounts.reduce((acc, curr) => {
      acc[curr.role] = curr._count;
      return acc;
    }, { Admin: 0, Editor: 0 });

    return res.json({
      rolePermissions,
      roleCounts,
      availablePermissions: [
        'view_dashboard',
        'manage_users',
        'manage_roles',
        'view_analytics',
        'export_data',
        'system_settings',
        'view_summaries',
        'create_summaries',
        'edit_summaries',
        'delete_summaries',
        'batch_processing'
      ]
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/roles/activity
 * Get user activity logs (basic implementation)
 */
export const getUserActivity = async (req, res, next) => {
  try {
    const { limit = 50, userId } = req.query;

    // For now, we'll get summary creation activity
    // In a full implementation, you'd have a separate audit log table
    let whereClause = {};
    if (userId) {
      // This would need to be enhanced when we add userId tracking to summaries
      whereClause = {}; // Placeholder
    }

    const recentSummaries = await prisma.summary.findMany({
      where: {
        status: 'completed',
        ...whereClause
      },
      select: {
        id: true,
        title: true,
        modelUsed: true,
        createdAt: true,
        estimatedCost: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });

    // Format as activity log
    const activityLog = recentSummaries.map(summary => ({
      id: summary.id,
      action: 'summary_created',
      description: `Created summary: ${summary.title || 'Untitled'}`,
      model: summary.modelUsed,
      cost: summary.estimatedCost,
      timestamp: summary.createdAt,
      userId: 'system', // Placeholder
      userEmail: 'system', // Placeholder
    }));

    return res.json({
      activities: activityLog,
      totalCount: activityLog.length
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/roles/bulk-update
 * Bulk update multiple users' roles
 */
export const bulkUpdateRoles = async (req, res, next) => {
  try {
    const { userIds, role } = req.body;
    const adminUser = req.user;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds must be a non-empty array' });
    }

    if (!['Admin', 'Editor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Prevent admin from changing their own role in bulk operation
    if (userIds.includes(adminUser.id) && role !== 'Admin') {
      return res.status(400).json({ 
        error: 'Cannot change your own admin role in bulk operation' 
      });
    }

    // Update all specified users
    const updateResult = await prisma.user.updateMany({
      where: {
        id: { in: userIds },
        id: { not: adminUser.id } // Extra safety to prevent self-role change
      },
      data: { role }
    });

    // Get updated users for response
    const updatedUsers = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        role: true,
      }
    });

    console.log(`Admin ${adminUser.email} bulk updated ${updateResult.count} users to role ${role}`);

    return res.json({
      message: `Updated ${updateResult.count} users to ${role} role`,
      updatedUsers,
      count: updateResult.count
    });
  } catch (err) {
    next(err);
  }
};