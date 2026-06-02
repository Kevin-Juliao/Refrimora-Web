import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function normalizarRol(valor) {
  const v = String(valor || '').trim().toLowerCase();

  if (v === 'administrador' || v === 'admin') return 'admin';
  if (v === 'secretaria' || v === 'secretaría') return 'secretaria';
  if (v === 'tecnico' || v === 'técnico') return 'tecnico';
  if (v === 'cliente') return 'cliente';

  return v;
}

function obtenerRutaPorRol(rol) {
  const rolNorm = normalizarRol(rol);

  if (rolNorm === 'admin') return '/admin';
  if (rolNorm === 'secretaria') return '/secretaria';
  if (rolNorm === 'tecnico') return '/tecnico';
  if (rolNorm === 'cliente') return '/cliente';

  return '/';
}

export default function Login() {
  const [tab, setTab] = useState('empleado');

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [emailC, setEmailC] = useState('');
  const [passC, setPassC] = useState('');
  const [errorC, setErrorC] = useState('');

  const { login, loginCliente } = useApp();
  const navigate = useNavigate();

  const handleLoginEmpleado = async () => {
    setError('');

    if (!correo || !password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }

    const usuario = await login(correo, password);

    if (!usuario) {
      setError('Correo o contraseña incorrectos.');
      setPassword('');
      return;
    }

    const ruta = obtenerRutaPorRol(usuario.rol);
    navigate(ruta, { replace: true });
  };

  const llenar = (c, p) => {
    setCorreo(c);
    setPassword(p);
    setError('');
  };

  const handleLoginCliente = async () => {
    setErrorC('');

    if (!emailC || !passC) {
      setErrorC('Ingresa tu correo y contraseña.');
      return;
    }

    if (typeof loginCliente !== 'function') {
      setErrorC('El acceso de clientes aún no está configurado.');
      return;
    }

    const cliente = await loginCliente(emailC, passC);

    if (!cliente) {
      setErrorC('Correo o contraseña incorrectos.');
      setPassC('');
      return;
    }

    navigate('/cliente', { replace: true });
  };

  return (
    <div className="login-page-premium">
      <aside className="login-side-premium">
        <div>
          <div className="login-brand-mark">❄</div>
          <h1 className="login-brand-title">Refrimora</h1>
          <p className="login-brand-sub">
            Sistema de gestión para servicios de refrigeración y seguimiento técnico.
          </p>
        </div>

        <div className="login-side-panel">
          <div className="login-side-item">
            <span className="login-side-icon">🧾</span>
            <div>
              <strong>Órdenes organizadas</strong>
              <small>Administra servicios, clientes y técnicos desde un solo lugar.</small>
            </div>
          </div>

          <div className="login-side-item">
            <span className="login-side-icon">🔐</span>
            <div>
              <strong>Acceso por roles</strong>
              <small>Personal y clientes con acceso seguro a su propio portal.</small>
            </div>
          </div>

          <div className="login-side-item">
            <span className="login-side-icon">⚡</span>
            <div>
              <strong>Atención más ágil</strong>
              <small>Reduce tiempos de respuesta y mejora el seguimiento.</small>
            </div>
          </div>
        </div>

        <div className="login-side-foot">© 2026 Refrimora · La loma, Cesar</div>
      </aside>

      <main className="login-main-premium">
        <div className="login-card-premium">
          <div className="login-header-premium">
            <div className="login-header-icon">❄</div>
            <h2>Bienvenido</h2>
            <p>Ingresa a tu cuenta para continuar</p>
          </div>

          <div className="login-tabs-premium">
            {[
              { key: 'empleado', label: '🏢 Personal' },
              { key: 'cliente', label: '👤 Cliente' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                className={`login-tab-btn ${tab === t.key ? 'active' : ''}`}
                onClick={() => {
                  setTab(t.key);
                  setError('');
                  setErrorC('');
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="login-body-premium">
            {tab === 'empleado' && (
              <>
                {error && <div className="login-alert-premium">⚠️ {error}</div>}

                <div className="login-field-premium">
                  <label>Correo electrónico</label>
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLoginEmpleado()}
                    placeholder="correo@refrimora.com"
                  />
                </div>

                <div className="login-field-premium">
                  <label>Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLoginEmpleado()}
                    placeholder="••••••••"
                  />
                </div>

                <button className="login-btn-premium" type="button" onClick={handleLoginEmpleado}>
                  Iniciar sesión
                </button>

                <div className="login-cred-box-premium">
                  <p>Credenciales de prueba</p>

                  <div
                    className="login-cred-row-premium"
                    onClick={() => llenar('kevinJ@refrimora.com', '123456')}
                  >
                    <div>
                      <strong>👑 Administrador</strong>
                      <small>Acceso total al sistema</small>
                    </div>
                    <span>admin@refrimora.com</span>
                  </div>

                  <div
                    className="login-cred-row-premium"
                    onClick={() => llenar('lucia@gmail.com', '123456')}
                  >
                    <div>
                      <strong>🗂️ Secretaria</strong>
                      <small>Gestión de solicitudes y agenda</small>
                    </div>
                    <span>secretaria@refrimora.com</span>
                  </div>

                  <div
                    className="login-cred-row-premium"
                    onClick={() => llenar('jose@refrimora.com', '123456')}
                  >
                    <div>
                      <strong>🔧 Técnico Jose</strong>
                      <small>Panel técnico y seguimiento</small>
                    </div>
                    <span>tecnico@refrimora.com</span>
                  </div>

                  <div
                    className="login-cred-row-premium"
                    onClick={() => llenar('keiver@refrimora.com', 'keiver9655')}
                  >
                    <div>
                      <strong>🔧 Técnico Keiver</strong>
                      <small>Panel técnico y seguimiento</small>
                    </div>
                    <span>tecnico@refrimora.com</span>
                  </div>
                </div>
              </>
            )}

            {tab === 'cliente' && (
              <>
                {errorC && <div className="login-alert-premium">⚠️ {errorC}</div>}

                <div className="login-field-premium">
                  <label>Correo electrónico</label>
                  <input
                    type="email"
                    value={emailC}
                    onChange={(e) => setEmailC(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLoginCliente()}
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div className="login-field-premium">
                  <label>Contraseña</label>
                  <input
                    type="password"
                    value={passC}
                    onChange={(e) => setPassC(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLoginCliente()}
                    placeholder="••••••••"
                  />
                </div>

                <button className="login-btn-premium" type="button" onClick={handleLoginCliente}>
                  Entrar a mi portal
                </button>

                <p className="login-register-link">
                  ¿No tienes cuenta? <Link to="/registro">Regístrate gratis</Link>
                </p>

                <div className="login-cred-box-premium">
                  <p>Clientes de prueba</p>

                  <div
                    className="login-cred-row-premium"
                    onClick={() => {
                      setEmailC('carlos@gmail.com');
                      setPassC('carlos1234');
                      setErrorC('');
                    }}
                  >
                    <div>
                      <strong>👤 Carlos Pérez</strong>
                      <small>Cliente con historial de servicios</small>
                    </div>
                    <span>carlos@gmail.com</span>
                  </div>

                  <div
                    className="login-cred-row-premium"
                    onClick={() => {
                      setEmailC('maria@gmail.com');
                      setPassC('maria1234');
                      setErrorC('');
                    }}
                  >
                    <div>
                      <strong>👤 María López</strong>
                      <small>Seguimiento y solicitudes activas</small>
                    </div>
                    <span>maria@gmail.com</span>
                  </div>
                </div>
              </>
            )}

            <div className="login-back-link">
              <Link to="/">← Volver al inicio</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}