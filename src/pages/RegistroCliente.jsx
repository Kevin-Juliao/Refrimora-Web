import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function RegistroCliente() {
  const { registrarCliente } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    documentoIdentidad: '',
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    telefono: '',
    viaTipo: 'Calle',
    viaPrincipal: '',
    viaSecundaria: '',
    viaCruce: '',
    detalles: '',
    email: '',
    password: '',
    confirmar: ''
  });
  const [error, setError]       = useState('');
  const [cargando, setCargando] = useState(false);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.id]: e.target.value }));

  const handleRegistro = async () => {
    const { 
      documentoIdentidad, 
      primerNombre, 
      segundoNombre, 
      primerApellido, 
      segundoApellido, 
      telefono, 
      viaTipo, 
      viaPrincipal, 
      viaSecundaria, 
      viaCruce, 
      detalles, 
      email, 
      password, 
      confirmar 
    } = form;

    if (!documentoIdentidad || !primerNombre || !primerApellido || !telefono || !email || !password)
      return setError('Completa todos los campos obligatorios.');
    if (password.length < 6)
      return setError('La contraseña debe tener al menos 6 caracteres.');
    if (password !== confirmar)
      return setError('Las contraseñas no coinciden.');

    // Construir dirección estructurada
    let direccionConstruida = '';
    if (viaTipo === 'Manzana') {
      direccionConstruida = `Manzana ${viaPrincipal} Casa ${viaSecundaria}`;
    } else if (viaTipo === 'Kilómetro') {
      direccionConstruida = `Kilómetro ${viaPrincipal} Vía ${viaSecundaria}`;
    } else {
      direccionConstruida = `${viaTipo} ${viaPrincipal}`;
      if (viaSecundaria) direccionConstruida += ` # ${viaSecundaria}`;
      if (viaCruce) direccionConstruida += ` - ${viaCruce}`;
    }
    if (detalles) {
      direccionConstruida += `, ${detalles}`;
    }
    direccionConstruida = direccionConstruida.trim();

    setCargando(true);
    setError('');
    
    const resultado = await registrarCliente({ 
      documentoIdentidad: documentoIdentidad.trim(), 
      primerNombre: primerNombre.trim(), 
      segundoNombre: segundoNombre.trim(), 
      primerApellido: primerApellido.trim(), 
      segundoApellido: segundoApellido.trim(), 
      telefono: telefono.trim(), 
      direccion: direccionConstruida, 
      email: email.trim(), 
      password 
    });
    
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

            {/* Cédula y Teléfono */}
            <div className="reg-row">
              <div className="reg-field">
                <label htmlFor="documentoIdentidad">Cédula / Documento <span className="req">*</span></label>
                <input id="documentoIdentidad" value={form.documentoIdentidad} onChange={handleChange} placeholder="Ej. 1065123456" />
              </div>
              <div className="reg-field">
                <label htmlFor="telefono">Teléfono <span className="req">*</span></label>
                <input id="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej. 3001234567" />
              </div>
            </div>

            {/* Nombres */}
            <div className="reg-row">
              <div className="reg-field">
                <label htmlFor="primerNombre">Primer Nombre <span className="req">*</span></label>
                <input id="primerNombre" value={form.primerNombre} onChange={handleChange} placeholder="Ej. Juan" />
              </div>
              <div className="reg-field">
                <label htmlFor="segundoNombre">Segundo Nombre</label>
                <input id="segundoNombre" value={form.segundoNombre} onChange={handleChange} placeholder="Ej. Carlos (Opcional)" />
              </div>
            </div>

            {/* Apellidos */}
            <div className="reg-row">
              <div className="reg-field">
                <label htmlFor="primerApellido">Primer Apellido <span className="req">*</span></label>
                <input id="primerApellido" value={form.primerApellido} onChange={handleChange} placeholder="Ej. Pérez" />
              </div>
              <div className="reg-field">
                <label htmlFor="segundoApellido">Segundo Apellido</label>
                <input id="segundoApellido" value={form.segundoApellido} onChange={handleChange} placeholder="Ej. Rodríguez (Opcional)" />
              </div>
            </div>

            {/* Dirección Estructurada */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(123,178,255,0.1)', marginBottom: '15px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#7ecfff', display: 'block', marginBottom: '10px' }}>
                📍 Constructor de Dirección
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div className="reg-field" style={{ margin: 0 }}>
                  <label htmlFor="viaTipo" style={{ fontSize: '11px' }}>Tipo de Vía</label>
                  <select id="viaTipo" value={form.viaTipo} onChange={handleChange} style={{ width: '100%', background: '#111827', color: '#fff', border: '1px solid #374151', borderRadius: '6px', padding: '8px' }}>
                    <option value="Calle">Calle</option>
                    <option value="Carrera">Carrera</option>
                    <option value="Avenida">Avenida</option>
                    <option value="Transversal">Transversal</option>
                    <option value="Diagonal">Diagonal</option>
                    <option value="Manzana">Manzana</option>
                    <option value="Kilómetro">Kilómetro</option>
                  </select>
                </div>
                
                <div className="reg-field" style={{ margin: 0 }}>
                  <label htmlFor="viaPrincipal" style={{ fontSize: '11px' }}>
                    {form.viaTipo === 'Manzana' ? 'Letra Manz.' : form.viaTipo === 'Kilómetro' ? 'Km #' : 'Vía Principal'}
                  </label>
                  <input id="viaPrincipal" value={form.viaPrincipal} onChange={handleChange} placeholder={form.viaTipo === 'Manzana' ? 'A' : '15'} style={{ padding: '8px' }} />
                </div>
                
                <div className="reg-field" style={{ margin: 0 }}>
                  <label htmlFor="viaSecundaria" style={{ fontSize: '11px' }}>
                    {form.viaTipo === 'Manzana' ? 'Casa #' : form.viaTipo === 'Kilómetro' ? 'Destino' : 'Vía Secund.'}
                  </label>
                  <input id="viaSecundaria" value={form.viaSecundaria} onChange={handleChange} placeholder={form.viaTipo === 'Manzana' ? '12' : '4'} style={{ padding: '8px' }} />
                </div>
                
                <div className="reg-field" style={{ margin: 0 }}>
                  <label htmlFor="viaCruce" style={{ fontSize: '11px' }}>
                    {['Manzana', 'Kilómetro'].includes(form.viaTipo) ? 'N/A' : 'Placa / Cruce'}
                  </label>
                  <input id="viaCruce" value={form.viaCruce} onChange={handleChange} placeholder="20" disabled={['Manzana', 'Kilómetro'].includes(form.viaTipo)} style={{ padding: '8px' }} />
                </div>
              </div>
              
              <div className="reg-field" style={{ margin: 0 }}>
                <label htmlFor="detalles" style={{ fontSize: '11px' }}>Barrio, Conjunto, Apto o Detalles Adicionales</label>
                <input id="detalles" value={form.detalles} onChange={handleChange} placeholder="Ej. Barrio Centro, Apt 301" style={{ padding: '8px' }} />
              </div>
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
