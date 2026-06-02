import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useApp,
  calcularEstadisticasDelDia,
  formatearPeso,
  formatearFecha,
  totalServicio
} from '../../context/AppContext';
import ResumenDia from "../../components/counters/ResumenDia";
import Timeline from "../../components/timeline/Timeline";
import Modal from "../../components/layout/Modal";
import AvatarCliente from '../../components/cliente/AvatarCliente';
import EstadoBadge from '../../components/badges/EstadoBadge';

const LINKS = [
  { key: 'inicio', label: 'Inicio', icon: '🏠' },
  { key: 'nuevaOrden', label: 'Nueva Orden', icon: '➕' },
  { key: 'ordenes', label: 'Órdenes', icon: '📋' },
  { key: 'clientes', label: 'Clientes', icon: '👥' },
  { key: 'solicitudes', label: 'Solicitudes Web', icon: '📨' },
  { key: 'repuestos', label: 'Inventario', icon: '🔩' },
];

export default function SecretariaDashboard() {
  const navigate = useNavigate();
  const {
    usuario,
    clientes,
    repuestos,
    servicios,
    tecnicos,
    logout,
    agregarClienteInterno,
    agregarServicio,
    actualizarServicio,
    obtenerSolicitudesWeb,
    obtenerDisponibilidadTecnicos
  } = useApp();

  const [seccion, setSeccion] = useState('inicio');
  const [menuOpen, setMenuOpen] = useState(false);

  // Nueva orden
  const [clienteTab, setClienteTab] = useState('existente');
  const [ordCliente, setOrdCliente] = useState('');
  const [ncNombre, setNcNombre] = useState('');
  const [ncTel, setNcTel] = useState('');
  const [ncDir, setNcDir] = useState('');
  const [ncEmail, setNcEmail] = useState('');
  const [ordTipo, setOrdTipo] = useState('');
  const [ordTecnico, setOrdTecnico] = useState('');
  const [ordFecha, setOrdFecha] = useState('');
  const [ordHora, setOrdHora] = useState('08:00');
  const [ordDiag, setOrdDiag] = useState('');
  const [ordPrecio, setOrdPrecio] = useState('');
  const [ordenAlert, setOrdenAlert] = useState({ tipo: '', msg: '' });
  const [guardandoOrden, setGuardandoOrden] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  // Modal actualizar estado
  const [modalActualizar, setModalActualizar] = useState(false);
  const [servActual, setServActual] = useState(null);
  const [updEstado, setUpdEstado] = useState('agendado');

  // Modal nuevo cliente
  const [modalCliente, setModalCliente] = useState(false);
  const [mncNombre, setMncNombre] = useState('');
  const [mncTel, setMncTel] = useState('');
  const [mncDir, setMncDir] = useState('');
  const [mncEmail, setMncEmail] = useState('');
  const [clAlert, setClAlert] = useState('');
  const [tempPasswordModal, setTempPasswordModal] = useState('');

  useEffect(() => {
    if (!usuario || usuario.rol?.toLowerCase() !== 'secretaria') {
      navigate('/login');
    }
  }, [usuario, navigate]);

  if (!usuario || usuario.rol?.toLowerCase() !== 'secretaria') return null;

  const stats = calcularEstadisticasDelDia(servicios, clientes, tecnicos, repuestos);
  const sols = obtenerSolicitudesWeb();
  const pendientes = sols.filter(s => s.estado === 'pendiente');

  const disponibilidadOrden = useMemo(() => {
    if (!ordFecha) {
      return {
        disponibles: [],
        ocupados: [],
        totalActivos: 0,
        sinCupo: false,
        duracion: 0,
      };
    }

    return obtenerDisponibilidadTecnicos(ordFecha, ordHora, ordTipo);
  }, [ordFecha, ordHora, ordTipo, obtenerDisponibilidadTecnicos]);

  const limpiarFormularioOrden = () => {
    setOrdCliente('');
    setOrdTipo('');
    setOrdTecnico('');
    setOrdFecha('');
    setOrdHora('08:00');
    setOrdDiag('');
    setOrdPrecio('');
    setNcNombre('');
    setNcTel('');
    setNcDir('');
    setNcEmail('');
  };

  const crearOrden = async () => {
    if (guardandoOrden) return;

    setGuardandoOrden(true);
    setOrdenAlert({ tipo: '', msg: '' });
    setTempPassword('');

    try {
      let clienteId;
      let passwordTemporalGenerada = '';

      if (clienteTab === 'existente') {
        clienteId = parseInt(ordCliente);

        if (!clienteId) {
          setOrdenAlert({ tipo: 'error', msg: 'Selecciona un cliente.' });
          return;
        }
      } else {
        if (!ncNombre || !ncTel || !ncEmail) {
          setOrdenAlert({ tipo: 'error', msg: 'Completa nombre, teléfono y email.' });
          return;
        }

        const resCliente = await agregarClienteInterno({
          nombre: ncNombre,
          telefono: ncTel,
          direccion: ncDir,
          email: ncEmail,
        });

        if (!resCliente?.cliente?.id) {
          setOrdenAlert({ tipo: 'error', msg: 'No se pudo crear el cliente.' });
          return;
        }

        clienteId = resCliente.cliente.id;
        passwordTemporalGenerada = resCliente.passwordTemporal || '';
        setTempPassword(passwordTemporalGenerada);
      }

      if (!ordTipo || !ordFecha || !ordHora) {
        setOrdenAlert({ tipo: 'error', msg: 'Completa tipo, fecha y hora.' });
        return;
      }

      if (disponibilidadOrden.disponibles.length === 0) {
        setOrdenAlert({
          tipo: 'error',
          msg: 'No hay técnicos disponibles para la fecha y hora seleccionadas.'
        });
        return;
      }

      if (!ordTecnico) {
        setOrdenAlert({ tipo: 'error', msg: 'Selecciona un técnico disponible.' });
        return;
      }

      const tecnicoValido = disponibilidadOrden.disponibles.some(
        t => String(t.id) === String(ordTecnico)
      );

      if (!tecnicoValido) {
        setOrdenAlert({
          tipo: 'error',
          msg: 'El técnico seleccionado ya no está disponible para ese horario.'
        });
        return;
      }

      const nuevo = await agregarServicio({
        clienteId: Number(clienteId),
        tecnicoId: Number(ordTecnico),
        tipo: ordTipo,
        diagnostico: ordDiag || '',
        fechaServicio: ordFecha,
        hora: ordHora || '08:00',
        precioServicio: Number(ordPrecio) || 50000,
        notas: '',
        repuestos: [],
      });

      if (!nuevo || !nuevo.id || nuevo.id === 0) {
        setOrdenAlert({ tipo: 'error', msg: 'La orden no se guardó correctamente.' });
        return;
      }

      setOrdenAlert({
        tipo: 'exito',
        msg: passwordTemporalGenerada
          ? `Orden #${nuevo.id} creada correctamente. Contraseña temporal del cliente: ${passwordTemporalGenerada}`
          : `Orden #${nuevo.id} creada correctamente.`
      });

      limpiarFormularioOrden();
    } catch (e) {
      console.error('Error al crear orden:', e);
      setOrdenAlert({
        tipo: 'error',
        msg: e.message || 'Error al crear la orden. Intenta de nuevo.'
      });
    } finally {
      setGuardandoOrden(false);
    }
  };

  const abrirActualizar = (srv) => {
    setServActual(srv);
    setUpdEstado(srv.estado);
    setModalActualizar(true);
  };

  const guardarEstado = async () => {
    if (!servActual) return;

    try {
      await actualizarServicio(servActual.id, { estado: updEstado });
      setModalActualizar(false);
    } catch (e) {
      console.error('Error actualizando estado:', e);
    }
  };

  const guardarCliente = async () => {
    if (!mncNombre || !mncTel || !mncEmail) {
      setClAlert('Nombre, teléfono y email obligatorios.');
      return;
    }

    try {
      const res = await agregarClienteInterno({
        nombre: mncNombre,
        telefono: mncTel,
        direccion: mncDir,
        email: mncEmail
      });

      if (!res?.cliente?.id) {
        setClAlert('No se pudo guardar el cliente.');
        return;
      }

      setTempPasswordModal(res.passwordTemporal || '');
      setModalCliente(false);
      setMncNombre('');
      setMncTel('');
      setMncDir('');
      setMncEmail('');
      setClAlert('');
    } catch (e) {
      setClAlert(e.message || 'No se pudo guardar el cliente.');
    }
  };

  const convertirEnOrden = (sol) => {
    setSeccion('nuevaOrden');

    const clienteExistente = clientes.find(c =>
      (sol.email && c.email && c.email.toLowerCase() === sol.email.toLowerCase()) ||
      (sol.telefono && String(c.telefono) === String(sol.telefono))
    );

    if (clienteExistente) {
      setClienteTab('existente');
      setOrdCliente(String(clienteExistente.id));
    } else {
      setClienteTab('nuevo');
      setNcNombre(sol.nombre || '');
      setNcTel(sol.telefono || '');
      setNcDir(sol.direccion || '');
      setNcEmail(sol.email || '');
    }

    setOrdTipo(sol.tipo || '');
    setOrdFecha(sol.fechaSolicitud ? String(sol.fechaSolicitud).split('T')[0] : '');
    setOrdHora(sol.hora || '08:00');
    setOrdDiag(sol.problema || '');
    setOrdTecnico('');
    setOrdPrecio('');
    setOrdenAlert({ tipo: '', msg: '' });
    setTempPassword('');
  };

  const irA = (sec) => {
    setSeccion(sec);
    setOrdenAlert({ tipo: '', msg: '' });
    setTempPassword('');
  };

  const initials =
    usuario?.nombre?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'S';

  const kpis = [
    { label: 'Agendadas', valor: stats.agendados, icon: '📅', cls: 'blue' },
    { label: 'En Camino', valor: stats.enCamino, icon: '🛵', cls: 'green' },
    { label: 'En Reparación', valor: stats.enReparacion, icon: '🔧', cls: 'orange' },
    { label: 'Completadas', valor: stats.finalizados, icon: '✅', cls: 'teal' },
  ];

  return (
    <div className="ad-shell">
      <nav className="ad-nav">
        <div className="ad-nav-brand">
          <div className="ad-nav-logo">❄</div>
          <div>
            <span className="ad-nav-title">Refrimora</span>
            <span className="ad-nav-sub">Secretaría</span>
          </div>
        </div>

        <div className={`ad-nav-links ${menuOpen ? 'open' : ''}`}>
          {LINKS.map(l => (
            <button
              key={l.key}
              className={`ad-nav-link ${seccion === l.key ? 'active' : ''}`}
              onClick={() => {
                irA(l.key);
                setMenuOpen(false);
              }}
            >
              <span className="ad-nav-icon">{l.icon}</span>
              {l.label}
            </button>
          ))}
        </div>

        <div className="ad-nav-right">
          <div className="ad-nav-user">
            <div className="ad-nav-avatar" style={{ background: 'linear-gradient(135deg, #4ea3ff, #1f65ff)' }}>{initials}</div>
            <div className="ad-nav-userinfo">
              <span className="ad-nav-username">{usuario.nombre?.split(' ')[0]}</span>
              <span className="ad-nav-role">Secretaria</span>
            </div>
          </div>

          <button
            className="ad-nav-salir"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
          >
            Salir
          </button>

          <button className="ad-nav-hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Menú">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className="ad-body">
        {seccion === 'inicio' && (
          <div className="ad-section">
            <div className="ad-hero">
              <div className="ad-hero-glow" />
              <div className="ad-hero-left">
                <div className="ad-hero-avatar" style={{ background: 'linear-gradient(135deg, #4ea3ff, #1f65ff)' }}>{initials}</div>
                <div>
                  <h1 className="ad-hero-greeting">Bienvenida, {usuario.nombre.split(' ')[0]}</h1>
                  <p className="ad-hero-sub">Tus Órdenes Programadas para Hoy</p>
                </div>
              </div>

              {pendientes.length > 0 && (
                <button className="ad-hero-notif" onClick={() => irA('solicitudes')}>
                  <span className="ad-notif-dot" />
                  📨 {pendientes.length} solicitud{pendientes.length !== 1 ? 'es' : ''} web pendiente{pendientes.length !== 1 ? 's' : ''}
                </button>
              )}
            </div>

            <div className="ad-kpi-row">
              {kpis.map(k => (
                <div key={k.label} className={`ad-kpi-card ${k.cls}`}>
                  <div className="ad-kpi-icon">{k.icon}</div>
                  <div className="ad-kpi-num">{k.valor}</div>
                  <div className="ad-kpi-label">{k.label}</div>
                </div>
              ))}
            </div>

            <div className="ad-grid-main">
              <div className="ad-section" style={{ gap: 16 }}>
                <div className="ad-panel">
                  <div className="ad-panel-header">
                    <h3>Mis Órdenes de Servicio</h3>
                    <button className="ad-btn-main" onClick={() => irA('nuevaOrden')}>
                      + Nueva Orden
                    </button>
                  </div>

                  <div className="ad-table-wrap">
                    <TablaOrdenes
                      servicios={servicios.slice(-5).reverse()}
                      clientes={clientes}
                      tecnicos={tecnicos}
                      repuestos={repuestos}
                      onActualizar={abrirActualizar}
                    />
                  </div>
                </div>
              </div>

              <div className="ad-sidebar">
                <div className="ad-panel">
                  <div className="ad-panel-header">
                    <h3>Estado de la Orden</h3>
                  </div>
                  <Timeline estadoActivo="agendado" />
                </div>

                <div className="ad-panel">
                  <div className="ad-panel-header">
                    <h3>Resumen del Día</h3>
                  </div>
                  <div className="ad-panel-body">
                    <ResumenDia stats={stats} />
                  </div>
                </div>

                <div className="ad-panel">
                  <div className="ad-panel-header">
                    <h3>Solicitudes Web</h3>
                    {pendientes.length > 0 && (
                      <span
                        style={{
                          background: '#ff5a5a',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 'bold',
                          boxShadow: '0 0 10px rgba(255, 90, 90, 0.4)'
                        }}
                      >
                        {pendientes.length}
                      </span>
                    )}
                  </div>

                  <div className="ad-panel-body" style={{ padding: 12 }}>
                    {pendientes.length === 0 ? (
                      <p style={{ color: '#5e7e9e', fontSize: 13, textAlign: 'center', margin: '10px 0' }}>Sin solicitudes pendientes</p>
                    ) : (
                      pendientes.slice(0, 3).map(s => (
                        <div
                          key={s.id}
                          style={{
                            borderBottom: '1px solid rgba(123, 178, 255, 0.1)',
                            padding: '8px 0',
                            fontSize: 13,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8
                          }}
                        >
                          <div>
                            <strong style={{ color: '#e2ecf8' }}>{s.nombre}</strong>
                            <span style={{ color: '#7a96b8', marginLeft: 4 }}>— {s.tipo}</span>
                          </div>
                          <button
                            className="ad-btn-sm"
                            onClick={() => convertirEnOrden(s)}
                          >
                            Crear orden
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {seccion === 'nuevaOrden' && (
          <div className="ad-section">
            <div style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
              <div className="ad-panel">
                <div className="ad-panel-header">
                  <h3>📋 Crear Nueva Orden de Servicio</h3>
                </div>

                <div className="ad-panel-body">
                  {ordenAlert.msg && (
                    <div className={`alert alert-${ordenAlert.tipo}`}>
                      {ordenAlert.tipo === 'error' ? '⚠️' : '✅'} {ordenAlert.msg}
                    </div>
                  )}

                  <div className="tabs">
                    <button
                      className={`tab-btn ${clienteTab === 'existente' ? 'active' : ''}`}
                      onClick={() => setClienteTab('existente')}
                    >
                      Cliente existente
                    </button>
                    <button
                      className={`tab-btn ${clienteTab === 'nuevo' ? 'active' : ''}`}
                      onClick={() => setClienteTab('nuevo')}
                    >
                      Nuevo cliente
                    </button>
                  </div>

                  {clienteTab === 'existente' ? (
                    <div className="form-group">
                      <label>Seleccionar cliente</label>
                      <select value={ordCliente} onChange={e => setOrdCliente(e.target.value)}>
                        <option value="">Seleccionar...</option>
                        {clientes.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.nombre} — {c.telefono}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Nombre completo *</label>
                          <input value={ncNombre} onChange={e => setNcNombre(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Teléfono *</label>
                          <input value={ncTel} onChange={e => setNcTel(e.target.value)} />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Dirección</label>
                        <input value={ncDir} onChange={e => setNcDir(e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label>Email *</label>
                        <input type="email" value={ncEmail} onChange={e => setNcEmail(e.target.value)} />
                      </div>
                    </>
                  )}

                  <hr style={{ border: 'none', borderTop: '1px solid rgba(123, 178, 255, 0.15)', margin: '16px 0' }} />

                  <div className="form-row">
                    <div className="form-group">
                      <label>Tipo de servicio *</label>
                      <select
                        value={ordTipo}
                        onChange={e => {
                          setOrdTipo(e.target.value);
                          setOrdTecnico('');
                        }}
                      >
                        <option value="">Seleccionar...</option>
                        {['Mantenimiento', 'Reparación', 'Recarga', 'Instalación', 'Revisión'].map(t => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Técnico asignado *</label>
                      <select
                        value={ordTecnico}
                        onChange={e => setOrdTecnico(e.target.value)}
                        disabled={!ordTipo || !ordFecha || !ordHora || disponibilidadOrden.disponibles.length === 0}
                      >
                        <option value="">Seleccionar...</option>
                        {disponibilidadOrden.disponibles.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Fecha *</label>
                      <input
                        type="date"
                        value={ordFecha}
                        onChange={e => {
                          setOrdFecha(e.target.value);
                          setOrdTecnico('');
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Hora *</label>
                      <input
                        type="time"
                        value={ordHora}
                        onChange={e => {
                          setOrdHora(e.target.value);
                          setOrdTecnico('');
                        }}
                      />
                    </div>
                  </div>

                  {ordFecha && (
                    <div className="ad-panel" style={{ marginBottom: 16, background: 'rgba(8, 18, 32, 0.55)' }}>
                      <div className="ad-panel-body" style={{ padding: 14 }}>
                        {!ordTipo ? (
                          <p style={{ margin: 0, color: '#9ab3cc' }}>
                            Selecciona el tipo de servicio para calcular la duración del trabajo.
                          </p>
                        ) : !ordHora ? (
                          <p style={{ margin: 0, color: '#9ab3cc' }}>
                            Selecciona la hora para validar los técnicos disponibles.
                          </p>
                        ) : (
                          <>
                            <p style={{ margin: '0 0 10px 0', color: '#d9e7f5', fontWeight: 600 }}>
                              Disponibilidad para {formatearFecha(ordFecha)} a las {ordHora}
                            </p>

                            {disponibilidadOrden.disponibles.length > 0 ? (
                              <div style={{ marginBottom: 8, color: '#74d39a' }}>
                                ✅ Disponibles: {disponibilidadOrden.disponibles.map(t => t.nombre).join(', ')}
                              </div>
                            ) : (
                              <div style={{ marginBottom: 8, color: '#ff7b7b' }}>
                                ❌ No hay técnicos disponibles para este horario.
                              </div>
                            )}

                            {disponibilidadOrden.ocupados.length > 0 && (
                              <div style={{ color: '#9ab3cc' }}>
                                Ocupados en ese intervalo: {disponibilidadOrden.ocupados.map(t => t.nombre).join(', ')}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Diagnóstico inicial</label>
                    <textarea
                      value={ordDiag}
                      onChange={e => setOrdDiag(e.target.value)}
                      placeholder="Describe el problema..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Precio del servicio (COP)</label>
                    <input
                      type="number"
                      value={ordPrecio}
                      onChange={e => setOrdPrecio(e.target.value)}
                      placeholder="Ej: 80000"
                      min="0"
                    />
                  </div>

                  <div className="form-actions">
                    <button className="ad-btn-sm" onClick={() => irA('inicio')}>
                      Cancelar
                    </button>
                    <button className="ad-btn-main" onClick={crearOrden} disabled={guardandoOrden}>
                      {guardandoOrden ? 'Guardando...' : 'Crear Orden de Servicio'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {seccion === 'ordenes' && (
          <div className="ad-section">
            <div className="ad-panel">
              <div className="ad-panel-header">
                <h3>Todas las Órdenes</h3>
              </div>
              <div className="ad-table-wrap">
                <TablaOrdenes
                  servicios={servicios}
                  clientes={clientes}
                  tecnicos={tecnicos}
                  repuestos={repuestos}
                  onActualizar={abrirActualizar}
                />
              </div>
            </div>
          </div>
        )}

        {seccion === 'clientes' && (
          <div className="ad-section">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
              <button className="ad-btn-main" onClick={() => setModalCliente(true)}>
                + Registrar Cliente
              </button>
            </div>

            <div className="ad-panel">
              <div className="ad-panel-header">
                <h3>Clientes Registrados</h3>
              </div>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Cliente</th>
                      <th>Teléfono</th>
                      <th>Dirección</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map(c => (
                      <tr key={c.id}>
                        <td className="ad-id">#{c.id}</td>
                        <td>
                          <div className="ad-td-user">
                            <AvatarCliente nombre={c.nombre} />
                          </div>
                        </td>
                        <td>{c.telefono}</td>
                        <td className="ad-muted">{c.direccion}</td>
                        <td className="ad-muted">{c.email || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {tempPasswordModal && (
              <div className="alert alert-success" style={{ marginTop: 14 }}>
                ✅ Cliente registrado correctamente. Contraseña temporal: <strong>{tempPasswordModal}</strong>
              </div>
            )}
          </div>
        )}

        {seccion === 'solicitudes' && (
          <div className="ad-section">
            <div className="ad-panel">
              <div className="ad-panel-header">
                <h3>Solicitudes Recibidas desde la Web</h3>
              </div>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Teléfono</th>
                      <th>Email</th>
                      <th>Tipo</th>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Problema</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sols.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="ad-empty-row">
                          No hay solicitudes
                        </td>
                      </tr>
                    ) : (
                      sols.map(s => (
                        <tr key={s.id}>
                          <td><strong style={{ color: '#e2ecf8' }}>{s.nombre}</strong></td>
                          <td>{s.telefono}</td>
                          <td className="ad-muted">{s.email || '—'}</td>
                          <td>{s.tipo}</td>
                          <td>{formatearFecha(s.fechaSolicitud)}</td>
                          <td>{s.hora || '—'}</td>
                          <td className="ad-muted">{s.diagnostico || s.problema || '—'}</td>
                          <td>
                            <button className="ad-btn-sm" onClick={() => convertirEnOrden(s)}>
                              Crear orden
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {seccion === 'repuestos' && (
          <div className="ad-section">
            <div className="ad-panel">
              <div className="ad-panel-header">
                <h3>Inventario de Repuestos</h3>
              </div>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Ícono</th>
                      <th>Nombre</th>
                      <th>Código</th>
                      <th>Precio</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repuestos.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontSize: 22, textAlign: 'center' }}>{r.icono}</td>
                        <td><strong style={{ color: '#e2ecf8' }}>{r.nombre}</strong></td>
                        <td className="ad-muted">{r.codigo}</td>
                        <td className="ad-money">{formatearPeso(r.precio)}</td>
                        <td>{r.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {modalActualizar && (
        <Modal
          titulo="Actualizar Estado del Servicio"
          onClose={() => setModalActualizar(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalActualizar(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={guardarEstado}>
                Guardar
              </button>
            </>
          }
        >
          <div className="form-group">
            <label>Nuevo estado</label>
            <select value={updEstado} onChange={e => setUpdEstado(e.target.value)}>
              <option value="agendado">Agendado</option>
              <option value="en-camino">En Camino</option>
              <option value="en-reparacion">En Reparación</option>
              <option value="finalizado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </Modal>
      )}

      {modalCliente && (
        <Modal
          titulo="Registrar Nuevo Cliente"
          onClose={() => setModalCliente(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalCliente(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={guardarCliente}>
                Guardar
              </button>
            </>
          }
        >
          {clAlert && <div className="alert alert-error">⚠️ {clAlert}</div>}

          <div className="form-row">
            <div className="form-group">
              <label>Nombre *</label>
              <input value={mncNombre} onChange={e => setMncNombre(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Teléfono *</label>
              <input value={mncTel} onChange={e => setMncTel(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Dirección</label>
            <input value={mncDir} onChange={e => setMncDir(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input type="email" value={mncEmail} onChange={e => setMncEmail(e.target.value)} />
          </div>
        </Modal>
      )}
    </div>
  );
}

function TablaOrdenes({ servicios, clientes, tecnicos, repuestos, onActualizar }) {
  return (
    <table className="ad-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Cliente</th>
          <th>Técnico</th>
          <th>Tipo</th>
          <th>Fecha</th>
          <th>Estado</th>
          <th>Total</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
        {servicios.length === 0 ? (
          <tr>
            <td colSpan={8} className="ad-empty-row">
              No hay órdenes registradas.
            </td>
          </tr>
        ) : (
          servicios.map(sv => {
            const nombreCliente =
              sv.clienteNombre || clientes.find(c => String(c.id) === String(sv.clienteId))?.nombre || '—';

            const nombreTecnico =
              sv.tecnicoNombre || tecnicos.find(t => String(t.id) === String(sv.tecnicoId))?.nombre || '—';

            return (
              <tr key={sv.id}>
                <td className="ad-id">#{sv.id}</td>
                <td>
                  <div className="ad-td-user">
                    <AvatarCliente nombre={nombreCliente} />
                  </div>
                </td>
                <td>{nombreTecnico}</td>
                <td>{sv.tipo}</td>
                <td className="ad-muted">{formatearFecha(sv.fechaServicio)} {sv.hora}</td>
                <td><EstadoBadge estado={sv.estado} /></td>
                <td className="ad-money">{formatearPeso(totalServicio(sv, repuestos))}</td>
                <td>
                  <button className="ad-btn-sm" onClick={() => onActualizar(sv)}>
                    Actualizar
                  </button>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}