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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { usuariosService } from '../services/api';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados del diálogo
  const [openDialog, setOpenDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    rol: 'EMPLEADO',
    cargo: '',
    area: '',
  });
  
  const [newPassword, setNewPassword] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await usuariosService.getAll();
      
      if (response.success) {
        setUsuarios(response.data || []);
      } else {
        setError(response.error || 'Error cargando usuarios');
      }
    } catch (err) {
      setError('Error de conexión al servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        password: '',
        rol: user.rol,
        cargo: user.cargo || '',
        area: user.area || '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        rol: 'EMPLEADO',
        cargo: '',
        area: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      rol: 'EMPLEADO',
      cargo: '',
      area: '',
    });
  };

  const handleSaveUser = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const userData = { ...formData };
      
      // Si estamos editando y no se cambió la contraseña, no la enviamos
      if (editingUser && !userData.password) {
        delete userData.password;
      }

      const response = editingUser
        ? await usuariosService.update(editingUser.id, userData)
        : await usuariosService.create(userData);
      
      if (response.success) {
        setSuccess(editingUser ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
        handleCloseDialog();
        loadUsuarios();
      } else {
        setError(response.error || 'Error guardando usuario');
      }
    } catch (err) {
      setError('Error de conexión al servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Está seguro de eliminar este usuario?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await usuariosService.delete(userId);
      
      if (response.success) {
        setSuccess('Usuario eliminado correctamente');
        loadUsuarios();
      } else {
        setError(response.error || 'Error eliminando usuario');
      }
    } catch (err) {
      setError('Error de conexión al servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPasswordDialog = (userId) => {
    setSelectedUserId(userId);
    setNewPassword('');
    setOpenPasswordDialog(true);
  };

  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false);
    setSelectedUserId(null);
    setNewPassword('');
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await usuariosService.changePassword(selectedUserId, newPassword);
      
      if (response.success) {
        setSuccess('Contraseña actualizada correctamente');
        handleClosePasswordDialog();
      } else {
        setError(response.error || 'Error cambiando contraseña');
      }
    } catch (err) {
      setError('Error de conexión al servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRolColor = (rol) => {
    switch (rol) {
      case 'ADMIN':
        return 'error';
      case 'SUPERVISOR':
        return 'warning';
      case 'COCINERO':
        return 'info';
      case 'EMPLEADO':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Gestión de Usuarios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administrar usuarios del sistema
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          color="primary"
        >
          Nuevo Usuario
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {loading && !openDialog ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><strong>Nombre Completo</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Rol</strong></TableCell>
                <TableCell><strong>Cargo</strong></TableCell>
                <TableCell><strong>Área</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" py={3}>
                      No hay usuarios registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((usuario) => (
                  <TableRow key={usuario.id} hover>
                    <TableCell>
                      {usuario.nombre} {usuario.apellido}
                    </TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={usuario.rol}
                        color={getRolColor(usuario.rol)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{usuario.cargo || '-'}</TableCell>
                    <TableCell>{usuario.area || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={usuario.activo ? 'Activo' : 'Inactivo'}
                        color={usuario.activo ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(usuario)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cambiar Contraseña">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleOpenPasswordDialog(usuario.id)}
                        >
                          <LockIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteUser(usuario.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog para Crear/Editar Usuario */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre"
                fullWidth
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Apellido"
                fullWidth
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={editingUser ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
                type="password"
                fullWidth
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.rol}
                  label="Rol"
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                >
                  <MenuItem value="ADMIN">Administrador</MenuItem>
                  <MenuItem value="SUPERVISOR">Supervisor</MenuItem>
                  <MenuItem value="COCINERO">Cocinero</MenuItem>
                  <MenuItem value="EMPLEADO">Empleado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Cargo"
                fullWidth
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Área"
                fullWidth
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveUser} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : (editingUser ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Cambiar Contraseña */}
      <Dialog open={openPasswordDialog} onClose={handleClosePasswordDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Cambiar Contraseña</DialogTitle>
        <DialogContent>
          <TextField
            label="Nueva Contraseña"
            type="password"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mt: 2 }}
            helperText="Mínimo 6 caracteres"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>Cancelar</Button>
          <Button onClick={handleChangePassword} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Cambiar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Usuarios;
