// src/pages/admin/export-data.tsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  Button,
  Typography,
  Grid,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
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
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Switch,
  Snackbar
} from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

interface ExportType {
  id: string;
  name: string;
  description: string;
  count: number;
  formats: string[];
  estimatedSize: string;
}

interface ExportOptions {
  exportTypes: ExportType[];
  dateRange: {
    earliest: string;
    latest: string;
  };
  supportedFormats: string[];
  maxRecordsPerExport: number;
  availableFilters: string[];
}

interface ExportHistory {
  history: Array<{
    id: string;
    type: string;
    format: string;
    status: string;
    recordCount: number;
    fileSize: string;
    createdAt: string;
    completedAt?: string;
    createdBy: string;
  }>;
  totalExports: number;
  storageUsed: string;
  lastExport: any;
}

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  format: string;
  filters: any;
  includeFields?: string[];
}

export const ExportDataPage: React.FC = () => {
  const [options, setOptions] = useState<ExportOptions | null>(null);
  const [history, setHistory] = useState<ExportHistory | null>(null);
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Export form state
  const [exportForm, setExportForm] = useState({
    type: '',
    format: 'json',
    filename: '',
    includeFields: [] as string[],
    filters: {
      dateRange: '',
      startDate: '',
      endDate: '',
      status: '',
      language: '',
      modelUsed: '',
      costThreshold: '',
      limit: ''
    }
  });

  // Dialog states
  const [exportDialog, setExportDialog] = useState(false);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [templateDialog, setTemplateDialog] = useState(false);

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    type: '',
    format: 'json',
    schedule: 'daily',
    enabled: true,
    filters: {}
  });

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const [optionsRes, historyRes, templatesRes] = await Promise.all([
        axios.get('https://stingray-app-j7k4v.ondigitalocean.app/api/admin/export/options', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('https://stingray-app-j7k4v.ondigitalocean.app/api/admin/export/history', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('https://stingray-app-j7k4v.ondigitalocean.app/api/admin/export/templates', {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
      
      setOptions(optionsRes.data);
      setHistory(historyRes.data);
      setTemplates(templatesRes.data.templates);
    } catch (err: any) {
      console.error('Failed to fetch export data:', err);
      setError(err.response?.data?.error || 'Failed to load export data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generate export
  const generateExport = async () => {
    if (!exportForm.type) {
      setError('Please select an export type');
      return;
    }

    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      
      // Prepare filters
      const filters: any = {};
      if (exportForm.filters.dateRange) {
        filters.dateRange = exportForm.filters.dateRange;
      }
      if (exportForm.filters.startDate && exportForm.filters.endDate) {
        filters.dateRange = { 
          start: new Date(exportForm.filters.startDate).toISOString(),
          end: new Date(exportForm.filters.endDate).toISOString()
        };
      }
      if (exportForm.filters.status) filters.status = exportForm.filters.status;
      if (exportForm.filters.language) filters.language = exportForm.filters.language;
      if (exportForm.filters.modelUsed) filters.modelUsed = exportForm.filters.modelUsed;
      if (exportForm.filters.costThreshold) filters.costThreshold = exportForm.filters.costThreshold;
      if (exportForm.filters.limit) filters.limit = exportForm.filters.limit;

      const response = await axios.post(
        'https://stingray-app-j7k4v.ondigitalocean.app/api/admin/export/generate',
        {
          type: exportForm.type,
          format: exportForm.format,
          filters,
          includeFields: exportForm.includeFields,
          filename: exportForm.filename
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: exportForm.format === 'json' ? 'json' : 'blob'
        }
      );

      // Handle file download
      if (exportForm.format === 'csv' || exportForm.format === 'html') {
        const blob = new Blob([response.data], { 
          type: exportForm.format === 'csv' ? 'text/csv' : 'text/html' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportForm.filename || exportForm.type}-${Date.now()}.${exportForm.format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        // JSON download
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportForm.filename || exportForm.type}-${Date.now()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      setSuccess('Export generated and downloaded successfully');
      setExportDialog(false);
      await fetchData(); // Refresh history
    } catch (err: any) {
      console.error('Export failed:', err);
      setError(err.response?.data?.error || 'Export generation failed');
    } finally {
      setExporting(false);
    }
  };

  // Schedule export
  const scheduleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'https://stingray-app-j7k4v.ondigitalocean.app/api/admin/export/schedule',
        scheduleForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Export scheduled successfully');
      setScheduleDialog(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to schedule export');
    }
  };

  // Use template
  const useTemplate = (template: ExportTemplate) => {
    setExportForm({
      type: template.type,
      format: template.format,
      filename: `${template.id}-${Date.now()}`,
      includeFields: template.includeFields || [],
      filters: {
        ...exportForm.filters,
        ...template.filters
      }
    });
    setExportDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'processing': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
          <Typography variant="h4">Export Data</Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:download-line" />}
              onClick={() => setExportDialog(true)}
            >
              New Export
            </Button>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="mingcute:time-line" />}
              onClick={() => setScheduleDialog(true)}
            >
              Schedule Export
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Export Types Overview */}
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" mb={3}>Available Export Types</Typography>
              <Grid container spacing={2}>
                {options?.exportTypes.map((type) => (
                  <Grid item xs={12} sm={6} md={4} key={type.id}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                        <Typography variant="subtitle1" fontWeight={500}>
                          {type.name}
                        </Typography>
                        <Chip label={type.count} size="small" color="primary" />
                      </Box>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {type.description}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Size: {type.estimatedSize}
                        </Typography>
                        <Box>
                          {type.formats.map((format) => (
                            <Chip key={format} label={format.toUpperCase()} size="small" sx={{ ml: 0.5 }} />
                          ))}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </Grid>

          {/* Export Templates */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" mb={3}>Quick Export Templates</Typography>
              <List>
                {templates.map((template, index) => (
                  <React.Fragment key={template.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Iconify icon="mingcute:file-export-line" />
                      </ListItemIcon>
                      <ListItemText
                        primary={template.name}
                        secondary={template.description}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => useTemplate(template)}
                      >
                        Use
                      </Button>
                    </ListItem>
                    {index < templates.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Card>
          </Grid>

          {/* Export Statistics */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" mb={3}>Export Statistics</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {history?.totalExports || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Exports
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {history?.storageUsed || '0KB'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Storage Used
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              {history?.lastExport && (
                <Box mt={2}>
                  <Typography variant="subtitle2" mb={1}>Last Export</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {history.lastExport.type} ({history.lastExport.format})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(history.lastExport.createdAt)}
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>

          {/* Export History */}
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" mb={3}>Export History</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Format</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Records</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Created By</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history?.history.map((export_) => (
                      <TableRow key={export_.id}>
                        <TableCell>{export_.type}</TableCell>
                        <TableCell>
                          <Chip label={export_.format.toUpperCase()} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={export_.status} 
                            color={getStatusColor(export_.status) as any}
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{export_.recordCount.toLocaleString()}</TableCell>
                        <TableCell>{export_.fileSize}</TableCell>
                        <TableCell>{formatDate(export_.createdAt)}</TableCell>
                        <TableCell>{export_.createdBy}</TableCell>
                        <TableCell>
                          <Tooltip title="Download">
                            <IconButton size="small" disabled={export_.status !== 'completed'}>
                              <Iconify icon="mingcute:download-line" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error">
                              <Iconify icon="mingcute:delete-line" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>

        {/* New Export Dialog */}
        <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Export</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Export Type */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Export Type</InputLabel>
                  <Select
                    value={exportForm.type}
                    onChange={(e) => setExportForm(prev => ({ ...prev, type: e.target.value }))}
                    label="Export Type"
                  >
                    {options?.exportTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name} ({type.count} records)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Format */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Format</InputLabel>
                  <Select
                    value={exportForm.format}
                    onChange={(e) => setExportForm(prev => ({ ...prev, format: e.target.value }))}
                    label="Format"
                  >
                    <MenuItem value="json">JSON</MenuItem>
                    <MenuItem value="csv">CSV</MenuItem>
                    <MenuItem value="html">HTML</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Filename */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Filename (optional)"
                  value={exportForm.filename}
                  onChange={(e) => setExportForm(prev => ({ ...prev, filename: e.target.value }))}
                  placeholder="Auto-generated if empty"
                />
              </Grid>

              {/* Filters */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<Iconify icon="mingcute:down-line" />}>
                    <Typography>Filters & Options</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Date Range</InputLabel>
                          <Select
                            value={exportForm.filters.dateRange}
                            onChange={(e) => setExportForm(prev => ({
                              ...prev,
                              filters: { ...prev.filters, dateRange: e.target.value }
                            }))}
                            label="Date Range"
                          >
                            <MenuItem value="">All Time</MenuItem>
                            <MenuItem value="last-24h">Last 24 Hours</MenuItem>
                            <MenuItem value="last-7d">Last 7 Days</MenuItem>
                            <MenuItem value="last-30d">Last 30 Days</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Start Date"
                          type="date"
                          value={exportForm.filters.startDate}
                          onChange={(e) => setExportForm(prev => ({
                            ...prev,
                            filters: { ...prev.filters, startDate: e.target.value }
                          }))}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="End Date"
                          type="date"
                          value={exportForm.filters.endDate}
                          onChange={(e) => setExportForm(prev => ({
                            ...prev,
                            filters: { ...prev.filters, endDate: e.target.value }
                          }))}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Status</InputLabel>
                          <Select
                            value={exportForm.filters.status}
                            onChange={(e) => setExportForm(prev => ({
                              ...prev,
                              filters: { ...prev.filters, status: e.target.value }
                            }))}
                            label="Status"
                          >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                            <MenuItem value="failed">Failed</MenuItem>
                            <MenuItem value="processing">Processing</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Record Limit"
                          type="number"
                          value={exportForm.filters.limit}
                          onChange={(e) => setExportForm(prev => ({
                            ...prev,
                            filters: { ...prev.filters, limit: e.target.value }
                          }))}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Language"
                          value={exportForm.filters.language}
                          onChange={(e) => setExportForm(prev => ({
                            ...prev,
                            filters: { ...prev.filters, language: e.target.value }
                          }))}
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialog(false)}>Cancel</Button>
            <Button 
              onClick={generateExport} 
              variant="contained" 
              disabled={exporting || !exportForm.type}
              startIcon={exporting ? <CircularProgress size={16} /> : <Iconify icon="mingcute:download-line" />}
            >
              {exporting ? 'Generating...' : 'Generate Export'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Schedule Export Dialog */}
        <Dialog open={scheduleDialog} onClose={() => setScheduleDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Schedule Recurring Export</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Export Type</InputLabel>
                  <Select
                    value={scheduleForm.type}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, type: e.target.value }))}
                    label="Export Type"
                  >
                    {options?.exportTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Format</InputLabel>
                  <Select
                    value={scheduleForm.format}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, format: e.target.value }))}
                    label="Format"
                  >
                    <MenuItem value="json">JSON</MenuItem>
                    <MenuItem value="csv">CSV</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Schedule</InputLabel>
                  <Select
                    value={scheduleForm.schedule}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, schedule: e.target.value }))}
                    label="Schedule"
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={scheduleForm.enabled}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, enabled: e.target.checked }))}
                    />
                  }
                  label="Enable scheduled export"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setScheduleDialog(false)}>Cancel</Button>
            <Button onClick={scheduleExport} variant="contained">
              Schedule Export
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Snackbar */}
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
          message={success}
        />
      </DashboardContent>
  );
};

export default ExportDataPage;