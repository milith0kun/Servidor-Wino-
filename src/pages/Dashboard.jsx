import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { dashboardService } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const StatCard = ({ title, value, icon, color }) => (
  <Card elevation={2}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: color,
            borderRadius: '50%',
            width: 60,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getAdmin();
      
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.error || 'Error cargando dashboard');
      }
    } catch (err) {
      setError('Error de conexión al servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Resumen general del sistema
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Empleados Presentes Hoy"
            value={data?.asistencia_hoy?.presentes || 0}
            icon={<PeopleIcon sx={{ fontSize: 30 }} />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Controles HACCP Hoy"
            value={data?.controles_hoy || 0}
            icon={<AssignmentIcon sx={{ fontSize: 30 }} />}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="No Conformidades Mes"
            value={data?.no_conformidades_mes || 0}
            icon={<WarningIcon sx={{ fontSize: 30 }} />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Productos Rechazados"
            value={data?.productos_rechazados_semana || 0}
            icon={<CheckCircleIcon sx={{ fontSize: 30 }} />}
            color="#f44336"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              No Conformidades por Tipo
            </Typography>
            {data?.no_conformidades_por_tipo && data.no_conformidades_por_tipo.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.no_conformidades_por_tipo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tipo" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#2196f3" name="Total" />
                  <Bar dataKey="nc" fill="#f44336" name="No Conformes" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary" align="center" py={5}>
                No hay datos disponibles
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Asistencias del Mes
            </Typography>
            {data?.asistencias_mes && data.asistencias_mes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.asistencias_mes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#4caf50" name="Asistencias" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary" align="center" py={5}>
                No hay datos disponibles
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Productos Rechazados Esta Semana
            </Typography>
            {data?.productos_rechazados_detalle && data.productos_rechazados_detalle.length > 0 ? (
              <Box>
                {data.productos_rechazados_detalle.map((item, index) => (
                  <Box key={index} py={1} borderBottom="1px solid #eee">
                    <Typography variant="body1" fontWeight="bold">
                      {item.nombre_producto}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Proveedor: {item.nombre_proveedor} | Fecha: {item.fecha} | Motivo: {item.observaciones || 'Sin especificar'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary" align="center" py={3}>
                No hay productos rechazados esta semana
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
