// src/views/BatchSummaryView.tsx - FIXED VERSION

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

interface BatchResult {
  articleId: string;
  status: 'pending' | 'completed' | 'error';
  errorMsg?: string;
  modelUsed?: string;
  estimatedCost?: number;
  language?: string;
  wasTruncated?: boolean;
}

interface AvailableModel {
  name: string;
  costPerPromptToken: number;
  costPerResponseToken: number;
  maxOutputTokens: number;
  costPer1MPromptTokens: number;
  costPer1MResponseTokens: number;
}

interface BatchSummary {
  totalProcessed: number;
  successful: number;
  failed: number;
  totalEstimatedCost: number;
  modelUsageStats: { [key: string]: { count: number; totalCost: number } };
  averageCostPerArticle: number;
}

export const BatchSummaryView: React.FC = () => {
  // Form state
  const [articleListText, setArticleListText] = useState<string>('');
  const [model, setModel] = useState<string>('gpt-4.1-nano'); // Default to nano
  const [promptTemplate, setPromptTemplate] = useState<string>('');
  
  // Processing state
  const [batchRunning, setBatchRunning] = useState<boolean>(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [batchSummary, setBatchSummary] = useState<BatchSummary | null>(null);
  
  // Available models
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState<boolean>(true);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Cost estimation
  const [estimatingCost, setEstimatingCost] = useState<boolean>(false);
  const [costEstimate, setCostEstimate] = useState<any>(null);

  // Fetch available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('https://stingray-app-j7k4v.ondigitalocean.app/api/editor/models', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAvailableModels(res.data.models || []);
        console.log('Available models:', res.data.models);
      } catch (err) {
        console.error('Failed to fetch available models:', err);
        setBatchError('Failed to load available models');
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, []);

  // Parse URLs from textarea
  const parseUrls = (): string[] => {
    return Array.from(
      new Set(
        articleListText
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      )
    );
  };

  // Handle CSV upload
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const parsedUrls: string[] = lines.map((ln) => {
        const cols = ln.split(',');
        return cols[0].trim();
      });
      const existing = parseUrls();
      const combined = Array.from(new Set([...existing, ...parsedUrls]));
      setArticleListText(combined.join('\n'));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Estimate cost for the batch
  const handleEstimateCost = useCallback(async () => {
    const urls = parseUrls();
    if (!urls.length) {
      setBatchError('Please supply at least one URL.');
      return;
    }

    if (!model) {
      setBatchError('Please select a model.');
      return;
    }

    setEstimatingCost(true);
    setCostEstimate(null);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'https://stingray-app-j7k4v.ondigitalocean.app/api/editor/estimate-cost',
        {
          url: urls[0],
          model: model,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setCostEstimate({
        ...res.data,
        totalUrls: urls.length,
        estimatedTotalCost: (res.data.estimates[0]?.estimatedCost || 0) * urls.length
      });
    } catch (err: any) {
      console.error('Cost estimation error', err);
      setBatchError(err.response?.data?.error || 'Cost estimation failed.');
    } finally {
      setEstimatingCost(false);
    }
  }, [articleListText, model]);

  // Run batch summarization
  const handleRunBatch = useCallback(async () => {
    const urls = parseUrls();
    if (!urls.length) {
      setBatchError('Please supply at least one URL.');
      return;
    }

    if (!model) {
      setBatchError('Please select a model.');
      return;
    }

    // Initialize results with "pending"
    const initialResults: BatchResult[] = urls.map((u) => ({
      articleId: u,
      status: 'pending',
    }));
    setResults(initialResults);
    setBatchError(null);
    setBatchRunning(true);
    setBatchSummary(null);

    try {
      const token = localStorage.getItem('token');
      const payload: any = {
        items: urls.map((url) => ({ url })),
        model,
      };

      if (promptTemplate.trim()) {
        payload.promptTemplate = promptTemplate;
      }

      const res = await axios.post(
        'https://stingray-app-j7k4v.ondigitalocean.app/api/editor/summaries/batch',
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { results: backendResults, summary } = res.data;

      const updated: BatchResult[] = backendResults.map((r: any) => ({
        articleId: r.articleId,
        status: r.status as BatchResult['status'],
        errorMsg: r.errorMsg,
        modelUsed: r.modelUsed,
        estimatedCost: r.estimatedCost,
        language: r.language,
        wasTruncated: r.wasTruncated,
      }));

      setResults(updated);
      setBatchSummary(summary);
    } catch (err: any) {
      console.error('Batch error', err);
      setBatchError(err.response?.data?.error || 'Batch summarization failed.');
    } finally {
      setBatchRunning(false);
    }
  }, [articleListText, model, promptTemplate]);

  // Retry a single URL
  const handleRetry = async (articleId: string) => {
    if (!model) {
      setBatchError('Please select a model first.');
      return;
    }

    setBatchError(null);
    setResults((prev) =>
      prev.map((r) =>
        r.articleId === articleId ? { ...r, status: 'pending', errorMsg: undefined } : r
      )
    );

    try {
      const token = localStorage.getItem('token');
      const payload: any = {
        items: [{ url: articleId }],
        model,
      };

      const res = await axios.post(
        'https://stingray-app-j7k4v.ondigitalocean.app/api/editor/summaries/batch',
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { results: backRes } = res.data;

      setResults((prev) =>
        prev.map((r) => {
          if (r.articleId === articleId) {
            const br = backRes.find((x: any) => x.articleId === articleId);
            return {
              articleId,
              status: br?.status || 'error',
              errorMsg: br?.errorMsg,
              modelUsed: br?.modelUsed,
              estimatedCost: br?.estimatedCost,
              language: br?.language,
              wasTruncated: br?.wasTruncated,
            };
          }
          return r;
        })
      );
    } catch (err: any) {
      console.error('Retry error', err);
      setBatchError(err.response?.data?.error || 'Retry failed.');
      setResults((prev) =>
        prev.map((r) =>
          r.articleId === articleId
            ? { articleId, status: 'error', errorMsg: err.message || 'Retry error' }
            : r
        )
      );
    }
  };

  // Pagination handlers
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // Slice for current page
  const pagedResults = results.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Compute progress percentage
  const progressPercent = useMemo(() => {
    if (!results.length) return 0;
    const doneCount = results.filter((r) => r.status !== 'pending').length;
    return Math.round((doneCount / results.length) * 100);
  }, [results]);

  // Safe number formatting with null checks
  const formatNumber = (num: number | undefined | null): string => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return num.toLocaleString();
  };

  const formatCost = (cost: number | undefined | null): string => {
    if (cost === null || cost === undefined || isNaN(cost)) return '0.0000';
    return cost.toFixed(4);
  };

  return (
    <DashboardContent>
      {/** Header **/}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Batch Summarization
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Main Configuration Card */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 2, boxShadow: 3, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Configuration
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="URLs (one per line)"
                multiline
                minRows={6}
                fullWidth
                placeholder="e.g.&#10;https://example.com/article-123&#10;https://example.com/article-456"
                value={articleListText}
                onChange={(e) => setArticleListText(e.target.value)}
                disabled={batchRunning}
              />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControl size="small" sx={{ width: 200 }} disabled={batchRunning || modelsLoading}>
                  <InputLabel id="model-select-label">Model</InputLabel>
                  <Select
                    labelId="model-select-label"
                    value={model}
                    label="Model"
                    onChange={(e) => setModel(e.target.value)}
                    startAdornment={
                      <InputAdornment position="start">
                        <Iconify icon="mdi:robot-outline" width={18} height={18} />
                      </InputAdornment>
                    }
                  >
                    {availableModels.map((m) => (
                      <MenuItem key={m.name} value={m.name}>
                        {m.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <TextField
                label="Prompt Template (optional)"
                size="small"
                fullWidth
                placeholder="E.g. Summarize the following article: {{ARTICLE}}"
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                disabled={batchRunning}
              />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  component="label"
                  disabled={batchRunning}
                  startIcon={<Iconify icon="mdi:file-upload-outline" width={20} height={20} />}
                >
                  Upload CSV
                  <input
                    type="file"
                    accept=".csv"
                    hidden
                    onChange={handleCsvUpload}
                  />
                </Button>

                <Button
                  variant="outlined"
                  onClick={handleEstimateCost}
                  disabled={batchRunning || estimatingCost || !parseUrls().length || !model}
                  startIcon={
                    estimatingCost ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <Iconify icon="mdi:calculator" width={20} height={20} />
                    )
                  }
                >
                  {estimatingCost ? 'Estimating...' : 'Estimate Cost'}
                </Button>

                <Button
                  variant="contained"
                  onClick={handleRunBatch}
                  disabled={batchRunning || !parseUrls().length || !model}
                  startIcon={
                    batchRunning ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <Iconify icon="mdi:play-circle-outline" width={20} height={20} />
                    )
                  }
                >
                  {batchRunning ? 'Processing...' : 'Run Batch'}
                </Button>
              </Box>

              {batchError && (
                <Alert severity="error">
                  <AlertTitle>Error</AlertTitle>
                  {batchError}
                </Alert>
              )}

              {costEstimate && (
                <Alert severity="info">
                  <AlertTitle>Cost Estimate</AlertTitle>
                  <Typography variant="body2">
                    Sample URL: {costEstimate.title} ({costEstimate.language})
                    <br />
                    Text length: {formatNumber(costEstimate.textLength)} characters
                    <br />
                    <strong>Total URLs: {costEstimate.totalUrls}</strong>
                    <br />
                    <strong>Estimated total cost: ${formatCost(costEstimate.estimatedTotalCost)}</strong>
                  </Typography>
                </Alert>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Sidebar with Model Info */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 2, boxShadow: 3, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Available Models
            </Typography>
            
            {modelsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {availableModels.map((modelInfo) => (
                  <Paper
                    key={modelInfo.name}
                    sx={{
                      p: 2,
                      border: model === modelInfo.name ? 2 : 1,
                      borderColor: model === modelInfo.name ? 'primary.main' : 'divider',
                      cursor: 'pointer',
                    }}
                    onClick={() => setModel(modelInfo.name)}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      {modelInfo.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Prompt: ${(modelInfo.costPer1MPromptTokens || 0).toFixed(2)}/M tokens
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Response: ${(modelInfo.costPer1MResponseTokens || 0).toFixed(2)}/M tokens
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}

            {batchSummary && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Batch Summary
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total Processed:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {batchSummary.totalProcessed || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Successful:</Typography>
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                      {batchSummary.successful || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Failed:</Typography>
                    <Typography variant="body2" color="error.main" fontWeight="bold">
                      {batchSummary.failed || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total Cost:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ${formatCost(batchSummary.totalEstimatedCost)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Avg Cost/Article:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ${formatCost(batchSummary.averageCostPerArticle)}
                    </Typography>
                  </Box>
                </Box>

                {batchSummary.modelUsageStats && Object.keys(batchSummary.modelUsageStats).length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Models Used:
                    </Typography>
                    {Object.entries(batchSummary.modelUsageStats).map(([modelName, stats]) => (
                      <Box key={modelName} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption">{modelName}:</Typography>
                        <Typography variant="caption">
                          {stats.count} calls (${formatCost(stats.totalCost)})
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Card>
        </Grid>

        {/* Progress and Results */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ borderRadius: 2, boxShadow: 3, p: 3 }}>
            {/** Show progress bar during processing **/}
            {batchRunning && results.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Processing Progress
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Processing {results.filter((r) => r.status !== 'pending').length} of{' '}
                  {results.length} items ({progressPercent}%)
                </Typography>
                <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
            )}

            <Typography variant="h6" gutterBottom>
              Results
            </Typography>

            <Scrollbar>
              <TableContainer
                sx={{
                  borderRadius: 2,
                  overflowX: 'auto',
                }}
              >
                <Table sx={{ minWidth: 900 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>URL</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Model</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Language</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Cost</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 250 }}>
                        Error Message
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedResults.map((row) => (
                      <TableRow key={row.articleId} hover>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {row.articleId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={row.status}
                              color={
                                row.status === 'completed'
                                  ? 'success'
                                  : row.status === 'error'
                                  ? 'error'
                                  : 'default'
                              }
                              size="small"
                            />
                            {row.wasTruncated && (
                              <Tooltip title="Content was truncated due to size">
                                <Iconify icon="mdi:content-cut" width={16} height={16} color="warning.main" />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {row.modelUsed || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {row.language || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            ${formatCost(row.estimatedCost)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color="error.main"
                            noWrap
                            sx={{ maxWidth: 200 }}
                          >
                            {row.errorMsg || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {row.status === 'error' && (
                            <IconButton
                              color="primary"
                              onClick={() => handleRetry(row.articleId)}
                              disabled={batchRunning}
                            >
                              <Iconify icon="mdi:refresh" width={20} height={20} />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}

                    {results.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No batch results yet. Enter URLs above and click "Run Batch."
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>
            
            {results.length > 0 && (
              <TablePagination
                component="div"
                count={results.length}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={handleChangePage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{ mt: 2 }}
              />
            )}
          </Card>
        </Grid>
      </Grid>
    </DashboardContent>
  );
};

export default BatchSummaryView;