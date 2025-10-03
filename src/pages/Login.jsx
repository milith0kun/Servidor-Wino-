import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
        },
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={24} 
          sx={{ 
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              bgcolor: 'primary.main',
              background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
              py: 4,
              textAlign: 'center',
            }}
          >
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom 
              fontWeight="700"
              sx={{ color: 'white' }}
            >
              Sistema HACCP
            </Typography>
            <Typography 
              variant="subtitle1" 
              sx={{ color: 'rgba(255,255,255,0.9)' }}
            >
              Panel de Control Administrativo
            </Typography>
          </Box>

          <Card elevation={0}>
            <CardContent sx={{ p: 4 }}>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  label="Correo Electrónico"
                  type="email"
                  fullWidth
                  margin="normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  disabled={loading}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                  }}
                />
                
                <TextField
                  label="Contraseña"
                  type="password"
                  fullWidth
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{ 
                    mt: 3, 
                    mb: 2,
                    py: 1.5,
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #162d5a 0%, #1f3d73 100%)',
                      transform: 'translateY(-1px)',
                      boxShadow: 4,
                    },
                    transition: 'all 0.3s ease',
                  }}
                  disabled={loading}
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </form>

              <Box textAlign="center" mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Credenciales de prueba: admin@hotel.com / admin123
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
