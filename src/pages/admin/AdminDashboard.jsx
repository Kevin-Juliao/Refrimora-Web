import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useApp,
  calcularEstadisticasDelDia,
  formatearPeso,
  formatearFecha,
  totalServicio,
  generarPassword
} from '../../context/AppContext';
import ResumenDia from '../../components/counters/ResumenDia';
import RepuestosPanel from '../../components/repuestos/RepuestosPanel';
import Modal from '../../components/layout/Modal';
import AvatarCliente from '../../components/cliente/AvatarCliente';
import EstadoBadge from '../../components/badges/EstadoBadge';

const LINKS = [
  { key: 'inicio',      label: 'Inicio',           icon: '🏠' },
  { key: 'servicios',   label: 'Órdenes',           icon: '📋' },
  { key: 'clientes',    label: 'Clientes',          icon: '👥' },
  { key: 'repuestos',   label: 'Inventario',        icon: '🔩' },
  { key: 'tecnicos',    label: 'Técnicos',          icon: '🧑‍🔧' },
  { key: 'solicitudes', label: 'Solicitudes Web',   icon: '📨' },
];

function normalizarRol(valor) {
  const v = String(valor || '').trim().toLowerCase();
  if (v === 'administrador' || v === 'admin') return 'admin';
  if (v === 'secretaria'    || v === 'secretaría') return 'secretaria';
  if (v === 'tecnico'       || v === 'técnico') return 'tecnico';
  if (v === 'cliente') return 'cliente';
  return v;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    usuario, clientes, repuestos, servicios, tecnicos,
    logout, agregarCliente, agregarTecnico,
    toggleDisponible, actualizarPrecioRepuesto, obtenerSolicitudesWeb
  } = useApp();

  const [seccion, setSeccion] = useState('inicio');
  const [menuOpen, setMenuOpen] = useState(false);

  const [modalTecnico, setModalTecnico] = useState(false);
  const [modalPrecio,  setModalPrecio]  = useState(false);
  const [modalCliente, setModalCliente] = useState(false);

  const [tecNombre,  setTecNombre]  = useState('');
  const [tecCorreo,  setTecCorreo]  = useState('');
  const [tecUsuario, setTecUsuario] = useState('');
  const [tecPass,    setTecPass]    = useState('');
  const [tecAlert,   setTecAlert]   = useState('');

  const [epRep,  setEpRep]  = useState('');
  const [epNuevo, setEpNuevo] = useState('');

  const [ncNombre, setNcNombre] = useState('');
  const [ncTel,    setNcTel]    = useState('');
  const [ncDir,    setNcDir]    = useState('');
  const [ncEmail,  setNcEmail]  = useState('');
  const [clAlert,  setClAlert]  = useState('');

  useEffect(() => {
    if (!usuario || normalizarRol(usuario.rol) !== 'admin') {
      navigate('/login', { replace: true });
    }
  }, [usuario, navigate]);

  if (!usuario || normalizarRol(usuario.rol) !== 'admin') return null;

  const stats = calcularEstadisticasDelDia(servicios, clientes, tecnicos, repuestos);
  const sols   = obtenerSolicitudesWeb();
  const hoy    = new Date().toISOString().split('T')[0];

  const initials =
    usuario.nombre?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'A';

  const generarCreds = () => {
    if (!tecNombre) { setTecAlert('Escribe el nombre primero.'); return; }
    setTecUsuario(tecNombre.split(' ')[0].toLowerCase() + '@refrimora.com');
    setTecPass(generarPassword(tecNombre));
    setTecAlert('');
  };

  const crearTecnico = async () => {
    if (!tecNombre) { setTecAlert('Ingresa el nombre.'); return; }
    await agregarTecnico({
      nombre: tecNombre,
      correo: tecUsuario || tecCorreo,
      password: tecPass || 'tec123'
    });
    setModalTecnico(false);
    setTecNombre(''); setTecCorreo(''); setTecUsuario(''); setTecPass(''); setTecAlert('');
  };

  const guardarPrecio = async () => {
    if (!epRep || !epNuevo) { alert('Selecciona repuesto e ingresa precio.'); return; }
    await actualizarPrecioRepuesto(parseInt(epRep), parseInt(epNuevo));
    setModalPrecio(false);
    setEpRep(''); setEpNuevo('');
  };

  const guardarCliente = async () => {
    if (!ncNombre || !ncTel) { setClAlert('Nombre y teléfono obligatorios.'); return; }
    try {
      const res = await agregarCliente({
        nombre: ncNombre, telefono: ncTel, direccion: ncDir, email: ncEmail
      });
      if (res?.duplicado) { setClAlert('Ese cliente ya estaba registrado.'); return; }
      setModalCliente(false);
      setNcNombre(''); setNcTel(''); setNcDir(''); setNcEmail(''); setClAlert('');
    } catch (e) {
      setClAlert(e.message || 'No se pudo guardar el cliente.');
    }
  };

  const kpis = [
    { label: 'Total órdenes',    valor: servicios.length,                                                         icon: '📋', cls: 'blue'   },
    { label: 'En curso',         valor: servicios.filter(s => !['finalizado','cancelado'].includes(s.estado)).length, icon: '🔧', cls: 'orange' },
    { label: 'Clientes',         valor: clientes.length,                                                           icon: '👥', cls: 'teal'   },
    { label: 'Técnicos activos', valor: tecnicos.filter(t => t.disponible).length,                                icon: '🧑‍🔧', cls: 'green'  },
  ];

  return (
    <div className="ad-shell">
      {/* ── NAV ── */}
      <nav className="ad-nav">
        <div className="ad-nav-brand">
          <div className="ad-nav-logo">❄</div>
          <div>
            <span className="ad-nav-title">Refrimora</span>
            <span className="ad-nav-sub">Administrador</span>
          </div>
        </div>

        <div className={`ad-nav-links ${menuOpen ? 'open' : ''}`}>
          {LINKS.map(l => (
            <button
              key={l.key}
              className={`ad-nav-link ${seccion === l.key ? 'active' : ''}`}
              onClick={() => { setSeccion(l.key); setMenuOpen(false); }}
            >
              <span className="ad-nav-icon">{l.icon}</span>
              {l.label}
            </button>
          ))}
        </div>

        <div className="ad-nav-right">
          <div className="ad-nav-user">
            <div className="ad-nav-avatar">{initials}</div>
            <div className="ad-nav-userinfo">
              <span className="ad-nav-username">{usuario.nombre?.split(' ')[0]}</span>
              <span className="ad-nav-role">Admin</span>
            </div>
          </div>
          <button className="ad-nav-salir" onClick={() => { logout(); navigate('/login', { replace: true }); }}>
            Salir
          </button>
          <button className="ad-nav-hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Menú">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ── BODY ── */}
      <div className="ad-body">

        {/* ── INICIO ── */}
        {seccion === 'inicio' && (
          <div className="ad-section">
            <div className="ad-hero">
              <div className="ad-hero-glow" />
              <div className="ad-hero-left">
                <div className="ad-hero-avatar">{initials}</div>
                <div>
                  <h1 className="ad-hero-greeting">Panel de Administrador</h1>
                  <p className="ad-hero-sub">
                    Resumen general del negocio ·{' '}
                    {new Date().toLocaleDateString('es-CO', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              {sols.length > 0 && (
                <button className="ad-hero-notif" onClick={() => setSeccion('solicitudes')}>
                  <span className="ad-notif-dot" />
                  📨 {sols.length} solicitud{sols.length !== 1 ? 'es' : ''} web pendiente{sols.length !== 1 ? 's' : ''}
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
              <div className="ad-panel">
                <div className="ad-panel-header">
                  <h3>Órdenes recientes</h3>
                  <button className="ad-btn-xs" onClick={() => setSeccion('servicios')}>Ver todas →</button>
                </div>
                <div className="ad-table-wrap">
                  <TablaServicios
                    servicios={[...servicios].reverse().slice(0, 5)}
                    clientes={clientes}
                    tecnicos={tecnicos}
                    repuestos={repuestos}
                  />
                </div>
              </div>

              <div className="ad-sidebar">
                <div className="ad-panel">
                  <div className="ad-panel-header"><h3>Estado técnicos</h3></div>
                  <div className="ad-panel-body">
                    <TablaTecnicosDash tecnicos={tecnicos} servicios={servicios} hoy={hoy} />
                  </div>
                </div>
                <div className="ad-panel">
                  <div className="ad-panel-header"><h3>Resumen del día</h3></div>
                  <div className="ad-panel-body"><ResumenDia stats={stats} /></div>
                </div>
                <div className="ad-panel">
                  <div className="ad-panel-header"><h3>Repuestos</h3></div>
                  <div className="ad-panel-body"><RepuestosPanel repuestos={repuestos} /></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SERVICIOS ── */}
        {seccion === 'servicios' && (
          <div className="ad-section">
            <div className="ad-page-header">
              <h2 className="ad-page-title">Todas las órdenes</h2>
              <p className="ad-page-sub">{servicios.length} órdenes registradas en total.</p>
            </div>
            <div className="ad-panel">
              <div className="ad-table-wrap">
                <TablaServicios
                  servicios={[...servicios].reverse()}
                  clientes={clientes}
                  tecnicos={tecnicos}
                  repuestos={repuestos}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── CLIENTES ── */}
        {seccion === 'clientes' && (
          <div className="ad-section">
            <div className="ad-page-header">
              <div>
                <h2 className="ad-page-title">Clientes registrados</h2>
                <p className="ad-page-sub">{clientes.length} clientes en total.</p>
              </div>
              <button className="ad-btn-main" onClick={() => setModalCliente(true)}>+ Nuevo cliente</button>
            </div>
            <div className="ad-panel">
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Cliente</th><th>Teléfono</th>
                      <th>Dirección</th><th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map(c => (
                      <tr key={c.id}>
                        <td className="ad-id">{c.id}</td>
                        <td><div className="ad-td-user"><AvatarCliente nombre={c.nombre} /></div></td>
                        <td>{c.telefono}</td>
                        <td className="ad-muted">{c.direccion}</td>
                        <td className="ad-muted">{c.email || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── REPUESTOS ── */}
        {seccion === 'repuestos' && (
          <div className="ad-section">
            <div className="ad-page-header">
              <div>
                <h2 className="ad-page-title">Inventario de repuestos</h2>
                <p className="ad-page-sub">{repuestos.length} repuestos registrados.</p>
              </div>
              <button className="ad-btn-main" onClick={() => setModalPrecio(true)}>✏️ Editar precio</button>
            </div>
            <div className="ad-panel">
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr><th>Ícono</th><th>Nombre</th><th>Código</th><th>Precio</th><th>Stock</th></tr>
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

        {/* ── TÉCNICOS ── */}
        {seccion === 'tecnicos' && (
          <div className="ad-section">
            <div className="ad-page-header">
              <div>
                <h2 className="ad-page-title">Equipo técnico</h2>
                <p className="ad-page-sub">
                  {tecnicos.length} técnicos registrados · {tecnicos.filter(t => t.disponible).length} disponibles ahora.
                </p>
              </div>
              <button className="ad-btn-main" onClick={() => setModalTecnico(true)}>+ Nuevo técnico</button>
            </div>
            <div className="ad-panel">
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr><th>Técnico</th><th>Correo</th><th>Disponible</th><th>Órd. hoy</th><th>Acción</th></tr>
                  </thead>
                  <tbody>
                    {tecnicos.map(t => {
                      const ordHoy = servicios.filter(
                        s => String(s.tecnicoId) === String(t.id) &&
                             String(s.fechaServicio) === hoy
                      ).length;
                      return (
                        <tr key={t.id}>
                          <td><div className="ad-td-user"><AvatarCliente nombre={t.nombre} /></div></td>
                          <td className="ad-muted">{t.correo}</td>
                          <td>
                            <span className={`ad-badge ${t.disponible ? 'green' : 'red'}`}>
                              {t.disponible ? '● Disponible' : '● Ocupado'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>{ordHoy}</td>
                          <td>
                            <button className="ad-btn-sm" onClick={() => toggleDisponible(t.id)}>
                              Cambiar estado
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── SOLICITUDES ── */}
        {seccion === 'solicitudes' && (
          <div className="ad-section">
            <div className="ad-page-header">
              <div>
                <h2 className="ad-page-title">Solicitudes desde la web</h2>
                <p className="ad-page-sub">
                  {sols.length} solicitud{sols.length !== 1 ? 'es' : ''} recibida{sols.length !== 1 ? 's' : ''} desde el portal cliente.
                </p>
              </div>
            </div>
            <div className="ad-panel">
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr><th>Nombre</th><th>Teléfono</th><th>Dirección</th><th>Tipo</th><th>Fecha pref.</th><th>Hora</th><th>Enviada</th></tr>
                  </thead>
                  <tbody>
                    {sols.length === 0 ? (
                      <tr><td colSpan={6} className="ad-empty-row">No hay solicitudes aún.</td></tr>
                    ) : (
                      sols.map(s => (
                        <tr key={s.id}>
                          <td><strong style={{ color: '#e2ecf8' }}>{s.nombre}</strong></td>
                          <td>{s.telefono}</td>
                          <td className="ad-muted">{s.direccion}</td>
                          <td>{s.tipo}</td>
                          <td>{formatearFecha(s.fechaSolicitud)}</td>
                          <td>{s.hora || '—'}</td>
                          <td className="ad-muted">{s.fechaEnvio}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL TÉCNICO ── */}
      {modalTecnico && (
        <Modal
          titulo="Crear nuevo técnico"
          onClose={() => setModalTecnico(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalTecnico(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={crearTecnico}>Crear técnico</button>
            </>
          }
        >
          {tecAlert && <div className="alert alert-error">{tecAlert}</div>}
          <div className="form-group">
            <label>Nombre completo</label>
            <input value={tecNombre} onChange={e => setTecNombre(e.target.value)} placeholder="Nombre" />
          </div>
          <div className="form-group">
            <label>Correo electrónico</label>
            <input value={tecCorreo} onChange={e => setTecCorreo(e.target.value)} placeholder="tecnico@refrimora.com" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Usuario generado</label>
              <input value={tecUsuario} readOnly style={{ background: '#f4f6f8' }} />
            </div>
            <div className="form-group">
              <label>Contraseña generada</label>
              <input value={tecPass} readOnly style={{ background: '#f4f6f8' }} />
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={generarCreds}>
            Generar credenciales
          </button>
        </Modal>
      )}

      {/* ── MODAL PRECIO ── */}
      {modalPrecio && (
        <Modal
          titulo="Editar precio de repuesto"
          onClose={() => setModalPrecio(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalPrecio(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarPrecio}>Guardar</button>
            </>
          }
        >
          <div className="form-group">
            <label>Seleccionar repuesto</label>
            <select value={epRep} onChange={e => setEpRep(e.target.value)}>
              <option value="">Seleccionar...</option>
              {repuestos.map(r => (
                <option key={r.id} value={r.id}>{r.icono} {r.nombre}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Precio actual</label>
              <input
                value={epRep ? formatearPeso(repuestos.find(r => r.id === parseInt(epRep))?.precio || 0) : ''}
                readOnly
                style={{ background: '#f4f6f8' }}
              />
            </div>
            <div className="form-group">
              <label>Nuevo precio (COP)</label>
              <input type="number" value={epNuevo} onChange={e => setEpNuevo(e.target.value)} min={0} />
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL CLIENTE ── */}
      {modalCliente && (
        <Modal
          titulo="Registrar nuevo cliente"
          onClose={() => setModalCliente(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalCliente(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarCliente}>Guardar cliente</button>
            </>
          }
        >
          {clAlert && <div className="alert alert-error">{clAlert}</div>}
          <div className="form-row">
            <div className="form-group">
              <label>Nombre</label>
              <input value={ncNombre} onChange={e => setNcNombre(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input value={ncTel} onChange={e => setNcTel(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Dirección</label>
            <input value={ncDir} onChange={e => setNcDir(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={ncEmail} onChange={e => setNcEmail(e.target.value)} />
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────── */
function TablaServicios({ servicios, clientes, tecnicos, repuestos }) {
  return (
    <table className="ad-table">
      <thead>
        <tr>
          <th>#</th><th>Cliente</th><th>Dirección</th>
          <th>Técnico</th><th>Tipo</th><th>Fecha</th><th>Estado</th><th>Total</th>
        </tr>
      </thead>
      <tbody>
        {servicios.length === 0 ? (
          <tr><td colSpan={8} className="ad-empty-row">Sin órdenes registradas.</td></tr>
        ) : (
          servicios.map(sv => {
            const cl = clientes.find(c => String(c.id) === String(sv.clienteId));
            const nombreCliente  = sv.clienteNombre  || cl?.nombre  || '—';
            const nombreTecnico  = sv.tecnicoNombre  ||
              tecnicos.find(t => String(t.id) === String(sv.tecnicoId))?.nombre || '—';
            const direccion = cl?.direccion || sv.direccionCliente || '—';

            return (
              <tr key={sv.id}>
                <td className="ad-id">{sv.id}</td>
                <td><div className="ad-td-user"><AvatarCliente nombre={nombreCliente} /></div></td>
                <td className="ad-muted">{direccion}</td>
                <td>{nombreTecnico}</td>
                <td>{sv.tipo}</td>
                <td className="ad-muted">{formatearFecha(sv.fechaServicio)} {sv.hora}</td>
                <td><EstadoBadge estado={sv.estado} /></td>
                <td className="ad-money">{formatearPeso(totalServicio(sv, repuestos))}</td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

/* ─────────────────────────────────────────── */
function TablaTecnicosDash({ tecnicos, servicios, hoy }) {
  return (
    <table className="ad-table">
      <thead>
        <tr><th>Técnico</th><th>Estado</th><th>Hoy</th></tr>
      </thead>
      <tbody>
        {tecnicos.map(t => {
          const ordHoy = servicios.filter(
            s => String(s.tecnicoId) === String(t.id) &&
                 String(s.fechaServicio) === hoy
          ).length;
          return (
            <tr key={t.id}>
              <td><div className="ad-td-user"><AvatarCliente nombre={t.nombre} /></div></td>
              <td>
                <span className={`ad-badge ${t.disponible ? 'green' : 'red'}`}>
                  {t.disponible ? '● Disponible' : '● Ocupado'}
                </span>
              </td>
              <td style={{ textAlign: 'center' }}>{ordHoy}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
