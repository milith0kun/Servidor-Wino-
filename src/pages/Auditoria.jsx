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
  TextField,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import { auditoriaService } from '../services/api';
import { format } from 'date-fns';

const Auditoria = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const cargarLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await auditoriaService.getLogs(fechaDesde, fechaHasta);
      setLogs(data);
    } catch (err) {
      setError('Error al cargar logs de auditoría');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cargar logs del último mes por defecto
    const hoy = new Date();
    const hace30dias = new Date(hoy);
    hace30dias.setDate(hoy.getDate() - 30);
    
    setFechaDesde(hace30dias.toISOString().split('T')[0]);
    setFechaHasta(hoy.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (fechaDesde && fechaHasta) {
      cargarLogs();
    }
  }, [fechaDesde, fechaHasta]);

  const getAccionColor = (accion) => {
    const colores = {
      'LOGIN': 'info',
      'LOGOUT': 'default',
      'CREATE': 'success',
      'UPDATE': 'warning',
      'DELETE': 'error',
    };
    return colores[accion] || 'default';
  };

  const handleVerDetalles = (log) => {
    setSelectedLog(log);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLog(null);
  };

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Auditoría del Sistema
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Registro completo de todas las acciones realizadas en el sistema
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField
              label="Fecha Desde"
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField
              label="Fecha Hasta"
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={cargarLogs}
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
              <TableCell><strong>Fecha y Hora</strong></TableCell>
              <TableCell><strong>Usuario</strong></TableCell>
              <TableCell align="center"><strong>Acción</strong></TableCell>
              <TableCell><strong>Tabla</strong></TableCell>
              <TableCell align="center"><strong>ID Registro</strong></TableCell>
              <TableCell><strong>IP</strong></TableCell>
              <TableCell align="center"><strong>Detalles</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">
                    No hay logs de auditoría para el período seleccionado
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    {format(new Date(log.fecha_hora), 'dd/MM/yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    {log.usuario_nombre || log.usuario_email || 'Sistema'}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={log.accion}
                      color={getAccionColor(log.accion)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{log.tabla_afectada || '-'}</TableCell>
                  <TableCell align="center">{log.registro_id || '-'}</TableCell>
                  <TableCell>{log.ip_address || '-'}</TableCell>
                  <TableCell align="center">
                    {log.datos_json && (
                      <Tooltip title="Ver detalles completos">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleVerDetalles(log)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para ver detalles del log */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalles del Log de Auditoría
        </DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Fecha y Hora:</strong>
                  </Typography>
                  <Typography variant="body1" mb={2}>
                    {format(new Date(selectedLog.fecha_hora), 'dd/MM/yyyy HH:mm:ss')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Usuario:</strong>
                  </Typography>
                  <Typography variant="body1" mb={2}>
                    {selectedLog.usuario_nombre || selectedLog.usuario_email || 'Sistema'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Acción:</strong>
                  </Typography>
                  <Typography variant="body1" mb={2}>
                    <Chip
                      label={selectedLog.accion}
                      color={getAccionColor(selectedLog.accion)}
                      size="small"
                    />
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Tabla Afectada:</strong>
                  </Typography>
                  <Typography variant="body1" mb={2}>
                    {selectedLog.tabla_afectada || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>ID Registro:</strong>
                  </Typography>
                  <Typography variant="body1" mb={2}>
                    {selectedLog.registro_id || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>IP:</strong>
                  </Typography>
                  <Typography variant="body1" mb={2}>
                    {selectedLog.ip_address || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    <strong>Datos JSON:</strong>
                  </Typography>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      bgcolor: '#f5f5f5', 
                      maxHeight: 300, 
                      overflow: 'auto' 
                    }}
                  >
                    <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                      {selectedLog.datos_json 
                        ? JSON.stringify(JSON.parse(selectedLog.datos_json), null, 2)
                        : 'Sin datos adicionales'}
                    </pre>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Auditoria;
