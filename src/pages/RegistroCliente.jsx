import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function RegistroCliente() {
  const { registrarCliente } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '', telefono: '', direccion: '', email: '', password: '', confirmar: ''
  });
  const [error, setError]       = useState('');
  const [cargando, setCargando] = useState(false);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.id]: e.target.value }));

  const handleRegistro = async () => {
    const { nombre, telefono, direccion, email, password, confirmar } = form;
    if (!nombre || !telefono || !email || !password)
      return setError('Completa todos los campos obligatorios.');
    if (password.length < 6)
      return setError('La contraseña debe tener al menos 6 caracteres.');
    if (password !== confirmar)
      return setError('Las contraseñas no coinciden.');

    setCargando(true);
    setError('');
    const resultado = await registrarCliente({ nombre, telefono, direccion, email, password });
    setCargando(false);

    if (!resultado.ok) return setError(resultado.mensaje);
    navigate('/cliente');
  };

  return (
    <div className="reg-page">

      {/* Panel lateral izquierdo — solo desktop */}
      <aside className="reg-side">
        <div className="reg-side-top">
          <div className="reg-side-mark">❄</div>
          <h1 className="reg-side-brand">Refrimora</h1>
          <p className="reg-side-sub">Lavado y reparación de aires acondicionados</p>
        </div>

        <div className="reg-side-benefits">
          <div className="reg-benefit">
            <span className="reg-benefit-icon">📋</span>
            <div>
              <strong>Agenda en línea</strong>
              <small>Solicita servicios desde tu portal personal.</small>
            </div>
          </div>
          <div className="reg-benefit">
            <span className="reg-benefit-icon">🔍</span>
            <div>
              <strong>Seguimiento claro</strong>
              <small>Sigue el estado de cada orden en tiempo real.</small>
            </div>
          </div>
          <div className="reg-benefit">
            <span className="reg-benefit-icon">🛡️</span>
            <div>
              <strong>Técnicos certificados</strong>
              <small>Equipo profesional y servicio con garantía.</small>
            </div>
          </div>
          <div className="reg-benefit">
            <span className="reg-benefit-icon">⚡</span>
            <div>
              <strong>Respuesta ágil</strong>
              <small>Atención rápida en Curumaní y alrededores.</small>
            </div>
          </div>
        </div>

        <div className="reg-side-footer">
          © 2026 Refrimora · La loma, Cesar
        </div>
      </aside>

      {/* Formulario derecho */}
      <main className="reg-main">
        <div className="reg-card">

          {/* Header */}
          <div className="reg-card-header">
            <div className="reg-card-mark">❄</div>
            <div>
              <h2>Crear cuenta</h2>
              <p>Regístrate para agendar y seguir tus servicios</p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="reg-alert">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Campos */}
          <div className="reg-form">

            <div className="reg-row">
              <div className="reg-field">
                <label htmlFor="nombre">Nombre completo <span className="req">*</span></label>
                <input id="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej. Carlos Pérez" />
              </div>
              <div className="reg-field">
                <label htmlFor="telefono">Teléfono <span className="req">*</span></label>
                <input id="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej. 3001234567" />
              </div>
            </div>

            <div className="reg-field">
              <label htmlFor="direccion">Dirección</label>
              <input id="direccion" value={form.direccion} onChange={handleChange} placeholder="Calle, barrio, municipio" />
            </div>

            <div className="reg-field">
              <label htmlFor="email">Correo electrónico <span className="req">*</span></label>
              <input id="email" type="email" value={form.email} onChange={handleChange} placeholder="correo@ejemplo.com" />
            </div>

            <div className="reg-row">
              <div className="reg-field">
                <label htmlFor="password">Contraseña <span className="req">*</span></label>
                <input id="password" type="password" value={form.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="reg-field">
                <label htmlFor="confirmar">Confirmar contraseña <span className="req">*</span></label>
                <input id="confirmar" type="password" value={form.confirmar} onChange={handleChange} placeholder="Repite la contraseña" />
              </div>
            </div>

            <button className="reg-btn-main" onClick={handleRegistro} disabled={cargando}>
              {cargando ? (
                <><span className="reg-spinner"></span> Creando cuenta...</>
              ) : (
                <> Crear cuenta</>
              )}
            </button>

            <p className="reg-login-link">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login">Inicia sesión</Link>
            </p>

          </div>
        </div>
      </main>
    </div>
  );
}
