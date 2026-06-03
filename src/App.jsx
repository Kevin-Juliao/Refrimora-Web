import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import ThemeToggle from './components/layout/ThemeToggle';

import Landing from './pages/Landing';
import Login from './pages/Login';
import RegistroCliente from './pages/RegistroCliente';
import AdminDashboard from './pages/admin/AdminDashboard';
import SecretariaDashboard from './pages/secretaria/SecretariaDashboard';
import TecnicoDashboard from './pages/tecnico/TecnicoDashboard';
import ClienteDashboard from './pages/cliente/ClienteDashboard';

function normalizarRol(valor) {
  const v = String(valor || '').trim().toLowerCase();

  if (v === 'administrador' || v === 'admin') return 'admin';
  if (v === 'secretaria' || v === 'secretaría') return 'secretaria';
  if (v === 'tecnico' || v === 'técnico') return 'tecnico';
  if (v === 'cliente') return 'cliente';

  return v;
}

function RutaPrivada({ children, rolesPermitidos }) {
  const { usuario, cliente } = useApp();

  const requiereCliente = rolesPermitidos.includes('cliente');

  if (requiereCliente) {
    if (!cliente) {
      return <Navigate to="/login" replace />;
    }

    return children;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  const rol = normalizarRol(usuario.rol);

  if (!rolesPermitidos.includes(rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function RedireccionPorRol() {
  const { usuario, cliente } = useApp();

  if (cliente) return <Navigate to="/cliente" replace />;

  if (!usuario) return <Navigate to="/login" replace />;

  const rol = normalizarRol(usuario.rol);

  if (rol === 'admin') return <Navigate to="/admin" replace />;
  if (rol === 'secretaria') return <Navigate to="/secretaria" replace />;
  if (rol === 'tecnico') return <Navigate to="/tecnico" replace />;
  if (rol === 'cliente') return <Navigate to="/cliente" replace />;

  return <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<RegistroCliente />} />

      <Route
        path="/admin"
        element={
          <RutaPrivada rolesPermitidos={['admin']}>
            <AdminDashboard />
          </RutaPrivada>
        }
      />

      <Route
        path="/secretaria"
        element={
          <RutaPrivada rolesPermitidos={['secretaria']}>
            <SecretariaDashboard />
          </RutaPrivada>
        }
      />

      <Route
        path="/tecnico"
        element={
          <RutaPrivada rolesPermitidos={['tecnico']}>
            <TecnicoDashboard />
          </RutaPrivada>
        }
      />

      <Route
        path="/cliente"
        element={
          <RutaPrivada rolesPermitidos={['cliente']}>
            <ClienteDashboard />
          </RutaPrivada>
        }
      />

      <Route path="/redirigir" element={<RedireccionPorRol />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <ThemeToggle />
      </BrowserRouter>
    </AppProvider>
  );
}