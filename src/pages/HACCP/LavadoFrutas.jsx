import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Grid,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { haccpService } from '../../services/api';
import { exportarLavadoFrutas } from '../../utils/exportExcel';
import { format } from 'date-fns';

const LavadoFrutas = () => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());

  const cargarRegistros = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await haccpService.getLavadoFrutas(mes, anio);
      setRegistros(data);
    } catch (err) {
      setError('Error al cargar registros de lavado de frutas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRegistros();
  }, [mes, anio]);

  const handleExportar = () => {
    if (registros.length === 0) {
      setError('No hay registros para exportar');
      return;
    }
    exportarLavadoFrutas(registros, mes, anio);
  };

  const getConformidadColor = (conformidad) => {
    return conformidad === 'C' ? 'success' : 'error';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Lavado y Desinfección de Frutas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Registro de procedimientos de lavado y desinfección de frutas y verduras
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExportar}
          disabled={registros.length === 0}
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
              onClick={cargarRegistros}
              disabled={loading}
            >
              Buscar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>Fecha</strong></TableCell>
              <TableCell><strong>Hora</strong></TableCell>
              <TableCell><strong>Fruta/Verdura</strong></TableCell>
              <TableCell><strong>Producto Químico</strong></TableCell>
              <TableCell><strong>Concentración</strong></TableCell>
              <TableCell align="center"><strong>Lavado Agua Potable</strong></TableCell>
              <TableCell align="center"><strong>Desinfección</strong></TableCell>
              <TableCell align="center"><strong>Concentración Correcta</strong></TableCell>
              <TableCell align="center"><strong>Tiempo (min)</strong></TableCell>
              <TableCell><strong>Acciones Correctivas</strong></TableCell>
              <TableCell><strong>Supervisor</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : registros.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">
                    No hay registros para el período seleccionado
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              registros.map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell>{format(new Date(row.fecha), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{row.hora}</TableCell>
                  <TableCell>{row.nombre_fruta_verdura}</TableCell>
                  <TableCell>{row.producto_quimico}</TableCell>
                  <TableCell>{row.concentracion_producto}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={row.lavado_agua_potable === 'C' ? 'Conforme' : 'No Conforme'}
                      color={getConformidadColor(row.lavado_agua_potable)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={row.desinfeccion_producto_quimico === 'C' ? 'Conforme' : 'No Conforme'}
                      color={getConformidadColor(row.desinfeccion_producto_quimico)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={row.concentracion_correcta === 'C' ? 'Conforme' : 'No Conforme'}
                      color={getConformidadColor(row.concentracion_correcta)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">{row.tiempo_desinfeccion_minutos} min</TableCell>
                  <TableCell>{row.acciones_correctivas || '-'}</TableCell>
                  <TableCell>{row.supervisor_nombre}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default LavadoFrutas;
