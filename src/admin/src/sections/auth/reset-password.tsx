// src/views/ResetPassword.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!newPassword || !confirmPassword) {
      setError('Both fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('https://stingray-app-j7k4v.ondigitalocean.app/api/auth/reset-password', {
        token,
        password: newPassword,
      });
      setSuccessMsg('Your password has been reset. Redirecting to login…');
      setTimeout(() => {
        navigate('/sign-in');
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          'Unable to reset password. The link may have expired.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 400,
        mx: 'auto',
        mt: 8,
      }}
    >
      <Card sx={{ p: 4 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Reset Password
        </Typography>
        <Typography variant="body2" align="center" color="textSecondary" gutterBottom>
          Enter a new password to complete the reset.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="New Password"
            type="password"
            required
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={submitting}
          />
          <TextField
            label="Confirm New Password"
            type="password"
            required
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={submitting}
          />

          {submitting ? (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Button
              type="submit"
              variant="contained"
              startIcon={<Iconify icon={"mingcute:refresh-line" as any} width={20} height={20} />}
              disabled={!newPassword || !confirmPassword}
            >
              Reset Password
            </Button>
          )}

          {error && (
            <Typography variant="body2" color="error" align="center">
              {error}
            </Typography>
          )}
          {successMsg && (
            <Typography variant="body2" color="primary" align="center">
              {successMsg}
            </Typography>
          )}
        </Box>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button size="small" onClick={() => navigate('/signin')}>
            Back to Sign In
          </Button>
        </Box>
      </Card>
    </Box>
  );
};

export default ResetPassword;
