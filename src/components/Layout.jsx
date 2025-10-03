import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccessTime as AccessTimeIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  AccountCircle,
  Logout,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import Collapse from '@mui/material/Collapse';

const drawerWidth = 280;

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [haccpOpen, setHaccpOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Asistencias', icon: <AccessTimeIcon />, path: '/asistencias' },
  ];

  const haccpItems = [
    { text: 'Recepción Mercadería', path: '/haccp/recepcion-mercaderia' },
    { text: 'Control Cocción', path: '/haccp/control-coccion' },
    { text: 'Lavado Frutas', path: '/haccp/lavado-frutas' },
    { text: 'Lavado Manos', path: '/haccp/lavado-manos' },
    { text: 'Temperatura Cámaras', path: '/haccp/temperatura-camaras' },
  ];

  const bottomMenuItems = [
    { text: 'Usuarios', icon: <PeopleIcon />, path: '/usuarios' },
    { text: 'Reportes', icon: <AssessmentIcon />, path: '/reportes' },
    { text: 'Auditoría', icon: <HistoryIcon />, path: '/auditoria' },
  ];

  const drawer = (
    <div>
      <Toolbar sx={{ bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" noWrap component="div">
          Sistema HACCP
        </Typography>
      </Toolbar>
      <Divider />
      
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}

        {/* HACCP Collapsible Menu */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setHaccpOpen(!haccpOpen)}>
            <ListItemIcon>
              <AssignmentIcon />
            </ListItemIcon>
            <ListItemText primary="HACCP" />
            {haccpOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={haccpOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {haccpItems.map((item) => (
              <ListItemButton
                key={item.text}
                sx={{ pl: 4 }}
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItemButton>
            ))}
          </List>
        </Collapse>
      </List>

      <Divider />

      <List>
        {bottomMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Panel Administrativo
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              {user?.nombre} ({user?.rol})
            </Typography>
            <IconButton
              onClick={handleMenuClick}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={anchorEl ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={anchorEl ? 'true' : undefined}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user?.nombre?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              id="account-menu"
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem disabled>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                {user?.email}
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Cerrar Sesión
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
