import { useState, useMemo } from 'react';
import { useApp, formatearPeso, formatearFecha, totalServicio, obtenerDuracionServicio, calcularIntervaloEtiqueta, formatearIntervaloBD } from '../../context/AppContext';
import EstadoBadge from '../../components/badges/EstadoBadge';
import Timeline from '../../components/timeline/Timeline';
import Modal from '../../components/layout/Modal';
import { useNavigate, Navigate } from 'react-router-dom';

const TIPOS = ['Mantenimiento', 'Reparación', 'Recarga', 'Instalación', 'Revisión'];
const TIPOS_AIRE = ['Split', 'Ventana', 'Cassette', 'Central', 'Portátil', 'Mini Split'];

const DETALLE_PRECIOS = {
  'revisión': { nombre: 'Revisión y Diagnóstico', icon: '📋' },
  'revision': { nombre: 'Revisión y Diagnóstico', icon: '📋' },
  'mantenimiento': { nombre: 'Mantenimiento Preventivo', icon: '🔧' },
  'recarga': { nombre: 'Recarga de Refrigerante', icon: '❄️' },
  'reparación': { nombre: 'Reparación de Aire', icon: '🛠️' },
  'reparacion': { nombre: 'Reparación de Aire', icon: '🛠️' },
  'instalación': { nombre: 'Instalación Completa', icon: '⚙️' },
  'instalacion': { nombre: 'Instalación Completa', icon: '⚙️' },
};

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
    obtenerIntervalosDisponibles,
    preciosServicios,
  } = useApp();

  const [seccion, setSeccion] = useState('inicio');
  const [menuOpen, setMenuOpen] = useState(false);

  const hoy = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const [tipo, setTipo] = useState('');
  const [listaAires, setListaAires] = useState([]);
  const [tipoAireTemp, setTipoAireTemp] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [solAlert, setSolAlert] = useState({ tipo: '', msg: '' });
  const [enviando, setEnviando] = useState(false);

  const agregarAire = () => {
    if (!tipo) {
      return setSolAlert({
        tipo: 'error',
        msg: 'Selecciona primero el tipo de servicio.'
      });
    }
    if (!tipoAireTemp) {
      return setSolAlert({
        tipo: 'error',
        msg: 'Selecciona un tipo de aire para agregar.'
      });
    }
    setListaAires(prev => [...prev, { tipoAire: tipoAireTemp, tipoServicio: tipo, duracion: obtenerDuracionServicio(tipo) }]);
    setTipoAireTemp('');
    setSolAlert({ tipo: '', msg: '' });
  };

  const quitarAire = (index) => {
    setListaAires(prev => prev.filter((_, i) => i !== index));
  };

  const [modalDetalle, setModalDetalle] = useState(false);
  const [servDetalle, setServDetalle] = useState(null);

  if (!cliente) return <Navigate to="/login" replace />;

  const misServicios = useMemo(
    () => servicios.filter(s => String(s.clienteId) === String(cliente.id)),
    [servicios, cliente.id]
  );

  const servicioActivo = misServicios.find(
    s => !['finalizado', 'cancelado', 'cerrado'].includes(s.estado)
  );

  const duracionTotal = useMemo(() => {
    let total = listaAires.reduce((sum, a) => sum + a.duracion, 0);
    if (listaAires.length === 0 && tipo && tipoAireTemp) {
      total += obtenerDuracionServicio(tipo);
    }
    return total;
  }, [listaAires, tipo, tipoAireTemp]);

  const intervalosDisponibles = useMemo(() => {
    if (!fecha || duracionTotal === 0) return [];
    return obtenerIntervalosDisponibles(fecha, duracionTotal);
  }, [fecha, duracionTotal, obtenerIntervalosDisponibles]);

  const enviarSolicitud = async () => {
    let airesFinales = [...listaAires];
    if (airesFinales.length === 0 && tipo && tipoAireTemp) {
      airesFinales.push({ tipoAire: tipoAireTemp, tipoServicio: tipo, duracion: obtenerDuracionServicio(tipo) });
    }

    if (airesFinales.length === 0 || !fecha || !hora) {
      return setSolAlert({
        tipo: 'error',
        msg: 'Completa el tipo de servicio y tipo de aire (y haz clic en Añadir), selecciona la fecha y la hora.'
      });
    }

    const horaValida = intervalosDisponibles.some(inv => inv.inicio === hora);
    if (!horaValida) {
      return setSolAlert({
        tipo: 'error',
        msg: 'El intervalo seleccionado ya no está disponible. Por favor elige otro.'
      });
    }

    setEnviando(true);
    setSolAlert({ tipo: '', msg: '' });

    const primerTipo = airesFinales[0]?.tipoServicio || tipo;

    try {
      await agregarSolicitudWeb({
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        email: cliente.email,
        tipo: primerTipo,
        fecha,
        hora: formatearIntervaloBD(hora, duracionTotal),
        problema: diagnostico || 'Sin diagnóstico adicional',
        aires: JSON.stringify(airesFinales),
        fechaEnvio: new Date().toISOString(),
        estado: 'pendiente',
      });

      setSolAlert({
        tipo: 'success',
        msg: '✅ Solicitud enviada. La secretaria te agendará pronto.'
      });

      setTipo('');
      setListaAires([]);
      setTipoAireTemp('');
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
                { label: 'En curso', valor: misServicios.filter(s => !['finalizado', 'cancelado', 'cerrado'].includes(s.estado)).length, icon: '🔧', cls: 'orange' },
                { label: 'Completados', valor: misServicios.filter(s => ['finalizado', 'cerrado'].includes(s.estado)).length, icon: '✅', cls: 'green' },
              ].map(c => (
                <div key={c.label} className={`cp-stat-card ${c.cls}`}>
                  <div className="cp-stat-icon">{c.icon}</div>
                  <div className="cp-stat-num">{c.valor}</div>
                  <div className="cp-stat-label">{c.label}</div>
                </div>
              ))}
            </div>

            <div className="cp-grid-main" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '24px' }}>
              {/* Columna Izquierda: Orden Activa / Tarjeta Vacía */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {servicioActivo ? (
                  <div className="cp-active-card" style={{ height: '100%', margin: 0, display: 'flex', flexDirection: 'column' }}>
                    <div className="cp-active-card-glow" />
                    <div className="cp-active-header">
                      <div>
                        <span className="cp-active-tag">🔧 Servicio activo</span>
                        <h3 className="cp-active-title">
                          Orden #{servicioActivo.id} — {servicioActivo.tipo}
                        </h3>
                      </div>
                      <EstadoBadge estado={servicioActivo.estado} esCliente />
                    </div>

                    <div className="cp-active-meta">
                      <span><strong>Fecha:</strong> {formatearFecha(servicioActivo.fechaServicio)}</span>
                      <span><strong>Hora:</strong> {calcularIntervaloEtiqueta(servicioActivo.hora, servicioActivo.duracionForzada)}</span>
                      <span><strong>Técnico:</strong> {obtenerNombreTecnico(servicioActivo)}</span>
                    </div>

                    <div className="cp-active-timeline" style={{ marginBottom: '20px' }}>
                      <Timeline estadoActivo={servicioActivo.estado} />
                    </div>

                    <button className="cp-btn-main" onClick={() => setSeccion('estado')} style={{ marginTop: 'auto' }}>
                      Ver detalle completo →
                    </button>
                  </div>
                ) : (
                  <div className="cp-empty-card" style={{ height: '100%', margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div className="cp-empty-icon">📭</div>
                    <h3>No tienes servicios activos</h3>
                    <p>Solicita un servicio y un técnico llegará a tu puerta.</p>
                    <button className="cp-btn-main" onClick={() => setSeccion('solicitar')} style={{ marginTop: 'auto' }}>
                      Solicitar un servicio
                    </button>
                  </div>
                )}
              </div>

              {/* Columna Derecha: Tarjeta de Tarifas de Servicios */}
              <div className="cp-active-card" style={{ border: '1px solid rgba(123, 178, 255, 0.15)', background: 'linear-gradient(180deg, rgba(14,28,52,.4), rgba(9,18,32,.5))', height: '100%', display: 'flex', flexDirection: 'column', margin: 0 }}>
                <div className="cp-active-header" style={{ marginBottom: '15px' }}>
                  <div>
                    <span className="cp-active-tag" style={{ background: 'rgba(78, 163, 255, 0.15)', color: '#7ecfff' }}>💰 TARIFAS DE REFERENCIA</span>
                    <h3 className="cp-active-title" style={{ marginTop: '5px' }}>Precios de Servicios</h3>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1, marginBottom: '15px' }}>
                  {preciosServicios.map(item => {
                    const norm = String(item.nombre || '').toLowerCase().trim();
                    const info = DETALLE_PRECIOS[norm] || { nombre: item.nombre, icon: '💰' };
                    return (
                      <div key={item.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 15px', borderRadius: '10px', border: '1px solid rgba(123,178,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '18px' }}>{info.icon}</span>
                          <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: '500' }}>{info.nombre}</span>
                        </div>
                        <strong style={{ color: '#7ecfff', fontSize: '13px' }}>{formatearPeso(item.precio)}</strong>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '11px', color: '#fbbf24', marginTop: 'auto' }}>
                  <span style={{ fontSize: '14px' }}>⚠️</span>
                  <span>El precio puede variar según el estado del aire y repuestos necesarios.</span>
                </div>
              </div>
            </div>
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
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={tipoAireTemp}
                      onChange={e => setTipoAireTemp(e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="">Seleccionar...</option>
                      {TIPOS_AIRE.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button
                      type="button"
                      className="cp-btn-main"
                      onClick={agregarAire}
                      style={{
                        padding: '0 16px',
                        fontSize: '14px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #1e40af, #2563eb)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        height: '42px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                      }}
                    >
                      Añadir
                    </button>
                  </div>
                </div>
              </div>

              {listaAires.length > 0 && (
                <div className="cp-field">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Aires acondicionados agregados ({listaAires.length})
                  </label>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    padding: '12px',
                    background: 'rgba(30, 41, 59, 0.03)',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.15)'
                  }}>
                    {listaAires.map((aire, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'white',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: '1px solid rgba(148, 163, 184, 0.25)',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                          fontSize: '13px',
                          color: '#334155',
                          fontWeight: '500'
                        }}
                      >
                        <span>❄️ {aire.tipoAire}: {aire.tipoServicio} ({aire.duracion}m)</span>
                        <button
                          type="button"
                          onClick={() => quitarAire(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            padding: '0 4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 1,
                            transition: 'color 0.2s',
                          }}
                          title="Quitar"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  <label>Hora preferida (Intervalos) <span className="req">*</span></label>
                  <select
                    value={hora}
                    onChange={e => setHora(e.target.value)}
                    disabled={!fecha || intervalosDisponibles.length === 0}
                  >
                    <option value="">Seleccionar intervalo...</option>
                    {intervalosDisponibles.map(inv => (
                      <option key={inv.inicio} value={inv.inicio}>{inv.etiqueta}</option>
                    ))}
                  </select>
                  {fecha && intervalosDisponibles.length === 0 && (
                    <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>
                      No hay horarios disponibles con el tiempo requerido ({duracionTotal} min).
                    </small>
                  )}
                </div>
              </div>

              {fecha && (
                <div className="cp-tecnicos-box">
                  {listaAires.length === 0 && !tipo ? (
                    <p className="cp-tecnicos-hint">
                      Selecciona y añade al menos un aire acondicionado para validar la duración del trabajo.
                    </p>
                  ) : !hora ? (
                    <p className="cp-tecnicos-hint">
                      Selecciona la hora para elegir un intervalo disponible.
                    </p>
                  ) : (
                    <p className="cp-tecnicos-ok">
                      ✅ Has seleccionado el intervalo de {intervalosDisponibles.find(i => i.inicio === hora)?.etiqueta || hora}.
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
                    <EstadoBadge estado={servicioActivo.estado} esCliente />
                  </div>

                  <div className="cp-panel-body">
                    <table className="cp-detail-table">
                      <tbody>
                        {[
                          ['Tipo de servicio', servicioActivo.tipo],
                          ['Fecha', formatearFecha(servicioActivo.fechaServicio)],
                          ['Hora', calcularIntervaloEtiqueta(servicioActivo.hora, servicioActivo.duracionForzada)],
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
                          <td>{calcularIntervaloEtiqueta(sv.hora, sv.duracionForzada)}</td>
                          <td>{obtenerNombreTecnico(sv)}</td>
                          <td><EstadoBadge estado={sv.estado} esCliente /></td>
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
                ['Hora', calcularIntervaloEtiqueta(servDetalle.hora, servDetalle.duracionForzada)],
                ['Técnico', obtenerNombreTecnico(servDetalle)],
                ['Diagnóstico', servDetalle.diagnostico || '—'],
                ['Notas', servDetalle.notas || '—'],
                ['Estado', <EstadoBadge estado={servDetalle.estado} esCliente />],
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

          <div className="cp-modal-total-box">
            <span className="cp-modal-total-label">Total pagado</span>
            <span className="cp-modal-total-value">
              {formatearPeso(totalServicio(servDetalle, repuestos))}
            </span>
          </div>
        </Modal>
      )}
    </div>
  );
}