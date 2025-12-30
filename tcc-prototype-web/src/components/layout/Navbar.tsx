import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuthSession } from '../../lib/supabase/hooks';
import supabase from '../../lib/supabase/client';

const navLinks = [
  { to: '/pomodoro', label: 'Pomodoro' },
  { to: '/shop', label: 'Loja' },
  { to: '/inventory', label: 'Inventário' },
  { to: '/history', label: 'Histórico' },
  { to: '/about', label: 'Sobre' },
];

const Navbar: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const session = useAuthSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="default"
      sx={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
    >
      <Toolbar sx={{ maxWidth: '1120px', mx: 'auto', width: '100%' }}>
        <Typography
          component={RouterLink}
          to="/"
          variant="h6"
          sx={{ textDecoration: 'none', color: 'text.primary', fontWeight: 700 }}
        >
          tcc-prototype
        </Typography>

        <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center', gap: 4 }}>
          {navLinks.map((link) => (
            <Button
              key={link.to}
              component={RouterLink}
              to={link.to}
              color="inherit"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {link.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            <ThemeToggle />
          </Box>

          {session ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ display: { xs: 'none', lg: 'block' } }}>
                {session.user.email}
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleLogout}
                sx={{ borderRadius: '999px', px: 3, textTransform: 'none' }}
              >
                Sair
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                color="primary"
                sx={{ borderRadius: '999px', px: 3, textTransform: 'none' }}
              >
                Entrar
              </Button>
              <Button
                component={RouterLink}
                to="/register"
                variant="contained"
                color="primary"
                sx={{ borderRadius: '999px', px: 3, textTransform: 'none' }}
              >
                Registrar
              </Button>
            </Box>
          )}

          <IconButton
            edge="end"
            color="inherit"
            aria-label="menu"
            onClick={() => setDrawerOpen(true)}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 260 }} role="presentation" onClick={() => setDrawerOpen(false)}>
          <List>
            {navLinks.map((link) => (
              <ListItem key={link.to} disablePadding>
                <ListItemButton component={RouterLink} to={link.to}>
                  <ListItemText primary={link.label} />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem>
              {session ? (
                <Button variant="outlined" color="primary" fullWidth onClick={handleLogout}>
                  Sair ({session.user.email})
                </Button>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                  <Button component={RouterLink} to="/login" variant="outlined" color="primary" fullWidth>
                    Entrar
                  </Button>
                  <Button component={RouterLink} to="/register" variant="contained" color="primary" fullWidth>
                    Registrar
                  </Button>
                </Box>
              )}
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
