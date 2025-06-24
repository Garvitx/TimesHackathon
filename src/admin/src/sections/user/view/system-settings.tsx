// src/pages/admin/system-settings.tsx
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  FormControlLabel,
  Snackbar
} from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

interface SystemSettings {
  database: { status: string; stats: any };
  redis: { status: string; stats: any };
  openai: { status: string };
  rateLimiting: any;
  costManagement: any;
  email: any;
  security: any;
  models: any;
  performance: any;
  environment: string;
}

interface ModelConfig {
  maxTokens: number;
  costPerPromptToken: number;
  costPerResponseToken: number;
  maxOutputTokens: number;
  priority: number;
  enabled: boolean;
}

export const SystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [modelDialog, setModelDialog] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
  const [rateLimitDialog, setRateLimitDialog] = useState(false);
  const [costDialog, setCostDialog] = useState(false);

  // Form states
  const [rateLimits, setRateLimits] = useState({
    tokenHandshake: { windowMs: 60000, max: 10 },
    summarization: { windowMs: 3600000, max: 100 }
  });
  
  const [costSettings, setCostSettings] = useState({
    maxCostPerArticle: 0.10,
    maxCostPerBatch: 5.00,
    autoSelectModel: true,
    defaultModel: 'gpt-4.1-nano'
  });

  // Fetch system settings
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('https://stingray-app-j7k4v.ondigitalocean.app/api/admin/system-settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(res.data);
      
      // Update form states
      if (res.data.rateLimiting) {
        setRateLimits(res.data.rateLimiting);
      }
      if (res.data.costManagement) {
        setCostSettings(res.data.costManagement);
      }
    } catch (err: any) {
      console.error('Failed to fetch settings:', err);
      setError(err.response?.data?.error || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Test connections
  const testConnection = async (service?: string) => {
    setTesting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'https://stingray-app-j7k4v.ondigitalocean.app/api/admin/system-settings/test-connection',
        { service },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`Connection test successful: ${JSON.stringify(res.data.results)}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  // Clear cache
  const clearCache = async (pattern?: string) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'https://stingray-app-j7k4v.ondigitalocean.app/api/admin/system-settings/clear-cache',
        { pattern },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Cache cleared successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to clear cache');
    } finally {
      setSaving(false);
    }
  };

  // Update rate limits
  const updateRateLimits = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'https://stingray-app-j7k4v.ondigitalocean.app/api/admin/system-settings/rate-limits',
        rateLimits,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Rate limits updated successfully');
      setRateLimitDialog(false);
      await fetchSettings();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update rate limits');
    } finally {
      setSaving(false);
    }
  };

  // Update cost settings
  const updateCostSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'https://stingray-app-j7k4v.ondigitalocean.app/api/admin/system-settings/cost-management',
        costSettings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Cost settings updated successfully');
      setCostDialog(false);
      await fetchSettings();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update cost settings');
    } finally {
      setSaving(false);
    }
  };

  // Update model configuration
  const updateModelConfig = async () => {
    if (!selectedModel || !modelConfig) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'https://stingray-app-j7k4v.ondigitalocean.app/api/admin/system-settings/models',
        { modelName: selectedModel, config: modelConfig },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Model configuration updated successfully');
      setModelDialog(false);
      await fetchSettings();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update model configuration');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status.toLowerCase().includes('connected') || status.toLowerCase().includes('configured')) {
      return 'success';
    }
    if (status.toLowerCase().includes('error')) {
      return 'error';
    }
    return 'warning';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
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
        System Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* System Status Overview */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Typography variant="h6">System Status</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="mingcute:refresh-1-line" />}
                onClick={() => testConnection()}
                disabled={testing}
              >
                Test All Connections
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Chip
                    label={settings?.database.status || 'Unknown'}
                    color={getStatusColor(settings?.database.status || '') as any}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Database
                  </Typography>
                  {settings?.database.stats && (
                    <Typography variant="caption" display="block">
                      {settings.database.stats.userCount} users, {settings.database.stats.summaryCount} summaries
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Chip
                    label={settings?.redis.status || 'Unknown'}
                    color={getStatusColor(settings?.redis.status || '') as any}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Redis Cache
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => clearCache()}
                    disabled={saving}
                  >
                    Clear Cache
                  </Button>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Chip
                    label={settings?.openai.status || 'Unknown'}
                    color={getStatusColor(settings?.openai.status || '') as any}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    OpenAI API
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Chip
                    label={settings?.environment || 'Unknown'}
                    color="info"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Environment
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Configuration Sections */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<Iconify icon="mingcute:down-line" />}>
              <Typography variant="h6">Rate Limiting</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2">
                  Control API request rates to prevent abuse
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setRateLimitDialog(true)}
                >
                  Configure
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2">Token Handshake</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {settings?.rateLimiting?.tokenHandshake?.max || 10} requests per{' '}
                      {((settings?.rateLimiting?.tokenHandshake?.windowMs || 60000) / 1000)} seconds
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2">Summarization</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {settings?.rateLimiting?.summarization?.max || 100} requests per{' '}
                      {((settings?.rateLimiting?.summarization?.windowMs || 3600000) / 60000)} minutes
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<Iconify icon="mingcute:down-line" />}>
              <Typography variant="h6">Cost Management</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2">
                  Configure spending limits and model selection
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setCostDialog(true)}
                >
                  Configure
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2">Max Cost/Article</Typography>
                    <Typography variant="h6" color="primary">
                      ${settings?.costManagement?.maxCostPerArticle || 0.10}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2">Max Cost/Batch</Typography>
                    <Typography variant="h6" color="primary">
                      ${settings?.costManagement?.maxCostPerBatch || 5.00}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2">Auto Model Selection</Typography>
                    <Chip
                      label={settings?.costManagement?.autoSelectModel ? 'Enabled' : 'Disabled'}
                      color={settings?.costManagement?.autoSelectModel ? 'success' : 'default'}
                      size="small"
                    />
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2">Default Model</Typography>
                    <Typography variant="body2">
                      {settings?.costManagement?.defaultModel || 'gpt-4.1-nano'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<Iconify icon="mingcute:down-line" />}>
              <Typography variant="h6">Model Configurations</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Model</TableCell>
                      <TableCell>Max Tokens</TableCell>
                      <TableCell>Prompt Cost</TableCell>
                      <TableCell>Response Cost</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {settings?.models?.configs && Object.entries(settings.models.configs).map(([modelName, config]: [string, any]) => (
                      <TableRow key={modelName}>
                        <TableCell>{modelName}</TableCell>
                        <TableCell>{config.maxTokens?.toLocaleString()}</TableCell>
                        <TableCell>${(config.costPerPromptToken * 1000000).toFixed(2)}/1M</TableCell>
                        <TableCell>${(config.costPerResponseToken * 1000000).toFixed(2)}/1M</TableCell>
                        <TableCell>{config.priority}</TableCell>
                        <TableCell>
                          <Chip
                            label={config.enabled ? 'Enabled' : 'Disabled'}
                            color={config.enabled ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedModel(modelName);
                              setModelConfig(config);
                              setModelDialog(true);
                            }}
                          >
                            <Iconify icon="mingcute:edit-line" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<Iconify icon="mingcute:down-line" />}>
              <Typography variant="h6">Performance & System Info</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" mb={1}>System Performance</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Uptime" secondary={formatUptime(settings?.performance?.uptime || 0)} />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Memory Usage" 
                          secondary={formatBytes(settings?.performance?.memoryUsage?.heapUsed || 0)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Node.js Version" 
                          secondary={settings?.performance?.nodeVersion || 'Unknown'} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Platform" 
                          secondary={settings?.performance?.platform || 'Unknown'} 
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" mb={1}>Email Configuration</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="SMTP Status" 
                          secondary={
                            <Chip 
                              label={settings?.email?.configured ? 'Configured' : 'Not Configured'}
                              color={settings?.email?.configured ? 'success' : 'warning'}
                              size="small"
                            />
                          }
                        />
                      </ListItem>
                      {settings?.email?.configured && (
                        <>
                          <ListItem>
                            <ListItemText primary="Host" secondary={settings.email.host} />
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="Port" secondary={settings.email.port} />
                          </ListItem>
                        </>
                      )}
                    </List>
                  </Paper>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* Rate Limits Dialog */}
      <Dialog open={rateLimitDialog} onClose={() => setRateLimitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configure Rate Limits</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" mb={1}>Token Handshake Rate Limit</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Max Requests"
                    type="number"
                    fullWidth
                    value={rateLimits.tokenHandshake.max}
                    onChange={(e) => setRateLimits(prev => ({
                      ...prev,
                      tokenHandshake: { ...prev.tokenHandshake, max: parseInt(e.target.value) }
                    }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Window (seconds)"
                    type="number"
                    fullWidth
                    value={rateLimits.tokenHandshake.windowMs / 1000}
                    onChange={(e) => setRateLimits(prev => ({
                      ...prev,
                      tokenHandshake: { ...prev.tokenHandshake, windowMs: parseInt(e.target.value) * 1000 }
                    }))}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" mb={1}>Summarization Rate Limit</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Max Requests"
                    type="number"
                    fullWidth
                    value={rateLimits.summarization.max}
                    onChange={(e) => setRateLimits(prev => ({
                      ...prev,
                      summarization: { ...prev.summarization, max: parseInt(e.target.value) }
                    }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Window (minutes)"
                    type="number"
                    fullWidth
                    value={rateLimits.summarization.windowMs / 60000}
                    onChange={(e) => setRateLimits(prev => ({
                      ...prev,
                      summarization: { ...prev.summarization, windowMs: parseInt(e.target.value) * 60000 }
                    }))}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRateLimitDialog(false)}>Cancel</Button>
          <Button onClick={updateRateLimits} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={16} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cost Settings Dialog */}
      <Dialog open={costDialog} onClose={() => setCostDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configure Cost Management</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                label="Max Cost per Article ($)"
                type="number"
                step="0.01"
                fullWidth
                value={costSettings.maxCostPerArticle}
                onChange={(e) => setCostSettings(prev => ({
                  ...prev,
                  maxCostPerArticle: parseFloat(e.target.value)
                }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Max Cost per Batch ($)"
                type="number"
                step="0.01"
                fullWidth
                value={costSettings.maxCostPerBatch}
                onChange={(e) => setCostSettings(prev => ({
                  ...prev,
                  maxCostPerBatch: parseFloat(e.target.value)
                }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={costSettings.autoSelectModel}
                    onChange={(e) => setCostSettings(prev => ({
                      ...prev,
                      autoSelectModel: e.target.checked
                    }))}
                  />
                }
                label="Enable automatic model selection based on content size and cost"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Default Model</InputLabel>
                <Select
                  value={costSettings.defaultModel}
                  onChange={(e) => setCostSettings(prev => ({
                    ...prev,
                    defaultModel: e.target.value
                  }))}
                  label="Default Model"
                >
                  {settings?.models?.configs && Object.keys(settings.models.configs).map(model => (
                    <MenuItem key={model} value={model}>{model}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCostDialog(false)}>Cancel</Button>
          <Button onClick={updateCostSettings} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={16} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Model Configuration Dialog */}
      <Dialog open={modelDialog} onClose={() => setModelDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Configure Model: {selectedModel}</DialogTitle>
        <DialogContent>
          {modelConfig && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  label="Max Tokens"
                  type="number"
                  fullWidth
                  value={modelConfig.maxTokens}
                  onChange={(e) => setModelConfig(prev => prev ? ({
                    ...prev,
                    maxTokens: parseInt(e.target.value)
                  }) : null)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Max Output Tokens"
                  type="number"
                  fullWidth
                  value={modelConfig.maxOutputTokens}
                  onChange={(e) => setModelConfig(prev => prev ? ({
                    ...prev,
                    maxOutputTokens: parseInt(e.target.value)
                  }) : null)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Prompt Cost (per 1M tokens)"
                  type="number"
                  step="0.01"
                  fullWidth
                  value={modelConfig.costPerPromptToken * 1000000}
                  onChange={(e) => setModelConfig(prev => prev ? ({
                    ...prev,
                    costPerPromptToken: parseFloat(e.target.value) / 1000000
                  }) : null)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Response Cost (per 1M tokens)"
                  type="number"
                  step="0.01"
                  fullWidth
                  value={modelConfig.costPerResponseToken * 1000000}
                  onChange={(e) => setModelConfig(prev => prev ? ({
                    ...prev,
                    costPerResponseToken: parseFloat(e.target.value) / 1000000
                  }) : null)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Priority (1-10)"
                  type="number"
                  fullWidth
                  value={modelConfig.priority}
                  onChange={(e) => setModelConfig(prev => prev ? ({
                    ...prev,
                    priority: parseInt(e.target.value)
                  }) : null)}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={modelConfig.enabled}
                      onChange={(e) => setModelConfig(prev => prev ? ({
                        ...prev,
                        enabled: e.target.checked
                      }) : null)}
                    />
                  }
                  label="Enable this model"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModelDialog(false)}>Cancel</Button>
          <Button onClick={updateModelConfig} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={16} /> : 'Update'}
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

export default SystemSettingsPage;