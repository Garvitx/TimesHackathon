// src/views/ForgotPassword.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSending(true);

    try {
      // Call backend; backend always returns 200 with generic message
      const res = await axios.post('https://stingray-app-j7k4v.ondigitalocean.app/api/auth/forgot-password', {
        email,
      });
      setMessage(res.data.message);
    } catch (err: any) {
      console.error(err);
      setError('Something went wrong. Please try again later.');
    } finally {
      setSending(false);
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
          Forgot Password
        </Typography>
        <Typography variant="body2" align="center" color="textSecondary" gutterBottom>
          Enter your email to reset your password.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Email"
            type="email"
            required
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sending}
          />

          {sending ? (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Button
              type="submit"
              variant="contained"
              startIcon={<Iconify icon="mingcute:send-plane-line" width={20} height={20} />}
              disabled={!email}
            >
              Send Reset Link
            </Button>
          )}

          {message && (
            <Typography variant="body2" color="primary" align="center">
              {message}
            </Typography>
          )}

          {error && (
            <Typography variant="body2" color="error" align="center">
              {error}
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

export default ForgotPassword;
