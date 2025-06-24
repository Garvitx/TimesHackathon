// src/views/EditorView.tsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Checkbox from '@mui/material/Checkbox';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { TableNoData } from '../table-no-data';
import { UserTableHead } from '../user-table-head';
import { TableEmptyRows } from '../table-empty-rows';
import { emptyRows, applyFilter, getComparator } from '../utils';

interface Editor {
  id: string;
  email: string;
  role: 'Editor';
}

type Order = 'asc' | 'desc';

/**
 * Re‐use the same useTable hook as before
 */
export function useTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState<string>('email');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<Order>('asc');

  const onSort = useCallback(
    (id: string) => {
      const isAsc = orderBy === id && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(id);
    },
    [order, orderBy]
  );

  const onSelectAllRows = useCallback(
    (checked: boolean, newSelecteds: string[]) => {
      if (checked) {
        setSelected(newSelecteds);
        return;
      }
      setSelected([]);
    },
    []
  );

  const onSelectRow = useCallback(
    (inputValue: string) => {
      const newSelected = selected.includes(inputValue)
        ? selected.filter((value) => value !== inputValue)
        : [...selected, inputValue];
      setSelected(newSelected);
    },
    [selected]
  );

  const onResetPage = useCallback(() => {
    setPage(0);
  }, []);

  const onChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const onChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      onResetPage();
    },
    [onResetPage]
  );

  return {
    page,
    order,
    onSort,
    orderBy,
    selected,
    rowsPerPage,
    onSelectRow,
    onResetPage,
    onChangePage,
    onSelectAllRows,
    onChangeRowsPerPage,
  };
}

/**
 * EditorView Component
 */
export const UserView: React.FC = () => {
  const table = useTable();

  const [filterEmail, setFilterEmail] = useState('');
  const [editors, setEditors] = useState<Editor[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  /**
   * Fetch the list of editors from the backend
   */
  const fetchEditors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get<{ editors: Editor[] }>(
        'https://stingray-app-j7k4v.ondigitalocean.app/api/auth/editors',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEditors(res.data.editors);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load editors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEditors();
  }, [fetchEditors]);

  /**
   * Filter + sort the editors array
   */
  const dataFiltered: Editor[] = applyFilter({
    inputData: editors,
    comparator: getComparator(table.order, table.orderBy),
    filterName: filterEmail,
  });

  const notFound = !dataFiltered.length && !!filterEmail;

  /**
   * Dialog open/close handlers
   */
  const handleOpenDialog = () => {
    setCreateError(null);
    setNewEmail('');
    setNewPassword('');
    setOpenDialog(true);
  };
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  /**
   * Create a new editor via the API
   */
  const handleCreateEditor = async () => {
    if (!newEmail || !newPassword) {
      setCreateError('Email and password are required');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'https://stingray-app-j7k4v.ondigitalocean.app/api/auth/editors',
        { email: newEmail, password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchEditors();
      setOpenDialog(false);
    } catch (err: any) {
      console.error(err);
      setCreateError(err.response?.data?.error || 'Failed to create editor');
    } finally {
      setCreating(false);
    }
  };

  /**
   * Delete an editor via the API
   */
  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this editor?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://stingray-app-j7k4v.ondigitalocean.app/api/auth/editors/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchEditors();
    } catch (err) {
      console.error(err);
      alert('Failed to delete editor');
    }
  };

  /**
   * Define the columns (headLabel) so alignment matches body cells
   */
  const headLabel: HeadLabel[] = [
    { id: 'email', label: 'Email', align: 'left', width: 300 },
    { id: 'role', label: 'Role', align: 'left', width: 150 },
    { id: 'actions', label: '', align: 'right', width: 80 },
  ];

  return (
    <DashboardContent>
      {/** Page Header **/}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Editors
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" width={18} height={18} />}
          onClick={handleOpenDialog}
          sx={{
            textTransform: 'none',
            fontWeight: 500,
          }}
        >
          New Editor
        </Button>
      </Box>

      {/** Main Card **/}
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: 3,
          p: 2,
        }}
      >
        {/** Custom Toolbar: Search + Filter **/}
        <Box
          sx={{
            px: 1,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            mb: 2,
          }}
        >
          {/* Search input */}
          <TextField
            size="small"
            placeholder="Search user..."
            value={filterEmail}
            onChange={(e) => {
              setFilterEmail(e.target.value);
              table.onResetPage();
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={18} height={18} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: '#F5F5F5',
                borderRadius: 1,
                '& fieldset': { border: 'none' },
              },
            }}
            sx={{ width: 280 }}
          />

          {/* (Optional) Filter icon on right */}
          <IconButton color="inherit">
            <Iconify icon="eva:options-2-fill" width={20} height={20} />
          </IconButton>
        </Box>

        {/** Scrollable Table **/}
        <Scrollbar>
          <TableContainer
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Table
              sx={{
                minWidth: 700,
                '& th': {
                  backgroundColor: '#F5F5F5',
                  fontWeight: 600,
                },
                '& tr:nth-of-type(even)': {
                  backgroundColor: '#FCFCFC',
                },
                '& tr:hover': {
                  backgroundColor: '#F0F0F0 !important',
                },
              }}
            >
              {/** Apply the updated headLabel with align properties **/}
              <UserTableHead
                order={table.order}
                orderBy={table.orderBy}
                rowCount={editors.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    editors.map((e) => e.id)
                  )
                }
                headLabel={headLabel}
              />

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography color="error">{error}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((editor) => (
                      <TableRow key={editor.id} hover>
                        {/* 1) Checkbox cell */}
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={table.selected.includes(editor.id)}
                            onChange={() => table.onSelectRow(editor.id)}
                          />
                        </TableCell>

                        {/* 2) Email cell (align="left") */}
                        <TableCell align="left" sx={{ py: 1.5 }}>
                          {editor.email}
                        </TableCell>

                        {/* 3) Role cell (align="left") */}
                        <TableCell align="left" sx={{ py: 1.5 }}>
                          <Box
                            sx={{
                              display: 'inline-block',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              bgcolor: (theme) => theme.palette.info.light,
                              color: (theme) => theme.palette.info.dark,
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          >
                            {editor.role}
                          </Box>
                        </TableCell>

                        {/* 4) Delete‐icon cell (align="right") */}
                        <TableCell align="right" sx={{ py: 1.5 }}>
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(editor.id)}
                            sx={{
                              '&:hover': {
                                bgcolor: (theme) => theme.palette.error.light + '33',
                              },
                            }}
                          >
                            <Iconify icon="mingcute:delete-line" width={20} height={20} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                )}

                <TableEmptyRows
                  height={68}
                  emptyRows={emptyRows(
                    table.page,
                    table.rowsPerPage,
                    editors.length
                  )}
                />

                {notFound && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <TableNoData searchQuery={filterEmail} />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        {/** Pagination **/}
        <TablePagination
          component="div"
          page={table.page}
          count={editors.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          rowsPerPageOptions={[5, 10, 25]}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          sx={{
            mt: 2,
            '.MuiTablePagination-toolbar': {
              pl: 1,
              pr: 1,
            },
          }}
        />
      </Card>

      {/** “New Editor” Dialog **/}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Create New Editor</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              size="small"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={creating}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              size="small"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={creating}
            />
            {createError && (
              <Typography color="error" variant="body2">
                {createError}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateEditor}
            variant="contained"
            disabled={creating}
            startIcon={creating ? <CircularProgress size={16} /> : null}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
};

export default UserView;
