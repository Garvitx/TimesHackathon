import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';
import { useAuth } from 'src/context/AuthContext';
import { Iconify } from 'src/components/iconify';

export function SignInView() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignIn = useCallback(async () => {
    try {
      setError(null);
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sign in. Please try again.');
    }
  }, [formData, login, navigate]);

  const renderForm = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        flexDirection: 'column',
      }}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
          {error}
        </Alert>
      )}
      <TextField
        fullWidth
        name="email"
        label="Email address"
        value={formData.email}
        onChange={handleChange}
        sx={{ mb: 3 }}
        slotProps={{
          inputLabel: { shrink: true },
        }}
      />
      <Link variant="body2" color="inherit" sx={{ mb: 1.5 }}>
        Forgot password?
      </Link>
      <TextField
        fullWidth
        name="password"
        label="Password"
        value={formData.password}
        type={showPassword ? 'text' : 'password'}
        onChange={handleChange}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 3 }}
      />
      <Button
        fullWidth
        size="large"
        color="primary"
        variant="contained"
        onClick={handleSignIn}
        disabled={!formData.email || !formData.password}
      >
        Sign in
      </Button>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 5 }}>
        <Typography variant="h5">Sign in</Typography>
      </Box>
      {renderForm}
    </Box>
  );
}