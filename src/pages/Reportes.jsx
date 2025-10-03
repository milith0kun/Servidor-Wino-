import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Download as DownloadIcon, Assessment as AssessmentIcon } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { reportesService } from '../services/api';
import { exportarResumenNC } from '../utils/exportExcel';

const Reportes = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [noConformidades, setNoConformidades] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [ncData, provData] = await Promise.all([
        reportesService.getNoConformidades(mes, anio),
        reportesService.getProveedoresNC(mes, anio)
      ]);
      
      setNoConformidades(ncData);
      setProveedores(provData);
    } catch (err) {
      setError('Error al cargar reportes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReportes();
  }, [mes, anio]);

  const handleExportar = () => {
    if (noConformidades.length === 0) {
      setError('No hay datos para exportar');
      return;
    }
    exportarResumenNC(noConformidades, mes, anio);
  };

  const formatTipoControl = (tipo) => {
    const tipos = {
      'RECEPCION': 'Recepción Mercadería',
      'COCCION': 'Control de Cocción',
      'LAVADO_FRUTAS': 'Lavado Frutas',
      'LAVADO_MANOS': 'Lavado de Manos',
      'TEMPERATURA': 'Temperatura Cámaras'
    };
    return tipos[tipo] || tipo;
  };

  const chartData = noConformidades.map(item => ({
    name: formatTipoControl(item.tipo_control).replace('Control de ', ''),
    'No Conformidades': item.no_conformidades,
    'Total Registros': item.total_registros,
  }));

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Reportes y Estadísticas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Análisis de no conformidades y estadísticas del sistema HACCP
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExportar}
          disabled={noConformidades.length === 0}
        >
          Exportar Excel
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              label="Mes"
              type="number"
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              fullWidth
              InputProps={{ inputProps: { min: 1, max: 12 } }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Año"
              type="number"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              fullWidth
              InputProps={{ inputProps: { min: 2020, max: 2030 } }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              fullWidth
              onClick={cargarReportes}
              disabled={loading}
              startIcon={<AssessmentIcon />}
            >
              Generar Reporte
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Gráfico de No Conformidades */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              No Conformidades por Tipo de Control
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="No Conformidades" fill="#f44336" name="No Conformidades" />
                <Bar dataKey="Total Registros" fill="#2196f3" name="Total Registros" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          {/* Tabla Resumen de No Conformidades */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Resumen de No Conformidades
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell><strong>Tipo de Control</strong></TableCell>
                    <TableCell align="center"><strong>Total Registros</strong></TableCell>
                    <TableCell align="center"><strong>No Conformidades</strong></TableCell>
                    <TableCell align="center"><strong>% NC</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {noConformidades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                        <Typography color="text.secondary">
                          No hay datos para el período seleccionado
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    noConformidades.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{formatTipoControl(row.tipo_control)}</TableCell>
                        <TableCell align="center">{row.total_registros}</TableCell>
                        <TableCell align="center">
                          <Typography 
                            color={row.no_conformidades > 0 ? 'error' : 'success'}
                            fontWeight="bold"
                          >
                            {row.no_conformidades}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography 
                            color={row.porcentaje_nc > 10 ? 'error' : 'text.secondary'}
                            fontWeight={row.porcentaje_nc > 10 ? 'bold' : 'normal'}
                          >
                            {row.porcentaje_nc.toFixed(2)}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Tabla de Proveedores con Más NC */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Proveedores con Más No Conformidades
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell><strong>Proveedor</strong></TableCell>
                    <TableCell align="center"><strong>Total Entregas</strong></TableCell>
                    <TableCell align="center"><strong>Productos Rechazados</strong></TableCell>
                    <TableCell align="center"><strong>% Rechazo</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {proveedores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                        <Typography color="text.secondary">
                          No hay datos de proveedores para el período seleccionado
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    proveedores.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{row.proveedor_nombre}</TableCell>
                        <TableCell align="center">{row.total_entregas}</TableCell>
                        <TableCell align="center">
                          <Typography 
                            color={row.total_rechazos > 0 ? 'error' : 'success'}
                            fontWeight="bold"
                          >
                            {row.total_rechazos}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography 
                            color={row.porcentaje_rechazo > 10 ? 'error' : 'text.secondary'}
                            fontWeight={row.porcentaje_rechazo > 10 ? 'bold' : 'normal'}
                          >
                            {row.porcentaje_rechazo.toFixed(2)}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default Reportes;
