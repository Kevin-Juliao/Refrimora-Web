import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, calcularEstadisticas, formatearPeso, formatearFecha, totalServicio } from '../../context/AppContext';
import Contadores from "../../components/counters/Contadores";
import ResumenDia from "../../components/counters/ResumenDia";
import Timeline from "../../components/timeline/Timeline";
import RepuestosPanel from "../../components/repuestos/RepuestosPanel";
import Modal from "../../components/layout/Modal";
import DashboardNav from "../../components/layout/DashboardNav";
import AvatarCliente from '../../components/cliente/AvatarCliente';
import EstadoBadge from '../../components/badges/EstadoBadge';

const LINKS = [
  { key: 'inicio',      label: 'Inicio'           },
  { key: 'nuevaOrden',  label: 'Nueva Orden'      },
  { key: 'ordenes',     label: 'Órdenes'          },
  { key: 'clientes',    label: 'Clientes'         },
  { key: 'solicitudes', label: 'Solicitudes Web'  },
  { key: 'repuestos',   label: 'Inventario'       },
];

export default function SecretariaDashboard() {
  const navigate = useNavigate();
  const { usuario, clientes, repuestos, servicios, tecnicos,
          logout, agregarCliente, agregarServicio, actualizarServicio,
          obtenerSolicitudesWeb } = useApp();

  const [seccion, setSeccion] = useState('inicio');

  // Nueva orden
  const [clienteTab, setClienteTab] = useState('existente');
  const [ordCliente, setOrdCliente] = useState('');
  const [ncNombre,   setNcNombre]   = useState('');
  const [ncTel,      setNcTel]      = useState('');
  const [ncDir,      setNcDir]      = useState('');
  const [ncEmail,    setNcEmail]    = useState('');
  const [ordTipo,    setOrdTipo]    = useState('');
  const [ordTecnico, setOrdTecnico] = useState('');
  const [ordFecha,   setOrdFecha]   = useState('');
  const [ordHora,    setOrdHora]    = useState('08:00');
  const [ordDiag,    setOrdDiag]    = useState('');
  const [ordPrecio,  setOrdPrecio]  = useState('');
  const [ordenAlert, setOrdenAlert] = useState({ tipo: '', msg: '' });

  // Modal actualizar estado
  const [modalActualizar, setModalActualizar] = useState(false);
  const [servActual,      setServActual]      = useState(null);
  const [updEstado,       setUpdEstado]       = useState('agendado');

  // Modal nuevo cliente
  const [modalCliente, setModalCliente] = useState(false);
  const [mncNombre,    setMncNombre]    = useState('');
  const [mncTel,       setMncTel]       = useState('');
  const [mncDir,       setMncDir]       = useState('');
  const [mncEmail,     setMncEmail]     = useState('');
  const [clAlert,      setClAlert]      = useState('');

 if (!usuario || usuario.rol.toLowerCase() !== 'secretaria') navigate('/login');

  const stats = calcularEstadisticas(servicios, clientes, tecnicos, repuestos);
  const sols  = obtenerSolicitudesWeb();
  const pendientes = sols.filter(s => s.estado === 'pendiente');

  const crearOrden = async () => {
    let clienteId;

    if (clienteTab === 'existente') {
      clienteId = parseInt(ordCliente);
      if (!clienteId) {
        setOrdenAlert({ tipo: 'error', msg: 'Selecciona un cliente.' });
        return;
      }
    } else {
      if (!ncNombre || !ncTel) {
        setOrdenAlert({ tipo: 'error', msg: 'Completa nombre y teléfono.' });
        return;
      }
      const nuevoCliente = await agregarCliente({
        nombre: ncNombre,
        telefono: ncTel,
        direccion: ncDir,
        email: ncEmail,
      });
      clienteId = nuevoCliente.id;
    }

    if (!ordTipo || !ordTecnico || !ordFecha) {
      setOrdenAlert({ tipo: 'error', msg: 'Completa tipo, técnico y fecha.' });
      return;
    }

    try {
      const nuevo = await agregarServicio({
        clienteId: String(clienteId),          
        tecnicoId: String(ordTecnico),          
        tipo: ordTipo,                         
        diagnostico: ordDiag || '',             
        fecha: ordFecha,                        
        hora: ordHora || '08:00',               
        precioServicio: Number(ordPrecio) || 50000,
      });

      setOrdenAlert({ tipo: 'exito', msg: `Orden #${nuevo.id} creada correctamente.` });

      // Limpiar formulario
      setOrdCliente(''); setOrdTipo(''); setOrdTecnico('');
      setOrdFecha(''); setOrdHora('08:00'); setOrdDiag(''); setOrdPrecio('');
      setNcNombre(''); setNcTel(''); setNcDir(''); setNcEmail('');

    } catch (e) {
      console.error('Error al crear orden:', e);
      setOrdenAlert({ tipo: 'error', msg: 'Error al crear la orden. Intenta de nuevo.' });
    }
  };
  const abrirActualizar = (srv) => {
    setServActual(srv); setUpdEstado(srv.estado); setModalActualizar(true);
  };

  const guardarEstado = () => {
    if (!servActual) return;
    actualizarServicio(servActual.id, { estado: updEstado });
    setModalActualizar(false);
  };

  const guardarCliente = () => {
    if (!mncNombre || !mncTel) { setClAlert('Nombre y teléfono obligatorios.'); return; }
    agregarCliente({ nombre: mncNombre, telefono: mncTel, direccion: mncDir, email: mncEmail });
    setModalCliente(false);
    setMncNombre(''); setMncTel(''); setMncDir(''); setMncEmail(''); setClAlert('');
  };

  const convertirEnOrden = (sol) => {
    setSeccion('nuevaOrden');
    setClienteTab('nuevo');
    setNcNombre(sol.nombre); setNcTel(sol.telefono); setNcDir(sol.direccion);
    setNcEmail(sol.email || '');
    setOrdTipo(sol.tipo || ''); setOrdFecha(sol.fecha || ''); setOrdDiag(sol.diagnostico || sol.problema || '');
  };

  const irA = (sec) => { setSeccion(sec); setOrdenAlert({ tipo: '', msg: '' }); };

  return (
    <>
      <DashboardNav links={LINKS} seccion={seccion} onSeccion={irA}
        usuario={usuario} onLogout={() => { logout(); navigate('/login'); }} />

      <div className="page-wrapper">

        {seccion === 'inicio' && (
          <div className="page-section active">
            <div className="welcome-banner" style={{ marginBottom: 20 }}>
              <div>
                <h2>Bienvenida, {usuario.nombre.split(' ')[0]}</h2>
                <p>Tus Órdenes Programadas para Hoy</p>
              </div>
              <div className="banner-icon">🗂️</div>
            </div>
            <div className="page-content">
              <div>
                <Contadores stats={stats} />
                <div className="card">
                  <div className="card-header">
                    <h3>Mis Órdenes de Servicio</h3>
                    <button className="btn btn-primary btn-sm" onClick={() => irA('nuevaOrden')}>+ Nueva Orden</button>
                  </div>
                  <div className="table-wrap">
                    <TablaOrdenes servicios={servicios.slice(-5).reverse()} clientes={clientes} tecnicos={tecnicos}
                      repuestos={repuestos} onActualizar={abrirActualizar} />
                  </div>
                </div>
              </div>
              <div className="sidebar-right">
                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="card-header"><h3>Estado de la Orden</h3></div>
                  <Timeline estadoActivo="agendado" />
                </div>
                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="card-header"><h3>Resumen del Día</h3></div>
                  <ResumenDia stats={stats} />
                </div>
                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="card-header">
                    <h3>Solicitudes Web</h3>
                    {pendientes.length > 0 && (
                      <span style={{ background: '#dc3545', color: 'white', padding: '2px 8px', borderRadius: 10, fontSize: 12 }}>
                        {pendientes.length}
                      </span>
                    )}
                  </div>
                  <div className="card-body" style={{ padding: 12 }}>
                    {pendientes.length === 0
                      ? <p style={{ color: '#888', fontSize: 13 }}>Sin solicitudes pendientes</p>
                      : pendientes.slice(0, 3).map(s => (
                        <div key={s.id} style={{ borderBottom: '1px solid #eee', padding: '8px 0', fontSize: 13 }}>
                          <strong>{s.nombre}</strong> — {s.tipo}
                          <button className="btn btn-primary btn-sm" style={{ marginLeft: 8 }} onClick={() => convertirEnOrden(s)}>
                            Crear orden
                          </button>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {seccion === 'nuevaOrden' && (
          <div className="page-section active">
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              <div className="card">
                <div className="modal-header" style={{ borderRadius: '8px 8px 0 0' }}>
                  <h3>📋 Crear Nueva Orden de Servicio</h3>
                </div>
                <div className="card-body">
                  {ordenAlert.msg && <div className={`alert alert-${ordenAlert.tipo}`}>{ordenAlert.tipo === 'error' ? '⚠️' : '✅'} {ordenAlert.msg}</div>}
                  <div className="tabs">
                    <button className={`tab-btn ${clienteTab === 'existente' ? 'active' : ''}`} onClick={() => setClienteTab('existente')}>Cliente existente</button>
                    <button className={`tab-btn ${clienteTab === 'nuevo' ? 'active' : ''}`}     onClick={() => setClienteTab('nuevo')}>Nuevo cliente</button>
                  </div>
                  {clienteTab === 'existente' ? (
                    <div className="form-group">
                      <label>Seleccionar cliente</label>
                      <select value={ordCliente} onChange={e => setOrdCliente(e.target.value)}>
                        <option value="">Seleccionar...</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.telefono}</option>)}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div className="form-row">
                        <div className="form-group"><label>Nombre completo *</label><input value={ncNombre} onChange={e => setNcNombre(e.target.value)} /></div>
                        <div className="form-group"><label>Teléfono *</label><input value={ncTel} onChange={e => setNcTel(e.target.value)} /></div>
                      </div>
                      <div className="form-group"><label>Dirección</label><input value={ncDir} onChange={e => setNcDir(e.target.value)} /></div>
                      <div className="form-group"><label>Email</label><input type="email" value={ncEmail} onChange={e => setNcEmail(e.target.value)} /></div>
                    </>
                  )}
                  <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '16px 0' }} />
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tipo de servicio *</label>
                      <select value={ordTipo} onChange={e => setOrdTipo(e.target.value)}>
                        <option value="">Seleccionar...</option>
                        {['Mantenimiento','Reparación','Recarga','Instalación','Revisión'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Técnico asignado *</label>
                      <select value={ordTecnico} onChange={e => setOrdTecnico(e.target.value)}>
                        <option value="">Seleccionar...</option>
                        {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Fecha *</label><input type="date" value={ordFecha} onChange={e => setOrdFecha(e.target.value)} /></div>
                    <div className="form-group"><label>Hora</label><input type="time" value={ordHora} onChange={e => setOrdHora(e.target.value)} /></div>
                  </div>
                  <div className="form-group"><label>Diagnóstico inicial</label>
                    <textarea value={ordDiag} onChange={e => setOrdDiag(e.target.value)} placeholder="Describe el problema..." />
                  </div>
                  <div className="form-group"><label>Precio del servicio (COP)</label>
                    <input type="number" value={ordPrecio} onChange={e => setOrdPrecio(e.target.value)} placeholder="Ej: 80000" min="0" />
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-secondary" onClick={() => irA('inicio')}>Cancelar</button>
                    <button className="btn btn-primary" onClick={crearOrden}>Crear Orden de Servicio</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {seccion === 'ordenes' && (
          <div className="page-section active">
            <div className="card">
              <div className="card-header"><h3>Todas las Órdenes</h3></div>
              <div className="table-wrap">
                <TablaOrdenes servicios={servicios} clientes={clientes} tecnicos={tecnicos}
                  repuestos={repuestos} onActualizar={abrirActualizar} />
              </div>
            </div>
          </div>
        )}

        {seccion === 'clientes' && (
          <div className="page-section active">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
              <button className="btn btn-primary" onClick={() => setModalCliente(true)}>+ Registrar Cliente</button>
            </div>
            <div className="card">
              <div className="card-header"><h3>Clientes Registrados</h3></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>#</th><th>Cliente</th><th>Teléfono</th><th>Dirección</th><th>Email</th></tr></thead>
                  <tbody>
                    {clientes.map(c => (
                      <tr key={c.id}>
                        <td className="text-muted">#{c.id}</td>
                        <td><AvatarCliente nombre={c.nombre} /></td>
                        <td>{c.telefono}</td>
                        <td className="text-muted">{c.direccion}</td>
                        <td className="text-muted">{c.email || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {seccion === 'solicitudes' && (
          <div className="page-section active">
            <div className="card">
              <div className="card-header"><h3>Solicitudes Recibidas desde la Web</h3></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Nombre</th><th>Teléfono</th><th>Tipo</th><th>Fecha</th><th>Problema</th><th>Acción</th></tr></thead>
                  <tbody>
                    {sols.length === 0
                      ? <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888' }}>No hay solicitudes</td></tr>
                      : sols.map(s => (
                        <tr key={s.id}>
                          <td className="text-bold">{s.nombre}</td>
                          <td>{s.telefono}</td>
                          <td>{s.tipo}</td>
                          <td>{formatearFecha(s.fecha)}</td>
                          <td className="text-muted">{s.diagnostico || s.problema || '—'}</td>
                          <td>
                            <button className="btn btn-primary btn-sm" onClick={() => convertirEnOrden(s)}>
                              Crear orden
                            </button>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {seccion === 'repuestos' && (
          <div className="page-section active">
            <div className="card">
              <div className="card-header"><h3>Inventario de Repuestos</h3></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Ícono</th><th>Nombre</th><th>Código</th><th>Precio</th><th>Stock</th></tr></thead>
                  <tbody>
                    {repuestos.map(r => (
                      <tr key={r.id}>
                        <td>{r.icono}</td><td className="text-bold">{r.nombre}</td>
                        <td className="text-muted">{r.codigo}</td>
                        <td className="text-blue text-bold">{formatearPeso(r.precio)}</td>
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
        <Modal titulo="Actualizar Estado del Servicio" onClose={() => setModalActualizar(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModalActualizar(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={() => guardarEstado()}>Guardar</button>
          </>}>
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
        <Modal titulo="Registrar Nuevo Cliente" onClose={() => setModalCliente(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModalCliente(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={() => guardarCliente()}>Guardar</button>
          </>}>
          {clAlert && <div className="alert alert-error">⚠️ {clAlert}</div>}
          <div className="form-row">
            <div className="form-group"><label>Nombre *</label><input value={mncNombre} onChange={e => setMncNombre(e.target.value)} /></div>
            <div className="form-group"><label>Teléfono *</label><input value={mncTel} onChange={e => setMncTel(e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Dirección</label><input value={mncDir} onChange={e => setMncDir(e.target.value)} /></div>
          <div className="form-group"><label>Email</label><input type="email" value={mncEmail} onChange={e => setMncEmail(e.target.value)} /></div>
        </Modal>
      )}
    </>
  );
}

function TablaOrdenes({ servicios, clientes, tecnicos, repuestos, onActualizar }) {
  return (
    <table>
      <thead>
        <tr><th>#</th><th>Cliente</th><th>Técnico</th><th>Tipo</th><th>Fecha</th><th>Estado</th><th>Total</th><th>Acción</th></tr>
      </thead>
      <tbody>
        {servicios.map(sv => {
           const cl = clientes.find(c => String(c.id) === String(sv.clienteId));
          const tc = tecnicos.find(t => String(t.id) === String(sv.tecnicoId));
          return (
            <tr key={sv.id}>
              <td className="text-muted">#{sv.id}</td>
              <td><AvatarCliente nombre={cl?.nombre || '—'} /></td>
              <td>{tc?.nombre || '—'}</td>
              <td>{sv.tipo}</td>
              <td>{formatearFecha(sv.fecha)} {sv.hora}</td>
              <td><EstadoBadge estado={sv.estado} /></td>
              <td className="text-blue text-bold">{formatearPeso(totalServicio(sv, repuestos))}</td>
              <td>
                <button className="btn btn-secondary btn-sm" onClick={() => onActualizar(sv)}>
                  Actualizar
                </button>
              </td>
            </tr>
          );

        })}
      </tbody>
    </table>
  );
}