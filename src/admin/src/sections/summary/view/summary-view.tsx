// src/views/SummaryView.tsx - Enhanced Version

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

import {
  Box,
  Card,
  Paper,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  InputAdornment,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Alert,
  Badge,
  Link,
} from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { TableNoData } from '../table-no-data';
import { UserTableHead, HeadLabel } from '../user-table-head';
import { TableEmptyRows } from '../table-empty-rows';
import { emptyRows, applyFilter, getComparator } from '../utils';

interface Summary {
  id: string;
  articleId: string;
  title: string | null;
  language: string;
  summaryHtml: string;
  modelUsed: string;
  promptTokens: number;
  responseTokens: number;
  status: string;
  errorMsg: string | null;
  createdAt: string;
  updatedAt: string;
  // Enhanced fields
  estimatedCost?: number;
  modelSelectionReason?: string;
  wasTruncated?: boolean;
}

type Order = 'asc' | 'desc';

/**
 * A small hook to manage sorting, pagination, etc.
 */
export function useTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState<string>('updatedAt');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState<Order>('desc');

  const onSort = useCallback(
    (id: string) => {
      const isAsc = orderBy === id && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(id);
    },
    [order, orderBy]
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
    rowsPerPage,
    onResetPage,
    onChangePage,
    onChangeRowsPerPage,
  };
}

/**
 * Enhanced SummaryView Component
 */
export const SummaryView: React.FC = () => {
  const table = useTable();

  const [filterTitle, setFilterTitle] = useState('');
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // For "Edit Title/Status" dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentSummary, setCurrentSummary] = useState<Summary | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('');
  const [editErrorMsg, setEditErrorMsg] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // For "View/Edit SummaryHtml" modal
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [modalSummary, setModalSummary] = useState<Summary | null>(null);
  const [modalHtml, setModalHtml] = useState<string>('');
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Analytics state
  const [totalCost, setTotalCost] = useState<number>(0);
  const [modelStats, setModelStats] = useState<{[key: string]: number}>({});

  /**
   * Fetch all summaries from the backend
   */
  const fetchSummaries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get<{ summaries: Summary[] }>(
        'https://stingray-app-j7k4v.ondigitalocean.app/api/editor/summaries',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      const summariesData = res.data.summaries;
      setSummaries(summariesData);

      // Calculate analytics
      const cost = summariesData.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);
      setTotalCost(cost);

      const models: {[key: string]: number} = {};
      summariesData.forEach(s => {
        if (s.modelUsed) {
          models[s.modelUsed] = (models[s.modelUsed] || 0) + 1;
        }
      });
      setModelStats(models);

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load summaries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  /**
   * Filter + sort the list of summaries
   */
  const dataFiltered: Summary[] = applyFilter({
    inputData: summaries,
    comparator: getComparator(table.order, table.orderBy),
    filterName: filterTitle,
  });

  const notFound = !dataFiltered.length && !!filterTitle;

  /**
   * Open the "Edit Title/Status" dialog
   */
  const handleOpenEdit = (summary: Summary) => {
    setCurrentSummary(summary);
    setEditTitle(summary.title ?? '');
    setEditStatus(summary.status);
    setEditErrorMsg(summary.errorMsg ?? '');
    setSaveError(null);
    setEditDialogOpen(true);
  };
  const handleCloseEdit = () => {
    setEditDialogOpen(false);
    setCurrentSummary(null);
    setEditTitle('');
    setEditStatus('');
    setEditErrorMsg('');
  };

  /**
   * Save changes (title/status/errorMsg) via PUT /api/editor/summaries/:id
   */
  const handleSave = async () => {
    if (!currentSummary) return;
    if (!editTitle.trim() || !editStatus.trim()) {
      setSaveError('Title and status are required.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `https://stingray-app-j7k4v.ondigitalocean.app/api/editor/summaries/${currentSummary.id}`,
        {
          title: editTitle,
          status: editStatus,
          errorMsg: editErrorMsg,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchSummaries();
      handleCloseEdit();
    } catch (err: any) {
      console.error(err);
      setSaveError(err.response?.data?.error || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Open the "Edit SummaryHtml" modal when clicking on articleId
   */
  const handleOpenSummaryModal = (summary: Summary) => {
    setModalSummary(summary);
    setModalHtml(summary.summaryHtml);
    setModalError(null);
    setSummaryModalOpen(true);
  };
  const handleCloseSummaryModal = () => {
    setSummaryModalOpen(false);
    setModalSummary(null);
    setModalHtml('');
    setModalError(null);
  };

  /**
   * Save changes (summaryHtml) via PUT /api/editor/summaries/:id
   */
  const handleSaveSummary = async () => {
    if (!modalSummary) return;
    if (!modalHtml.trim()) {
      setModalError('Summary cannot be empty.');
      return;
    }

    setModalSaving(true);
    setModalError(null);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `https://stingray-app-j7k4v.ondigitalocean.app/api/editor/summaries/${modalSummary.id}`,
        {
          summaryHtml: modalHtml,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchSummaries();
      handleCloseSummaryModal();
    } catch (err: any) {
      console.error(err);
      setModalError(err.response?.data?.error || 'Failed to save summary');
    } finally {
      setModalSaving(false);
    }
  };

  /**
   * Delete a summary
   */
  const handleDelete = async (summary: Summary) => {
    if (!window.confirm(`Are you sure you want to delete this summary?\n\n"${summary.title || summary.articleId}"`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `https://stingray-app-j7k4v.ondigitalocean.app/api/editor/summaries/${summary.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchSummaries();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to delete summary');
    }
  };

  /**
   * Column definitions with articleId added
   */
  const headLabel: HeadLabel[] = [
    { id: 'articleId', label: 'Article ID', align: 'left', width: 200 },
    { id: 'title',     label: 'Title',      align: 'left', width: 200 },
    { id: 'language',  label: 'Language',   align: 'left', width: 100 },
    { id: 'modelUsed', label: 'Model',      align: 'left', width: 140 },
    { id: 'estimatedCost', label: 'Cost',   align: 'left', width: 100 },
    { id: 'status',    label: 'Status',     align: 'left', width: 120 },
    { id: 'updatedAt', label: 'Updated',    align: 'left', width: 140 },
    { id: 'actions',   label: 'Actions',    align: 'right', width: 120  },
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
          Summaries
        </Typography>
        <Button
          variant="contained"
          onClick={() => window.location.href = '/editor/batch-summaries'}
          startIcon={<Iconify icon="mdi:plus" width={20} height={20} />}
        >
          New Batch
        </Button>
      </Box>

      {/* Analytics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h4" color="primary.main">
              {summaries.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Summaries
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h4" color="success.main">
              ${totalCost.toFixed(4)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Cost
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h4" color="info.main">
              {summaries.filter(s => s.status === 'completed').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completed
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h4" color="error.main">
              {summaries.filter(s => s.status === 'failed').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Failed
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/** Main Card **/}
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: 4,
          p: 2,
        }}
      >
        {/** Toolbar: Search by title **/}
        <Box
          sx={{
            mb: 2,
            px: 1,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: (theme) => theme.palette.grey[100],
            borderRadius: 1,
          }}
        >
          <TextField
            size="small"
            placeholder="Search by title..."
            value={filterTitle}
            onChange={(e) => {
              setFilterTitle(e.target.value);
              table.onResetPage();
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={18} height={18} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: '#FFFFFF',
                borderRadius: 1,
                '& fieldset': { border: 'none' },
              },
            }}
            sx={{ width: 300 }}
          />

          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            {loading
              ? 'Loading…'
              : `${summaries.length} total summaries`}
          </Typography>
        </Box>

        {/* Model Statistics */}
        {Object.keys(modelStats).length > 0 && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Model Usage:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(modelStats).map(([model, count]) => (
                <Chip
                  key={model}
                  label={`${model}: ${count}`}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              ))}
            </Box>
          </Box>
        )}

        {/** Scrollable Table in a Paper **/}
        <Scrollbar>
          <TableContainer
            component={Paper}
            elevation={2}
            sx={{
              borderRadius: 2,
              overflowX: 'auto',
            }}
          >
            <Table
              sx={{
                minWidth: 1200,
                '& th': {
                  backgroundColor: (theme) => theme.palette.grey[200],
                  fontWeight: 600,
                },
                '& tr:nth-of-type(even)': {
                  backgroundColor: (theme) => theme.palette.grey[50],
                },
                '& tr:hover': {
                  backgroundColor: (theme) => theme.palette.grey[100] + ' !important',
                },
              }}
            >
              <UserTableHead
                order={table.order}
                orderBy={table.orderBy}
                onSort={table.onSort}
                headLabel={headLabel}
              />

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="error">{error}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((summary) => (
                      <TableRow key={summary.id} hover>
                        {/** 1) Article ID - Clickable to view summary **/}
                        <TableCell align="left" sx={{ py: 1.5 }}>
                          <Link
                            component="button"
                            variant="body2"
                            onClick={() => handleOpenSummaryModal(summary)}
                            sx={{
                              textAlign: 'left',
                              maxWidth: 180,
                              wordBreak: 'break-all',
                              cursor: 'pointer',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            {summary.articleId}
                          </Link>
                        </TableCell>

                        {/** 2) Title **/}
                        <TableCell align="left" sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                              {summary.title ?? '<no title>'}
                            </Typography>
                            {summary.wasTruncated && (
                              <Tooltip title="Content was truncated due to size">
                                <Iconify icon="mdi:content-cut" width={16} height={16} color="warning.main" />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>

                        {/** 3) Language **/}
                        <TableCell align="left" sx={{ py: 1.5 }}>
                          <Typography variant="body2">{summary.language}</Typography>
                        </TableCell>

                        {/** 4) Model Used **/}
                        <TableCell align="left" sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {summary.modelUsed}
                            </Typography>
                            {summary.modelSelectionReason && (
                              <Chip
                                label={summary.modelSelectionReason}
                                size="small"
                                variant="outlined"
                                color={
                                  summary.modelSelectionReason === 'auto_optimal' ? 'success' :
                                  summary.modelSelectionReason === 'requested' ? 'primary' :
                                  summary.modelSelectionReason === 'fallback' ? 'warning' : 'default'
                                }
                              />
                            )}
                          </Box>
                        </TableCell>

                        {/** 5) Cost **/}
                        <TableCell align="left" sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="body2" fontWeight="medium">
                              ${summary.estimatedCost?.toFixed(4) || '0.0000'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {summary.promptTokens + summary.responseTokens} tokens
                            </Typography>
                          </Box>
                        </TableCell>

                        {/** 6) Status as Chip **/}
                        <TableCell align="left" sx={{ py: 1.5 }}>
                          {summary.status === 'completed' ? (
                            <Chip label="Completed" color="success" size="small" />
                          ) : summary.status === 'failed' ? (
                            <Chip label="Failed" color="error" size="small" />
                          ) : (
                            <Chip label={summary.status} color="warning" size="small" />
                          )}
                        </TableCell>

                        {/** 7) Updated At **/}
                        <TableCell align="left" sx={{ py: 1.5 }}>
                          <Typography variant="body2">
                            {new Date(summary.updatedAt).toLocaleString()}
                          </Typography>
                        </TableCell>

                        {/** 8) Actions - Edit and Delete **/}
                        <TableCell align="right" sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Edit title/status">
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() => handleOpenEdit(summary)}
                              >
                                <Iconify icon="mingcute:edit-line" width={18} height={18} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete summary">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleDelete(summary)}
                              >
                                <Iconify icon="mingcute:delete-line" width={18} height={18} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                )}

                <TableEmptyRows
                  height={68}
                  emptyRows={emptyRows(
                    table.page,
                    table.rowsPerPage,
                    summaries.length
                  )}
                />

                {notFound && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <TableNoData searchQuery={filterTitle} />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        {/** Pagination **/}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <TablePagination
            component="div"
            page={table.page}
            count={summaries.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Box>
      </Card>

      {/** "Edit Title/Status" Dialog **/}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEdit}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Edit Summary Details</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Title"
              fullWidth
              size="small"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              disabled={saving}
            />
            <TextField
              label="Status"
              fullWidth
              size="small"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              disabled={saving}
            />
            <TextField
              label="Error Message"
              fullWidth
              size="small"
              multiline
              rows={3}
              value={editErrorMsg}
              onChange={(e) => setEditErrorMsg(e.target.value)}
              disabled={saving}
            />
            {saveError && (
              <Typography color="error" variant="body2">
                {saveError}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseEdit} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/** "View/Edit SummaryHtml" Modal **/}
      <Dialog
        open={summaryModalOpen}
        onClose={handleCloseSummaryModal}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ wordBreak: 'break-all', fontSize: 14 }}>
              {modalSummary?.articleId}
            </Typography>
            {modalSummary && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={`Model: ${modalSummary.modelUsed}`} size="small" color="primary" />
                <Chip label={`Language: ${modalSummary.language}`} size="small" color="secondary" />
                <Chip 
                  label={`Cost: $${modalSummary.estimatedCost?.toFixed(4) || '0.0000'}`} 
                  size="small" 
                  color="warning" 
                />
                <Chip 
                  label={`Tokens: ${modalSummary.promptTokens + modalSummary.responseTokens}`} 
                  size="small" 
                  color="info" 
                />
                {modalSummary.wasTruncated && (
                  <Chip label="Truncated" size="small" color="error" />
                )}
              </Box>
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {modalSummary?.modelSelectionReason && (
              <Alert severity="info" variant="outlined">
                <Typography variant="body2">
                  <strong>Model Selection:</strong> {modalSummary.modelSelectionReason}
                  {modalSummary.wasTruncated && (
                    <><br/><strong>Note:</strong> Content was truncated due to length limits.</>
                  )}
                </Typography>
              </Alert>
            )}
            
            <TextField
              label="Summary HTML"
              fullWidth
              multiline
              minRows={8}
              value={modalHtml}
              onChange={(e) => setModalHtml(e.target.value)}
              disabled={modalSaving}
            />

            {modalSummary && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Token Usage Details:
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2">
                      Prompt tokens: {modalSummary.promptTokens}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2">
                      Response tokens: {modalSummary.responseTokens}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            {modalError && (
              <Typography color="error" variant="body2">
                {modalError}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseSummaryModal} disabled={modalSaving}>
            Close
          </Button>
          <Button
            onClick={handleSaveSummary}
            variant="contained"
            disabled={modalSaving}
            startIcon={modalSaving ? <CircularProgress size={16} /> : null}
          >
            Save Summary
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
};

export default SummaryView;