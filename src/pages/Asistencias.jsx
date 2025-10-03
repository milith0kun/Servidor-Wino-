import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { fichadoService } from '../services/api';
import { exportarAsistencias } from '../utils/exportExcel';
import { format } from 'date-fns';

const Asistencias = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, [mes, anio]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fichadoService.getHistorial(mes, anio);
      
      if (response.success) {
        setData(response.data || []);
      } else {
        setError(response.error || 'Error cargando asistencias');
      }
    } catch (err) {
      setError('Error de conexión al servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportar = () => {
    exportarAsistencias(data, mes, anio);
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'PUNTUAL':
        return 'success';
      case 'TARDANZA':
        return 'warning';
      case 'FALTA':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Asistencias
        </Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExportar}
          disabled={data.length === 0}
        >
          Exportar a Excel
        </Button>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              label="Mes"
              type="number"
              fullWidth
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              inputProps={{ min: 1, max: 12 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Año"
              type="number"
              fullWidth
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              inputProps={{ min: 2020, max: 2030 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button variant="contained" fullWidth onClick={loadData}>
              Buscar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Usuario</strong></TableCell>
                <TableCell><strong>Cargo</strong></TableCell>
                <TableCell><strong>Área</strong></TableCell>
                <TableCell><strong>Entrada</strong></TableCell>
                <TableCell><strong>Salida</strong></TableCell>
                <TableCell><strong>Horas</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Método</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography color="text.secondary" py={3}>
                      No hay registros para el período seleccionado
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{format(new Date(row.fecha), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{row.nombre} {row.apellido}</TableCell>
                    <TableCell>{row.cargo || '-'}</TableCell>
                    <TableCell>{row.area || '-'}</TableCell>
                    <TableCell>{row.hora_entrada || '-'}</TableCell>
                    <TableCell>{row.hora_salida || '-'}</TableCell>
                    <TableCell>{row.horas_trabajadas ? `${row.horas_trabajadas}h` : '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.estado || 'N/A'}
                        color={getEstadoColor(row.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{row.metodo_fichado || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Asistencias;
