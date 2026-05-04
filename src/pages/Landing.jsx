import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Landing() {
  const navigate = useNavigate();
  const { agregarSolicitudWeb } = useApp();
  const [form, setForm] = useState({
    nombre: '', telefono: '', direccion: '', email: '', tipo: '', fecha: '', problema: ''
  });
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);

  const hoy = new Date().toISOString().split('T')[0];

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.id]: e.target.value }));

  const enviar = () => {
    if (!form.nombre || !form.telefono || !form.direccion || !form.tipo || !form.fecha) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }
    agregarSolicitudWeb(form);
    setEnviado(true);
    setError('');
  };

  const nueva = () => {
    setForm({ nombre: '', telefono: '', direccion: '', email: '', tipo: '', fecha: '', problema: '' });
    setEnviado(false);
  };

  return (
    <>
      {/* NAVBAR */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <span style={{ fontSize: 26 }}>❄️</span>
          <div>
            <div className="brand-text">Refrimora</div>
            <div className="brand-sub">Lavado y Reparación de Aires Acondicionados</div>
          </div>
        </div>
        <div className="landing-nav-links">
          <a href="#inicio">Inicio</a>
          <a href="#servicios">Servicios</a>
          <a href="#agendar">Agendar</a>
          <button
            className="btn btn-outline"
            style={{ background: 'white', color: '#1a5fa8' }}
            onClick={() => navigate('/login')}
          >
            Iniciar Sesión
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div className="landing-hero" id="inicio">
        <h1>Bienvenido a Refrimora</h1>
        <p>Servicio técnico profesional de aires acondicionados.<br />Agenda tu revisión en minutos.</p>
        <a href="#agendar" className="btn btn-outline" style={{ background: 'white', color: '#1a5fa8', padding: '10px 28px', fontSize: 15 }}>
          📅 Agendar Revisión
        </a>
      </div>

      {/* SERVICIOS */}
      <section className="services-section" id="servicios">
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 className="section-title">Nuestros Servicios</h2>
          <p className="section-sub">Todo lo que necesita tu equipo de aire acondicionado</p>
          <div className="services-grid">
            {[
              { icon: '🔧', title: 'Mantenimiento Preventivo', desc: 'Limpieza profunda de filtros, serpentines y drenajes para un mejor rendimiento.' },
              { icon: '🛠️', title: 'Reparación Técnica',       desc: 'Diagnóstico y reparación de fallas eléctricas, mecánicas o de refrigeración.' },
              { icon: '❄️', title: 'Recarga de Gas',            desc: 'Recarga con gas certificado R-22 o R-410A. Detección de fugas incluida.' },
              { icon: '📦', title: 'Instalación Nueva',         desc: 'Instalación profesional de equipos nuevos con soporte y puesta en marcha.' },
            ].map(s => (
              <div key={s.title} className="service-card">
                <div className="icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORMULARIO */}
      <section className="form-section" id="agendar">
        <h2 className="section-title">Agendar una Revisión</h2>
        <p className="section-sub">Completa el formulario y te contactamos para confirmar tu cita</p>

        <div className="form-card">
          <div className="form-card-header">📅 Solicitud de Servicio</div>
          <div className="form-card-body">
            {!enviado ? (
              <>
                {error && <div className="alert alert-error">⚠️ {error}</div>}

                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre completo *</label>
                    <input id="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: María García" />
                  </div>
                  <div className="form-group">
                    <label>Teléfono *</label>
                    <input id="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej: 3001234567" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Dirección del servicio *</label>
                  <input id="direccion" value={form.direccion} onChange={handleChange} placeholder="Calle, barrio, municipio" />
                </div>

                <div className="form-group">
                  <label>Correo electrónico</label>
                  <input id="email" type="email" value={form.email} onChange={handleChange} placeholder="correo@ejemplo.com" />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo de servicio *</label>
                    <select id="tipo" value={form.tipo} onChange={handleChange}>
                      <option value="">Seleccionar...</option>
                      <option value="Mantenimiento">Mantenimiento preventivo</option>
                      <option value="Reparación">Reparación</option>
                      <option value="Recarga">Recarga de gas</option>
                      <option value="Instalación">Instalación nueva</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Fecha preferida *</label>
                    <input id="fecha" type="date" min={hoy} value={form.fecha} onChange={handleChange} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Describe el problema</label>
                  <textarea id="problema" value={form.problema} onChange={handleChange} placeholder="Ej: El aire no enfría bien, hace ruido raro..." />
                </div>

                <button className="btn btn-primary btn-full" onClick={enviar} style={{ padding: 10 }}>
                  Enviar Solicitud
                </button>
              </>
            ) : (
              <div className="success-screen">
                <div className="icon">✅</div>
                <h3>¡Solicitud enviada!</h3>
                <p>Hemos recibido tu solicitud.<br />Nuestra secretaria te contactará pronto para confirmar la cita.</p>
                <button className="btn btn-primary" onClick={nueva} style={{ marginTop: 20 }}>
                  Agendar otra revisión
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <div style={{ background: '#1a5fa8', color: 'white', textAlign: 'center', padding: 20, fontSize: 13, opacity: 0.9 }}>
        © 2025 Refrimora — Lavado y Reparación de Aires Acondicionados · Curumaní, Cesar
      </div>
    </>
  );
}
