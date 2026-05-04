import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Login() {
  const [correo,   setCorrce]   = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const { login } = useApp();
  const navigate  = useNavigate();

  const RUTAS = { admin: '/admin', secretaria: '/secretaria', tecnico: '/tecnico' };

  const handleLogin = () => {
    if (!correo || !password) { setError('Ingresa tu correo y contraseña.'); return; }
    const usuario = login(correo, password);
    if (!usuario) { setError('Correo o contraseña incorrectos.'); setPassword(''); return; }
    navigate(RUTAS[usuario.rol] || '/');
  };

  const llenar = (c, p) => { setCorrce(c); setPassword(p); setError(''); };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-header">
          <div className="logo">❄️</div>
          <h1>Refrimora</h1>
          <p>Sistema de Gestión de Servicios</p>
        </div>

        <div className="auth-body">
          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email" value={correo}
              onChange={e => setCorrce(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="correo@refrimora.com"
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
            />
          </div>

          <button className="btn btn-primary btn-full" onClick={handleLogin} style={{ padding: 10, marginTop: 6 }}>
            Iniciar Sesión
          </button>

          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <a href="/" style={{ color: '#1a5fa8', fontSize: 13, textDecoration: 'none' }}>← Volver al inicio</a>
          </div>

          <div className="creds-box">
            <p>Credenciales de prueba (haz clic para llenar)</p>
            <div className="cred-row" onClick={() => llenar('admin@refrimora.com', 'admin123')}>
              <span>👑 Administrador</span><small>admin@refrimora.com</small>
            </div>
            <div className="cred-row" onClick={() => llenar('secretaria@refrimora.com', 'secre123')}>
              <span>🗂️ Secretaria</span><small>secretaria@refrimora.com</small>
            </div>
            <div className="cred-row" onClick={() => llenar('pedro@refrimora.com', 'tec123')}>
              <span>🔧 Técnico Pedro</span><small>pedro@refrimora.com</small>
            </div>
            <div className="cred-row" onClick={() => llenar('juan@refrimora.com', 'tec456')}>
              <span>🔧 Técnico Juan</span><small>juan@refrimora.com</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
