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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { haccpService } from '../../services/api';
import { exportarRecepcionMercaderia } from '../../utils/exportExcel';
import { format } from 'date-fns';

const RecepcionMercaderia = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [tipo, setTipo] = useState('FRUTAS_VERDURAS');

  useEffect(() => {
    loadData();
  }, [mes, anio, tipo]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await haccpService.getRecepcionMercaderia(mes, anio, tipo);
      
      if (response.success) {
        setData(response.data || []);
      } else {
        setError(response.error || 'Error cargando datos');
      }
    } catch (err) {
      setError('Error de conexión al servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportar = () => {
    exportarRecepcionMercaderia(data, mes, anio, tipo);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Recepción de Mercadería
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
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={tipo}
                label="Tipo"
                onChange={(e) => setTipo(e.target.value)}
              >
                <MenuItem value="FRUTAS_VERDURAS">Frutas/Verduras</MenuItem>
                <MenuItem value="ABARROTES">Abarrotes</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Mes"
              type="number"
              fullWidth
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              inputProps={{ min: 1, max: 12 }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Año"
              type="number"
              fullWidth
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button variant="contained" fullWidth onClick={loadData}>
              Buscar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Proveedor</strong></TableCell>
                <TableCell><strong>Producto</strong></TableCell>
                <TableCell><strong>Cantidad</strong></TableCell>
                <TableCell><strong>Conformidad</strong></TableCell>
                <TableCell><strong>Rechazado</strong></TableCell>
                <TableCell><strong>Responsable</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" py={3}>
                      No hay registros
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{format(new Date(row.fecha), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{row.nombre_proveedor}</TableCell>
                    <TableCell>{row.nombre_producto}</TableCell>
                    <TableCell>{row.peso_unidad_recibido} {row.unidad_medida}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.estado_producto || row.conformidad_empaque_primario || 'N/A'}
                        size="small"
                        color={row.estado_producto === 'EXCELENTE' ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.producto_rechazado ? 'SÍ' : 'NO'}
                        size="small"
                        color={row.producto_rechazado ? 'error' : 'success'}
                      />
                    </TableCell>
                    <TableCell>{row.responsable_registro_nombre}</TableCell>
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

export default RecepcionMercaderia;
