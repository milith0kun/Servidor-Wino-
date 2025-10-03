import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Asistencias from './pages/Asistencias';
import Usuarios from './pages/Usuarios';
import Reportes from './pages/Reportes';
import Auditoria from './pages/Auditoria';

// HACCP Pages
import RecepcionMercaderia from './pages/HACCP/RecepcionMercaderia';
import ControlCoccion from './pages/HACCP/ControlCoccion';
import LavadoFrutas from './pages/HACCP/LavadoFrutas';
import LavadoManos from './pages/HACCP/LavadoManos';
import TemperaturaCamaras from './pages/HACCP/TemperaturaCamaras';

import Layout from './components/Layout';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="asistencias" element={<Asistencias />} />
              <Route path="usuarios" element={<Usuarios />} />
              <Route path="reportes" element={<Reportes />} />
              <Route path="auditoria" element={<Auditoria />} />
              
              {/* HACCP Routes */}
              <Route path="haccp/recepcion-mercaderia" element={<RecepcionMercaderia />} />
              <Route path="haccp/control-coccion" element={<ControlCoccion />} />
              <Route path="haccp/lavado-frutas" element={<LavadoFrutas />} />
              <Route path="haccp/lavado-manos" element={<LavadoManos />} />
              <Route path="haccp/temperatura-camaras" element={<TemperaturaCamaras />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
