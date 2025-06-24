// src/pages/admin/role-permissions.tsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  Table,
  Button,
  TableBody,
  TableHead,
  Typography,
  TableContainer,
  TablePagination,
  TableRow,
  TableCell,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  InputAdornment,
  Checkbox,
  Chip,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip
} from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { useAuth } from 'src/context/AuthContext';

interface User {
  id: string;
  email: string;
  role: 'Admin' | 'Editor';
  createdAt: string;
  totalSummaries?: number;
  lastLogin?: string;
  isActive?: boolean;
}

interface RolePermissions {
  [key: string]: {
    permissions: string[];
    description: string;
  };
}

interface PermissionsData {
  rolePermissions: RolePermissions;
  roleCounts: { Admin: number; Editor: number };
  availablePermissions: string[];
}

export const RolePermissionsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<PermissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkRoleDialog, setBulkRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'Admin' | 'Editor'>('Editor');
  const [filterEmail, setFilterEmail] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch users and permissions data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const [usersRes, permissionsRes] = await Promise.all([
        axios.get('https://stingray-app-j7k4v.ondigitalocean.app/api/admin/roles/users', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('https://stingray-app-j7k4v.ondigitalocean.app/api/admin/roles/permissions', {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
      
      setUsers(usersRes.data.users);
      setPermissions(permissionsRes.data);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update single user role
  const updateUserRole = async (userId: string, newRole: 'Admin' | 'Editor') => {
    if (userId === currentUser?.id && newRole !== 'Admin') {
      setError('You cannot change your own admin role');
      return;
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `https://stingray-app-j7k4v.ondigitalocean.app/api/admin/roles/users/${userId}`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchData();
      setError(null);
    } catch (err: any) {
      console.error('Failed to update role:', err);
      setError(err.response?.data?.error || 'Failed to update role');
    } finally {
      setUpdating(false);
    }
  };

  // Bulk update roles
  const handleBulkRoleUpdate = async () => {
    if (selectedUsers.length === 0) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'https://stingray-app-j7k4v.ondigitalocean.app/api/admin/roles/bulk-update',
        { userIds: selectedUsers, role: selectedRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchData();
      setSelectedUsers([]);
      setBulkRoleDialog(false);
      setError(null);
    } catch (err: any) {
      console.error('Failed to bulk update roles:', err);
      setError(err.response?.data?.error || 'Failed to update roles');
    } finally {
      setUpdating(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(filterEmail.toLowerCase())
  );

  // Pagination
  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleColor = (role: string) => {
    return role === 'Admin' ? 'error' : 'info';
  };

  if (loading) {
    return (
      <DashboardContent>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Role & Permissions Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Role Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="error.main">
              {permissions?.roleCounts.Admin || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Administrators
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="info.main">
              {permissions?.roleCounts.Editor || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Editors
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="primary.main">
              {users.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Users
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main">
              {users.filter(u => u.isActive).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Users
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Users Table */}
        <Grid item xs={12} lg={8}>
          <Card>
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">Users & Roles</Typography>
                <Box display="flex" gap={2}>
                  {selectedUsers.length > 0 && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setBulkRoleDialog(true)}
                      startIcon={<Iconify icon="mingcute:group-line" />}
                    >
                      Bulk Update ({selectedUsers.length})
                    </Button>
                  )}
                </Box>
              </Box>
              
              <TextField
                size="small"
                placeholder="Search users..."
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mt: 2, width: 300 }}
              />
            </Box>

            <Scrollbar>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          indeterminate={selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {user.email}
                            </Typography>
                            {user.id === currentUser?.id && (
                              <Typography variant="caption" color="primary">
                                (You)
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            color={getRoleColor(user.role) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(user.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.isActive ? 'Active' : 'Inactive'}
                            color={user.isActive ? 'success' : 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={user.id === currentUser?.id ? 'Cannot change your own role' : ''}>
                            <span>
                              <IconButton
                                size="small"
                                disabled={user.id === currentUser?.id || updating}
                                onClick={() => updateUserRole(user.id, user.role === 'Admin' ? 'Editor' : 'Admin')}
                              >
                                <Iconify icon="mingcute:user-setting-line" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>

            <TablePagination
              component="div"
              count={filteredUsers.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </Card>
        </Grid>

        {/* Role Permissions */}
        <Grid item xs={12} lg={4}>
          <Card>
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Role Permissions</Typography>
            </Box>
            
            {permissions?.rolePermissions && Object.entries(permissions.rolePermissions).map(([role, data]) => (
              <Box key={role} sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Chip label={role} color={getRoleColor(role) as any} size="small" />
                  <Typography variant="body2" color="text.secondary">
                    ({permissions.roleCounts[role as keyof typeof permissions.roleCounts] || 0} users)
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {data.description}
                </Typography>
                <List dense>
                  {data.permissions.slice(0, 5).map((permission) => (
                    <ListItem key={permission} sx={{ py: 0, px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        <Iconify icon="mingcute:check-line" width={16} color="success.main" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={permission.replace(/_/g, ' ')}
                        primaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                  {data.permissions.length > 5 && (
                    <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>
                      +{data.permissions.length - 5} more permissions
                    </Typography>
                  )}
                </List>
              </Box>
            ))}
          </Card>
        </Grid>
      </Grid>

      {/* Bulk Role Update Dialog */}
      <Dialog open={bulkRoleDialog} onClose={() => setBulkRoleDialog(false)}>
        <DialogTitle>Bulk Update User Roles</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Update {selectedUsers.length} selected users to a new role.
          </Typography>
          
          <FormControl fullWidth>
            <InputLabel>New Role</InputLabel>
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as 'Admin' | 'Editor')}
              label="New Role"
            >
              <MenuItem value="Admin">Administrator</MenuItem>
              <MenuItem value="Editor">Editor</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkRoleDialog(false)}>Cancel</Button>
          <Button
            onClick={handleBulkRoleUpdate}
            variant="contained"
            disabled={updating}
            startIcon={updating ? <CircularProgress size={16} /> : null}
          >
            Update Roles
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
};

export default RolePermissionsPage;