// src/views/ReviewEditView.tsx - COMPREHENSIVE VERSION

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  Typography,
  Paper,
  Divider,
  Grid,
  TextField,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  InputAdornment,
  Snackbar
} from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

interface Summary {
  id: string;
  articleId: string;
  title: string;
  language: string;
  summaryHtml: string;
  modelUsed: string;
  promptTokens: number;
  responseTokens: number;
  status: string;
  errorMsg?: string;
  estimatedCost: number;
  createdAt: string;
  updatedAt: string;
  wasTruncated?: boolean;
  modelSelectionReason?: string;
}

interface ReviewAction {
  id: string;
  summaryId: string;
  action: 'approved' | 'rejected' | 'needs_revision';
  comment: string;
  reviewedBy: string;
  reviewedAt: string;
}

export const ReviewEditView: React.FC = () => {
  // State management
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Selected summary for review
  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);
  const [reviewDialog, setReviewDialog] = useState<boolean>(false);
  
  // Review form state
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected' | 'needs_revision'>('approved');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [editedSummary, setEditedSummary] = useState<string>('');
  const [editedTitle, setEditedTitle] = useState<string>('');
  
  // Filter and pagination
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Tab state
  const [currentTab, setCurrentTab] = useState(0);
  
  // Bulk actions
  const [selectedSummaryIds, setSelectedSummaryIds] = useState<string[]>([]);
  const [bulkActionDialog, setBulkActionDialog] = useState<boolean>(false);
  
  // Processing state
  const [saving, setSaving] = useState<boolean>(false);

  // Fetch summaries
  const fetchSummaries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('https://stingray-app-j7k4v.ondigitalocean.app/api/editor/summaries', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummaries(res.data.summaries || []);
    } catch (err: any) {
      console.error('Failed to fetch summaries:', err);
      setError(err.response?.data?.error || 'Failed to load summaries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  // Filter summaries based on criteria
  const filteredSummaries = summaries.filter(summary => {
    const matchesStatus = statusFilter === 'all' || summary.status === statusFilter;
    const matchesLanguage = languageFilter === 'all' || summary.language === languageFilter;
    const matchesSearch = !searchQuery || 
      summary.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      summary.articleId.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesLanguage && matchesSearch;
  });

  // Paginated summaries
  const paginatedSummaries = filteredSummaries.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Open review dialog
  const handleReviewSummary = (summary: Summary) => {
    setSelectedSummary(summary);
    setEditedSummary(summary.summaryHtml);
    setEditedTitle(summary.title);
    setReviewComment('');
    setReviewAction('approved');
    setReviewDialog(true);
  };

  // Save review
  const handleSaveReview = async () => {
    if (!selectedSummary) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Update the summary if edited
      if (editedSummary !== selectedSummary.summaryHtml || editedTitle !== selectedSummary.title) {
        await axios.put(
          `https://stingray-app-j7k4v.ondigitalocean.app/api/editor/summaries/${selectedSummary.id}`,
          {
            title: editedTitle,
            summaryHtml: editedSummary,
            status: reviewAction === 'approved' ? 'completed' : 
                    reviewAction === 'rejected' ? 'failed' : 'needs_revision'
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setSuccess(`Summary ${reviewAction} successfully!`);
      setReviewDialog(false);
      await fetchSummaries();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  // Bulk approve/reject
  const handleBulkAction = async (action: 'approved' | 'rejected') => {
    if (selectedSummaryIds.length === 0) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Update each selected summary
      await Promise.all(
        selectedSummaryIds.map(id =>
          axios.put(
            `https://stingray-app-j7k4v.ondigitalocean.app/api/editor/summaries/${id}`,
            { status: action === 'approved' ? 'completed' : 'failed' },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );

      setSuccess(`${selectedSummaryIds.length} summaries ${action} successfully!`);
      setSelectedSummaryIds([]);
      setBulkActionDialog(false);
      await fetchSummaries();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Bulk action failed');
    } finally {
      setSaving(false);
    }
  };

  // Toggle summary selection
  const handleToggleSelection = (summaryId: string) => {
    setSelectedSummaryIds(prev =>
      prev.includes(summaryId)
        ? prev.filter(id => id !== summaryId)
        : [...prev, summaryId]
    );
  };

  // Select all summaries on current page
  const handleSelectAll = () => {
    const currentPageIds = paginatedSummaries.map(s => s.id);
    const allSelected = currentPageIds.every(id => selectedSummaryIds.includes(id));
    
    if (allSelected) {
      setSelectedSummaryIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedSummaryIds(prev => [...new Set([...prev, ...currentPageIds])]);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'needs_revision': return 'warning';
      default: return 'default';
    }
  };

  // Get unique languages for filter
  const uniqueLanguages = [...new Set(summaries.map(s => s.language))];

  return (
    <DashboardContent>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Review &amp; Edit Summaries
        </Typography>
        
        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main">
                {summaries.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Summaries
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {summaries.filter(s => s.status === 'completed').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {summaries.filter(s => s.status === 'needs_revision').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Needs Review
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {summaries.filter(s => s.status === 'failed').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rejected
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
        {/* Filters and Actions */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search summaries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="completed">Approved</MenuItem>
                  <MenuItem value="needs_revision">Needs Review</MenuItem>
                  <MenuItem value="failed">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  label="Language"
                >
                  <MenuItem value="all">All Languages</MenuItem>
                  {uniqueLanguages.map(lang => (
                    <MenuItem key={lang} value={lang}>{lang}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {selectedSummaryIds.length > 0 && (
                  <>
                    <Button
                      variant="outlined"
                      color="success"
                      size="small"
                      onClick={() => setBulkActionDialog(true)}
                      startIcon={<Iconify icon="mingcute:check-line" />}
                    >
                      Bulk Actions ({selectedSummaryIds.length})
                    </Button>
                  </>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={fetchSummaries}
                  startIcon={<Iconify icon="mingcute:refresh-1-line" />}
                >
                  Refresh
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Summaries Table */}
        <Scrollbar>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={paginatedSummaries.length > 0 && 
                        paginatedSummaries.every(s => selectedSummaryIds.includes(s.id))}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Article</TableCell>
                  <TableCell>Language</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : paginatedSummaries.map((summary) => (
                  <TableRow key={summary.id} hover>
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        checked={selectedSummaryIds.includes(summary.id)}
                        onChange={() => handleToggleSelection(summary.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 200 }}>
                          {summary.title || 'Untitled'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                          {summary.articleId}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={summary.language} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{summary.modelUsed}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">${summary.estimatedCost?.toFixed(4) || '0.0000'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={summary.status} 
                        color={getStatusColor(summary.status) as any}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDate(summary.createdAt)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Review & Edit">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleReviewSummary(summary)}
                        >
                          <Iconify icon="mingcute:edit-line" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredSummaries.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onClose={() => setReviewDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Review & Edit Summary</Typography>
          {selectedSummary && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {selectedSummary.articleId}
            </Typography>
          )}
        </DialogTitle>
        
        <DialogContent dividers>
          {selectedSummary && (
            <Grid container spacing={3}>
              {/* Left Column - Edit Form */}
              <Grid item xs={12} md={7}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Title"
                    fullWidth
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    disabled={saving}
                  />
                  
                  <TextField
                    label="Summary Content (HTML)"
                    fullWidth
                    multiline
                    minRows={12}
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    disabled={saving}
                  />
                  
                  <TextField
                    label="Review Comment"
                    fullWidth
                    multiline
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Add your review comments here..."
                    disabled={saving}
                  />
                </Box>
              </Grid>
              
              {/* Right Column - Summary Info & Preview */}
              <Grid item xs={12} md={5}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Summary Metadata */}
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Summary Details</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Language" secondary={selectedSummary.language} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Model Used" secondary={selectedSummary.modelUsed} />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Cost" 
                          secondary={`${selectedSummary.estimatedCost?.toFixed(4) || '0.0000'}`} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Tokens" 
                          secondary={`${selectedSummary.promptTokens + selectedSummary.responseTokens} total`} 
                        />
                      </ListItem>
                      {selectedSummary.wasTruncated && (
                        <ListItem>
                          <ListItemText 
                            primary="Content Truncated" 
                            secondary="Original content was too large"
                          />
                        </ListItem>
                      )}
                    </List>
                  </Paper>
                  
                  {/* Preview */}
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Summary Preview</Typography>
                    <Box 
                      sx={{ 
                        maxHeight: 300, 
                        overflow: 'auto', 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1, 
                        p: 1 
                      }}
                      dangerouslySetInnerHTML={{ __html: editedSummary }}
                    />
                  </Paper>
                  
                  {/* Review Actions */}
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Review Decision</Typography>
                    <FormControl fullWidth>
                      <InputLabel>Action</InputLabel>
                      <Select
                        value={reviewAction}
                        onChange={(e) => setReviewAction(e.target.value as any)}
                        label="Action"
                        disabled={saving}
                      >
                        <MenuItem value="approved">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Iconify icon="mingcute:check-line" color="success.main" />
                            Approve
                          </Box>
                        </MenuItem>
                        <MenuItem value="needs_revision">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Iconify icon="mingcute:edit-line" color="warning.main" />
                            Needs Revision
                          </Box>
                        </MenuItem>
                        <MenuItem value="rejected">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Iconify icon="mingcute:close-line" color="error.main" />
                            Reject
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Paper>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setReviewDialog(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveReview}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            Save Review
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialog} onClose={() => setBulkActionDialog(false)}>
        <DialogTitle>Bulk Actions</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            What would you like to do with {selectedSummaryIds.length} selected summaries?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => handleBulkAction('rejected')}
            color="error"
            disabled={saving}
          >
            Reject All
          </Button>
          <Button 
            onClick={() => handleBulkAction('approved')}
            color="success"
            variant="contained"
            disabled={saving}
          >
            Approve All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbars */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        message={success}
      />
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </DashboardContent>
  );
};

export default ReviewEditView;