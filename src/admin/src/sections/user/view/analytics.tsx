// src/pages/admin/analytics.tsx
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

interface AnalyticsOverview {
  overview: {
    totalSummaries: number;
    completedSummaries: number;
    failedSummaries: number;
    successRate: number;
    totalCost: number;
    avgCostPerSummary: number;
  };
  costByDay: Array<{ date: string; cost: number }>;
  modelUsage: Array<{
    model: string;
    count: number;
    totalTokens: number;
    avgPromptTokens: number;
    avgResponseTokens: number;
    estimatedCost: number;
  }>;
  languageStats: Array<{
    language: string;
    count: number;
    avgCost: number;
  }>;
  dailyActivity: Array<{
    date: string;
    total: number;
    completed: number;
    failed: number;
    successRate: number;
  }>;
  performance: {
    avgPromptTokens: number;
    avgResponseTokens: number;
    avgCost: number;
    maxCost: number;
    minCost: number;
  } | null;
}

interface CostForecast {
  historical: Array<{ date: string; actualCost: number; actualCount: number }>;
  forecast: Array<{ date: string; estimatedCost: number; estimatedCount: number; confidence: number }>;
  summary: {
    avgDailyCost: number;
    avgDailyCount: number;
    trend: string;
    totalForecastCost: number;
    forecastPeriod: string;
  };
}

interface ModelComparison {
  comparison: Array<{
    model: string;
    usage: { count: number; percentage: number };
    costs: { total: number; average: number; min: number; max: number };
    tokens: { totalPrompt: number; totalResponse: number; avgPrompt: number; avgResponse: number; total: number };
    pricing: { promptCostPer1M: string; responseCostPer1M: string };
    efficiency: { costPerToken: number };
  }>;
  summary: {
    totalModelsUsed: number;
    mostUsedModel: string;
    totalCost: number;
    totalTokens: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const AnalyticsPage: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [forecast, setForecast] = useState<CostForecast | null>(null);
  const [modelComparison, setModelComparison] = useState<ModelComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [exportDialog, setExportDialog] = useState(false);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const [overviewRes, forecastRes, modelRes] = await Promise.all([
        axios.get(`https://stingray-app-j7k4v.ondigitalocean.app/api/admin/analytics/overview?timeRange=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('https://stingray-app-j7k4v.ondigitalocean.app/api/admin/analytics/cost-forecast?days=30', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`https://stingray-app-j7k4v.ondigitalocean.app/api/admin/analytics/model-comparison?timeRange=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
      
      setOverview(overviewRes.data);
      setForecast(forecastRes.data);
      setModelComparison(modelRes.data);
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      setError(err.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Export analytics data
  const exportData = async (format: 'json' | 'csv', type: 'overview' | 'model-comparison') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `https://stingray-app-j7k4v.ondigitalocean.app/api/admin/analytics/export?format=${format}&timeRange=${timeRange}&type=${type}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: format === 'csv' ? 'blob' : 'json'
        }
      );
      
      if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${type}-${timeRange}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${type}-${timeRange}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      
      setExportDialog(false);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const formatCurrency = (amount: number) => `${amount.toFixed(6)}`;
  const formatNumber = (num: number) => num.toLocaleString();

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
        <Typography variant="h4">Advanced Analytics</Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="7d">7 Days</MenuItem>
              <MenuItem value="30d">30 Days</MenuItem>
              <MenuItem value="90d">90 Days</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="mingcute:download-line" />}
            onClick={() => setExportDialog(true)}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="mingcute:refresh-1-line" />}
            onClick={fetchAnalytics}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="primary.main">
              {formatNumber(overview?.overview.totalSummaries || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Summaries
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {overview?.overview.successRate.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Success Rate
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {formatCurrency(overview?.overview.totalCost || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Cost
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {formatCurrency(overview?.overview.avgCostPerSummary || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Cost/Summary
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="error.main">
              {formatNumber(overview?.overview.failedSummaries || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Failed Summaries
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {formatNumber(overview?.performance?.avgPromptTokens || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Prompt Tokens
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Cost Trends */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" mb={3}>Daily Cost Trends</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={overview?.costByDay || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip formatter={(value: any) => [formatCurrency(value), 'Cost']} />
                <Area type="monotone" dataKey="cost" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Model Usage Distribution */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" mb={3}>Model Usage Distribution</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={overview?.modelUsage || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ model, count }) => `${model}: ${count}`}
                >
                  {overview?.modelUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Daily Activity */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" mb={3}>Daily Activity & Success Rate</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={overview?.dailyActivity || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="completed" fill="#00C49F" name="Completed" />
                <Bar yAxisId="left" dataKey="failed" fill="#FF8042" name="Failed" />
                <Line yAxisId="right" type="monotone" dataKey="successRate" stroke="#8884d8" name="Success Rate %" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Language Statistics */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" mb={3}>Language Distribution</Typography>
            <List>
              {overview?.languageStats.slice(0, 6).map((lang, index) => (
                <ListItem key={lang.language}>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">{lang.language}</Typography>
                        <Chip label={lang.count} size="small" color="primary" />
                      </Box>
                    }
                    secondary={`Avg cost: ${formatCurrency(lang.avgCost)}`}
                  />
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>

        {/* Cost Forecast */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Cost Forecast (Next 30 Days)</Typography>
              <Box>
                <Chip 
                  label={`Trend: ${forecast?.summary.trend || 'Unknown'}`}
                  color={
                    forecast?.summary.trend === 'increasing' ? 'warning' :
                    forecast?.summary.trend === 'decreasing' ? 'success' : 'info'
                  }
                  size="small"
                />
                <Typography variant="body2" sx={{ ml: 2, display: 'inline' }}>
                  Projected: {formatCurrency(forecast?.summary.totalForecastCost || 0)}
                </Typography>
              </Box>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={[
                  ...(forecast?.historical.map(h => ({ ...h, type: 'historical' })) || []),
                  ...(forecast?.forecast.map(f => ({ 
                    date: f.date, 
                    actualCost: f.estimatedCost, 
                    type: 'forecast',
                    confidence: f.confidence 
                  })) || [])
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip formatter={(value: any, name: string) => [
                  formatCurrency(value), 
                  name === 'actualCost' ? 'Cost' : name
                ]} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="actualCost" 
                  stroke="#8884d8" 
                  strokeDasharray={(entry: any) => entry?.type === 'forecast' ? "5 5" : "0"}
                  name="Cost"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Model Comparison Table */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" mb={3}>Model Performance Comparison</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Model</TableCell>
                    <TableCell>Usage</TableCell>
                    <TableCell>Total Cost</TableCell>
                    <TableCell>Avg Cost</TableCell>
                    <TableCell>Total Tokens</TableCell>
                    <TableCell>Efficiency</TableCell>
                    <TableCell>Pricing</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modelComparison?.comparison.map((model) => (
                    <TableRow key={model.model}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {model.model}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {formatNumber(model.usage.count)} ({model.usage.percentage}%)
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{formatCurrency(model.costs.total)}</TableCell>
                      <TableCell>{formatCurrency(model.costs.average)}</TableCell>
                      <TableCell>
                        <Tooltip title={`Prompt: ${formatNumber(model.tokens.totalPrompt)}, Response: ${formatNumber(model.tokens.totalResponse)}`}>
                          <span>{formatNumber(model.tokens.total)}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Cost per 1M tokens">
                          <span>{formatCurrency(model.efficiency.costPerToken)}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          ${model.pricing.promptCostPer1M}/${model.pricing.responseCostPer1M}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)}>
        <DialogTitle>Export Analytics Data</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose the format and type of data to export.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => exportData('json', 'overview')}
                startIcon={<Iconify icon="mingcute:file-code-line" />}
              >
                Overview (JSON)
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => exportData('csv', 'overview')}
                startIcon={<Iconify icon="mingcute:file-text-line" />}
              >
                Overview (CSV)
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => exportData('json', 'model-comparison')}
                startIcon={<Iconify icon="mingcute:file-code-line" />}
              >
                Models (JSON)
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => exportData('csv', 'model-comparison')}
                startIcon={<Iconify icon="mingcute:file-text-line" />}
              >
                Models (CSV)
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
};

export default AnalyticsPage;