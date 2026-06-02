import { useState, useMemo } from 'react';
import { useApp, formatearPeso, formatearFecha, totalServicio } from '../../context/AppContext';
import EstadoBadge from '../../components/badges/EstadoBadge';
import Timeline from '../../components/timeline/Timeline';
import Modal from '../../components/layout/Modal';
import { useNavigate, Navigate } from 'react-router-dom';

const TIPOS = ['Mantenimiento', 'Reparación', 'Recarga', 'Instalación', 'Revisión'];
const TIPOS_AIRE = ['Split', 'Ventana', 'Cassette', 'Central', 'Portátil', 'Mini Split'];

const NAV_ITEMS = [
  { key: 'inicio', label: 'Inicio' },
  { key: 'solicitar', label: 'Solicitar Servicio' },
  { key: 'estado', label: 'Mi Orden' },
  { key: 'historial', label: 'Historial' },
];

export default function ClienteDashboard() {
  const navigate = useNavigate();
  const {
    cliente,
    logoutCliente,
    servicios,
    repuestos,
    usuarios,
    agregarSolicitudWeb,
    obtenerDisponibilidadTecnicos,
  } = useApp();

  const [seccion, setSeccion] = useState('inicio');
  const [menuOpen, setMenuOpen] = useState(false);

  const hoy = new Date().toISOString().split('T')[0];
  const [tipo, setTipo] = useState('');
  const [tipoAire, setTipoAire] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [solAlert, setSolAlert] = useState({ tipo: '', msg: '' });
  const [enviando, setEnviando] = useState(false);

  const [modalDetalle, setModalDetalle] = useState(false);
  const [servDetalle, setServDetalle] = useState(null);

  if (!cliente) return <Navigate to="/login" replace />;

  const misServicios = useMemo(
    () => servicios.filter(s => String(s.clienteId) === String(cliente.id)),
    [servicios, cliente.id]
  );

  const servicioActivo = misServicios.find(
    s => !['finalizado', 'cancelado'].includes(s.estado)
  );

  const disponibilidad = useMemo(() => {
    if (!fecha) {
      return {
        disponibles: [],
        ocupados: [],
        totalActivos: 0,
        sinCupo: false,
        duracion: 0,
      };
    }

    return obtenerDisponibilidadTecnicos(fecha, hora, tipo);
  }, [fecha, hora, tipo, obtenerDisponibilidadTecnicos]);

  const enviarSolicitud = async () => {
    if (!tipo || !tipoAire || !fecha || !hora) {
      return setSolAlert({
        tipo: 'error',
        msg: 'Completa tipo de servicio, tipo de aire, fecha y hora.'
      });
    }

    if (disponibilidad.disponibles.length === 0) {
      return setSolAlert({
        tipo: 'error',
        msg: 'No hay técnicos disponibles para este horario. Por favor, escoge una hora diferente o selecciona otro día.'
      });
    }

    setEnviando(true);
    setSolAlert({ tipo: '', msg: '' });

    try {
      await agregarSolicitudWeb({
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        email: cliente.email,
        tipo,
        fecha,
        hora,
        problema: `Tipo de aire: ${tipoAire}. ${diagnostico}`,
        fechaEnvio: new Date().toLocaleString('es-CO'),
        estado: 'pendiente',
      });

      setSolAlert({
        tipo: 'success',
        msg: '✅ Solicitud enviada. La secretaria te agendará pronto.'
      });

      setTipo('');
      setTipoAire('');
      setDiagnostico('');
      setFecha('');
      setHora('');
    } catch (e) {
      setSolAlert({
        tipo: 'error',
        msg: e.message || 'No se pudo enviar la solicitud.'
      });
    } finally {
      setEnviando(false);
    }
  };

  const abrirDetalle = srv => {
    setServDetalle(srv);
    setModalDetalle(true);
  };

  const obtenerNombreTecnico = srv =>
    srv?.tecnicoNombre ||
    usuarios.find(u => String(u.id) === String(srv?.tecnicoId))?.nombre ||
    '—';

  const initials = cliente.nombre
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="cp-shell">
      <nav className="cp-nav">
        <div className="cp-nav-brand">
          <div className="cp-nav-logo">❄</div>
          <div>
            <span className="cp-nav-title">Refrimora</span>
            <span className="cp-nav-sub">Portal Cliente</span>
          </div>
        </div>

        <div className={`cp-nav-links ${menuOpen ? 'open' : ''}`}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`cp-nav-link ${seccion === item.key ? 'active' : ''}`}
              onClick={() => {
                setSeccion(item.key);
                setMenuOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="cp-nav-right">
          <div className="cp-nav-user">
            <div className="cp-nav-avatar">{initials}</div>
            <span className="cp-nav-username">{cliente.nombre.split(' ')[0]}</span>
          </div>
          <button
            className="cp-nav-salir"
            onClick={() => {
              logoutCliente();
              navigate('/login', { replace: true });
            }}
          >
            Salir
          </button>
          <button
            className="cp-nav-hamburger"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Menú"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className="cp-body">
        {seccion === 'inicio' && (
          <div className="cp-section">
            <div className="cp-hero">
              <div className="cp-hero-glow" />
              <div className="cp-hero-content">
                <div className="cp-hero-avatar">{initials}</div>
                <div>
                  <h1 className="cp-hero-greeting">Hola, {cliente.nombre.split(' ')[0]} 👋</h1>
                  <p className="cp-hero-sub">Bienvenido a tu portal de servicios Refrimora.</p>
                </div>
              </div>
              <div className="cp-hero-badge">
                {servicioActivo ? (
                  <span className="cp-hero-status active">● Servicio activo</span>
                ) : (
                  <span className="cp-hero-status idle">● Sin servicios activos</span>
                )}
              </div>
            </div>

            <div className="cp-stats-row">
              {[
                { label: 'Servicios totales', valor: misServicios.length, icon: '📋', cls: 'blue' },
                { label: 'En curso', valor: misServicios.filter(s => !['finalizado', 'cancelado'].includes(s.estado)).length, icon: '🔧', cls: 'orange' },
                { label: 'Completados', valor: misServicios.filter(s => s.estado === 'finalizado').length, icon: '✅', cls: 'green' },
              ].map(c => (
                <div key={c.label} className={`cp-stat-card ${c.cls}`}>
                  <div className="cp-stat-icon">{c.icon}</div>
                  <div className="cp-stat-num">{c.valor}</div>
                  <div className="cp-stat-label">{c.label}</div>
                </div>
              ))}
            </div>

            {servicioActivo ? (
              <div className="cp-active-card">
                <div className="cp-active-card-glow" />
                <div className="cp-active-header">
                  <div>
                    <span className="cp-active-tag">🔧 Servicio activo</span>
                    <h3 className="cp-active-title">
                      Orden #{servicioActivo.id} — {servicioActivo.tipo}
                    </h3>
                  </div>
                  <EstadoBadge estado={servicioActivo.estado} />
                </div>

                <div className="cp-active-meta">
                  <span><strong>Fecha:</strong> {formatearFecha(servicioActivo.fechaServicio)}</span>
                  <span><strong>Hora:</strong> {servicioActivo.hora}</span>
                  <span><strong>Técnico:</strong> {obtenerNombreTecnico(servicioActivo)}</span>
                </div>

                <div className="cp-active-timeline">
                  <Timeline estadoActivo={servicioActivo.estado} />
                </div>

                <button className="cp-btn-main" onClick={() => setSeccion('estado')}>
                  Ver detalle completo →
                </button>
              </div>
            ) : (
              <div className="cp-empty-card">
                <div className="cp-empty-icon">📭</div>
                <h3>No tienes servicios activos</h3>
                <p>Solicita un servicio y un técnico llegará a tu puerta.</p>
                <button className="cp-btn-main" onClick={() => setSeccion('solicitar')}>
                  Solicitar un servicio
                </button>
              </div>
            )}
          </div>
        )}

        {seccion === 'solicitar' && (
          <div className="cp-section">
            <div className="cp-page-header">
              <h2 className="cp-page-title">Solicitar nuevo servicio</h2>
              <p className="cp-page-sub">
                Completa el formulario y nuestra secretaria te agendará lo antes posible.
              </p>
            </div>

            <div className="cp-form-card">
              <div className="cp-form-card-header">
                <div className="cp-form-card-icon">🛠</div>
                <div>
                  <strong>Nueva solicitud</strong>
                  <span>{cliente.nombre} · {cliente.direccion}</span>
                </div>
              </div>

              {solAlert.msg && (
                <div className={`cp-alert ${solAlert.tipo}`}>{solAlert.msg}</div>
              )}

              <div className="cp-form-row">
                <div className="cp-field">
                  <label>Tipo de servicio <span className="req">*</span></label>
                  <select value={tipo} onChange={e => setTipo(e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="cp-field">
                  <label>Tipo de aire <span className="req">*</span></label>
                  <select value={tipoAire} onChange={e => setTipoAire(e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {TIPOS_AIRE.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="cp-field">
                <label>Describe el problema o diagnóstico</label>
                <textarea
                  value={diagnostico}
                  onChange={e => setDiagnostico(e.target.value)}
                  placeholder="Ej. El aire no enfría bien, hace un ruido raro..."
                  rows={3}
                />
              </div>

              <div className="cp-form-row">
                <div className="cp-field">
                  <label>Fecha preferida <span className="req">*</span></label>
                  <input
                    type="date"
                    min={hoy}
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                  />
                </div>

                <div className="cp-field">
                  <label>Hora preferida <span className="req">*</span></label>
                  <input
                    type="time"
                    value={hora}
                    onChange={e => setHora(e.target.value)}
                  />
                </div>
              </div>

              {fecha && (
                <div className="cp-tecnicos-box">
                  {!tipo ? (
                    <p className="cp-tecnicos-hint">
                      Selecciona primero el tipo de servicio para validar la duración del trabajo.
                    </p>
                  ) : !hora ? (
                    <p className="cp-tecnicos-hint">
                      Selecciona la hora para validar si hay cupo disponible en ese intervalo.
                    </p>
                  ) : disponibilidad.disponibles.length > 0 ? (
                    <p className="cp-tecnicos-ok">
                      ✅ Hay disponibilidad para este horario. Puedes continuar con tu solicitud.
                    </p>
                  ) : (
                    <p className="cp-tecnicos-none">
                      ❌ No hay técnicos disponibles para este horario. Por favor, elige una hora diferente o selecciona otro día.
                    </p>
                  )}
                </div>
              )}

              <div className="cp-form-actions">
                <button className="cp-btn-ghost" onClick={() => setSeccion('inicio')}>
                  Cancelar
                </button>
                <button className="cp-btn-main" onClick={enviarSolicitud} disabled={enviando}>
                  {enviando ? <><span className="cp-spinner" /> Enviando...</> : 'Enviar solicitud'}
                </button>
              </div>
            </div>
          </div>
        )}

        {seccion === 'estado' && (
          <div className="cp-section">
            <div className="cp-page-header">
              <h2 className="cp-page-title">Estado de mi orden</h2>
              <p className="cp-page-sub">Seguimiento en tiempo real de tu servicio activo.</p>
            </div>

            {!servicioActivo ? (
              <div className="cp-empty-card">
                <div className="cp-empty-icon">✅</div>
                <h3>No tienes órdenes activas</h3>
                <p>Todos tus servicios están completados o cancelados.</p>
                <button className="cp-btn-main" onClick={() => setSeccion('solicitar')}>
                  Solicitar nuevo servicio
                </button>
              </div>
            ) : (
              <div className="cp-orden-grid">
                <div className="cp-panel">
                  <div className="cp-panel-header">
                    <h3>Orden #{servicioActivo.id}</h3>
                    <EstadoBadge estado={servicioActivo.estado} />
                  </div>

                  <div className="cp-panel-body">
                    <table className="cp-detail-table">
                      <tbody>
                        {[
                          ['Tipo de servicio', servicioActivo.tipo],
                          ['Fecha', formatearFecha(servicioActivo.fechaServicio)],
                          ['Hora', servicioActivo.hora],
                          ['Técnico', obtenerNombreTecnico(servicioActivo)],
                          ['Diagnóstico', servicioActivo.diagnostico || '—'],
                        ].map(([k, v]) => (
                          <tr key={k}>
                            <td className="cp-detail-key">{k}</td>
                            <td className="cp-detail-val">{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {servicioActivo.repuestos?.length > 0 && (
                      <div className="cp-repuestos-section">
                        <p className="cp-repuestos-title">Repuestos utilizados</p>
                        <table className="cp-rep-table">
                          <thead>
                            <tr>
                              <th>Repuesto</th>
                              <th>Cant.</th>
                              <th>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {servicioActivo.repuestos.map((r, i) => {
                              const rep = repuestos.find(x => Number(x.id) === Number(r.repuestoId));
                              return (
                                <tr key={i}>
                                  <td>{rep?.icono} {rep?.nombre || '—'}</td>
                                  <td className="text-center">{r.cantidad}</td>
                                  <td className="text-right">
                                    {formatearPeso((rep?.precio || 0) * r.cantidad)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="cp-total-box">
                      <span>Total a pagar</span>
                      <strong>{formatearPeso(totalServicio(servicioActivo, repuestos))}</strong>
                    </div>
                  </div>
                </div>

                <div className="cp-panel cp-timeline-panel">
                  <div className="cp-panel-header"><h3>Progreso</h3></div>
                  <div className="cp-panel-body">
                    <Timeline estadoActivo={servicioActivo.estado} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {seccion === 'historial' && (
          <div className="cp-section">
            <div className="cp-page-header">
              <h2 className="cp-page-title">Historial de servicios</h2>
              <p className="cp-page-sub">
                {misServicios.length} servicio{misServicios.length !== 1 ? 's' : ''} registrado{misServicios.length !== 1 ? 's' : ''}.
              </p>
            </div>

            {misServicios.length === 0 ? (
              <div className="cp-empty-card">
                <div className="cp-empty-icon">📂</div>
                <h3>Aún no tienes servicios registrados</h3>
                <p>Cuando solicites un servicio, aparecerá aquí.</p>
              </div>
            ) : (
              <div className="cp-panel">
                <div className="cp-table-wrap">
                  <table className="cp-hist-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Tipo</th>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Técnico</th>
                        <th>Estado</th>
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...misServicios].reverse().map(sv => (
                        <tr key={sv.id}>
                          <td className="cp-id">{sv.id}</td>
                          <td>{sv.tipo}</td>
                          <td>{formatearFecha(sv.fechaServicio)}</td>
                          <td>{sv.hora}</td>
                          <td>{obtenerNombreTecnico(sv)}</td>
                          <td><EstadoBadge estado={sv.estado} /></td>
                          <td className="cp-money">{formatearPeso(totalServicio(sv, repuestos))}</td>
                          <td>
                            <button className="cp-btn-sm" onClick={() => abrirDetalle(sv)}>
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {modalDetalle && servDetalle && (
        <Modal
          titulo={`Detalle — Orden #${servDetalle.id}`}
          onClose={() => setModalDetalle(false)}
          footer={
            <button className="btn btn-secondary" onClick={() => setModalDetalle(false)}>
              Cerrar
            </button>
          }
        >
          <table style={{ width: '100%', fontSize: 14 }}>
            <tbody>
              {[
                ['Tipo', servDetalle.tipo],
                ['Fecha', formatearFecha(servDetalle.fechaServicio)],
                ['Hora', servDetalle.hora],
                ['Técnico', obtenerNombreTecnico(servDetalle)],
                ['Diagnóstico', servDetalle.diagnostico || '—'],
                ['Notas', servDetalle.notas || '—'],
                ['Estado', <EstadoBadge estado={servDetalle.estado} />],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px 0', color: '#666', width: '35%', fontWeight: 500 }}>{k}</td>
                  <td style={{ padding: '8px 0' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {servDetalle.repuestos?.length > 0 && (
            <>
              <hr style={{ margin: '16px 0', borderColor: '#eee' }} />
              <strong style={{ fontSize: 14 }}>Repuestos utilizados:</strong>
              <table style={{ width: '100%', marginTop: 8, fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>Repuesto</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Cant.</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {servDetalle.repuestos.map((r, i) => {
                    const rep = repuestos.find(x => Number(x.id) === Number(r.repuestoId));
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '6px 8px' }}>{rep?.icono} {rep?.nombre || '—'}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{r.cantidad}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                          {formatearPeso((rep?.precio || 0) * r.cantidad)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          <div
            style={{
              marginTop: 16,
              padding: '12px 16px',
              background: 'linear-gradient(135deg,#07111f,#0d1e36)',
              borderRadius: 10,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid rgba(123,178,255,.15)',
            }}
          >
            <span style={{ fontWeight: 600, color: '#b4c6dc' }}>Total pagado</span>
            <span style={{ fontWeight: 800, color: '#4ea3ff', fontSize: 18 }}>
              {formatearPeso(totalServicio(servDetalle, repuestos))}
            </span>
          </div>
        </Modal>
      )}
    </div>
  );
}