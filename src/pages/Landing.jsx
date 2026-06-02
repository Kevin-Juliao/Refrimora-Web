import { useNavigate } from 'react-router-dom';


export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-wrapper">

      {/* ── NAVBAR ── */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="landing-logo-mark">❄</div>
          <div>
            <div className="brand-text">Refrimora</div>
            
            <div className="brand-sub">Lavado y reparación de aires acondicionados</div>
          </div>
        </div>
        <div className="landing-nav-links">
          <a href="#inicio">Inicio</a>
         
          <button className="btn landing-btn-ghost" onClick={() => navigate('/registro')}>
            Registrarte
          </button>
          <button className="btn landing-btn-main" onClick={() => navigate('/login')}>
            Iniciar Sesión
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="landing-hero" id="inicio">
        <div className="landing-hero-inner">

          <div className="landing-hero-copy">
            <span className="landing-chip">Servicio técnico en climatización · La Loma, Cesar</span>
            <h1>
              Tu aire acondicionado en manos
              <span className="landing-accent"> profesionales</span>
            </h1>
            <p>
              Agenda revisiones, reparaciones e instalaciones directamente
              desde tu portal personal. Rápido, claro y confiable.
            </p>
            <div className="landing-hero-actions">
              <button className="btn landing-btn-main landing-btn-lg" onClick={() => navigate('/registro')}>
                Crear cuenta gratis
              </button>
              <button className="btn landing-btn-ghost landing-btn-lg" onClick={() => navigate('/login')}>
                Iniciar Sesión
              </button>
            </div>
            <div className="landing-stats">
              <div className="landing-stat"><strong>24h</strong><span>Respuesta ágil</span></div>
              <div className="landing-stat"><strong>Multiples</strong><span>Servicios clave</span></div>
              <div className="landing-stat"><strong>100%</strong><span>Enfoque técnico</span></div>
            </div>
          </div>

         <div className="landing-hero-panel">
            <div className="lhp-top lhp-top-column">
              <div>
                <p className="lhp-label">Nuestros servicios</p>
                <h3 className="lhp-title">Atención técnica y contacto</h3>
              </div>
              <span className="landing-chip">Disponible hoy</span>
            </div>

            <div className="lhp-services-box">
              <div className="lhp-service-item">
                <span className="lhp-service-icon">🧼</span>
                <div>
                  <strong>Mantenimiento preventivo</strong>
                  <small>Limpieza y optimización del equipo.</small>
                </div>
              </div>

              <div className="lhp-service-item">
                <span className="lhp-service-icon">🛠️</span>
                <div>
                  <strong>Reparación técnica</strong>
                  <small>Diagnóstico y solución de fallas.</small>
                </div>
              </div>

              <div className="lhp-service-item">
                <span className="lhp-service-icon">❄️</span>
                <div>
                  <strong>Recarga de gas</strong>
                  <small>Revisión, recarga y detección de fugas.</small>
                </div>
              </div>

              <div className="lhp-service-item">
                <span className="lhp-service-icon">📦</span>
                <div>
                  <strong>Instalación nueva</strong>
                  <small>Montaje profesional y puesta en marcha.</small>
                </div>
              </div>
            </div>

            <div className="lhp-contact-box">
              <div className="lhp-contact-item">
                <span>📧</span>
                <div>
                  <small>Correo</small>
                  <strong>refrimora@email.com</strong>
                </div>
              </div>

              <div className="lhp-contact-item">
                <span>📱</span>
                <div>
                  <small>Teléfono</small>
                  <strong>+57  317 8758468</strong>
                </div>
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta-section" id="agenda">
        <div className="landing-shell">
          <div className="landing-cta-card">
            <div className="landing-cta-copy">
              <h2 className="section-title landing-cta-title">¿Listo para agendar?</h2>
              <p className="section-sub landing-cta-sub">
                Crea tu cuenta gratis, inicia sesión y solicita tu servicio en minutos.
              </p>
            </div>
            <div className="landing-cta-actions">
              <button className="btn landing-btn-main landing-btn-lg" onClick={() => navigate('/registro')}>
                Crear cuenta gratis
              </button>
              <button className="btn landing-btn-ghost landing-btn-lg" onClick={() => navigate('/login')}>
                Ya tengo cuenta
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        © 2026 Refrimora — Lavado y Reparación de Aires Acondicionados · La loma, Cesar
      </footer>

    </div>
  );
}
