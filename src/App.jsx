import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Landing           from './pages/Landing';
import Login             from './pages/Login';
import RegistroCliente   from './pages/RegistroCliente';
import AdminDashboard    from './pages/admin/AdminDashboard';
import SecretariaDashboard from './pages/secretaria/SecretariaDashboard';
import TecnicoDashboard  from './pages/tecnico/TecnicoDashboard';
import ClienteDashboard  from './pages/cliente/ClienteDashboard';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"              element={<Landing />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/registro"      element={<RegistroCliente />} />
          <Route path="/admin"         element={<AdminDashboard />} />
          <Route path="/secretaria"    element={<SecretariaDashboard />} />
          <Route path="/tecnico"       element={<TecnicoDashboard />} />
          <Route path="/cliente"       element={<ClienteDashboard />} />
          <Route path="*"              element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}