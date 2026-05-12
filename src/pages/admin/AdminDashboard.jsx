
import { useNavigate } from 'react-router-dom';
import { useApp, calcularEstadisticas, formatearPeso, formatearFecha, totalServicio, generarPassword } from '../../context/AppContext';
import Contadores from "../../components/counters/Contadores";
import ResumenDia from "../../components/counters/ResumenDia";
import Timeline from "../../components/timeline/Timeline";
import RepuestosPanel from "../../components/repuestos/RepuestosPanel";
import Modal from "../../components/layout/Modal";
import DashboardNav from "../../components/layout/DashboardNav";
import AvatarCliente from '../../components/cliente/AvatarCliente';
import EstadoBadge from '../../components/badges/EstadoBadge';
import { useState, useEffect } from 'react';  

const LINKS = [
  { key: 'inicio',      label: 'Inicio'         },
  { key: 'servicios',   label: 'Órdenes'        },
  { key: 'clientes',    label: 'Clientes'       },
  { key: 'repuestos',   label: 'Inventario'     },
  { key: 'tecnicos',    label: 'Técnicos'       },
  { key: 'solicitudes', label: 'Solicitudes Web'},
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { usuario, clientes, repuestos, servicios, tecnicos,
          logout, agregarCliente, agregarTecnico, toggleDisponible,
          actualizarPrecioRepuesto, obtenerSolicitudesWeb } = useApp();

  const [seccion, setSeccion] = useState('inicio');
  const [modalTecnico,  setModalTecnico]  = useState(false);
  const [modalPrecio,   setModalPrecio]   = useState(false);
  const [modalCliente,  setModalCliente]  = useState(false);

  // Técnico form
  const [tecNombre,  setTecNombre]  = useState('');
  const [tecCorreo,  setTecCorreo]  = useState('');
  const [tecUsuario, setTecUsuario] = useState('');
  const [tecPass,    setTecPass]    = useState('');
  const [tecAlert,   setTecAlert]   = useState('');

  // Precio form
  const [epRep,    setEpRep]    = useState('');
  const [epNuevo,  setEpNuevo]  = useState('');

  // Cliente form
  const [ncNombre, setNcNombre] = useState('');
  const [ncTel,    setNcTel]    = useState('');
  const [ncDir,    setNcDir]    = useState('');
  const [ncEmail,  setNcEmail]  = useState('');
  const [clAlert,  setClAlert]  = useState('');


useEffect(() => {
  if (!usuario || usuario.rol !== 'Administrador') {
    navigate('/login');
  }
}, [usuario]);

if (!usuario || usuario.rol !== 'Administrador') return null;


  const stats = calcularEstadisticas(servicios, clientes, tecnicos, repuestos);
  const sols  = obtenerSolicitudesWeb();

  const generarCreds = () => {
    if (!tecNombre) { setTecAlert('Escribe el nombre primero.'); return; }
    setTecUsuario(tecNombre.split(' ')[0].toLowerCase() + '@refrimora.com');
    setTecPass(generarPassword(tecNombre));
    setTecAlert('');
  };

  const crearTecnico = () => {
    if (!tecNombre) { setTecAlert('Ingresa el nombre.'); return; }
    agregarTecnico({ nombre: tecNombre, correo: tecUsuario || tecCorreo, password: tecPass || 'tec123' });
    setModalTecnico(false);
    setTecNombre(''); setTecCorreo(''); setTecUsuario(''); setTecPass(''); setTecAlert('');
  };

  const guardarPrecio = () => {
    if (!epRep || !epNuevo) { alert('Selecciona repuesto e ingresa precio.'); return; }
    actualizarPrecioRepuesto(parseInt(epRep), parseInt(epNuevo));
    setModalPrecio(false); setEpRep(''); setEpNuevo('');
  };

  const guardarCliente = () => {
    if (!ncNombre || !ncTel) { setClAlert('Nombre y teléfono obligatorios.'); return; }
    agregarCliente({ nombre: ncNombre, telefono: ncTel, direccion: ncDir, email: ncEmail });
    setModalCliente(false);
    setNcNombre(''); setNcTel(''); setNcDir(''); setNcEmail(''); setClAlert('');
  };

  return (
    <>
      <DashboardNav links={LINKS} seccion={seccion} onSeccion={setSeccion}
        usuario={usuario} onLogout={() => { logout(); navigate('/login'); }} />

      <div className="page-wrapper">

        {/* INICIO */}
        {seccion === 'inicio' && (
          <div className="page-section active">
            <div className="welcome-banner" style={{ marginBottom: 20 }}>
              <div><h2>Panel de Administrador</h2><p>Resumen general del negocio</p></div>
              <div className="banner-icon">📊</div>
            </div>
            <div className="page-content">
              <div>
                <Contadores stats={stats} />
                <div className="card">
                  <div className="card-header">
                    <h3>Servicios Recientes</h3>
                    <button className="btn btn-primary btn-sm" onClick={() => setSeccion('servicios')}>Ver todos</button>
                  </div>
                  <div className="table-wrap">
                    <TablaServicios servicios={servicios.slice(-4).reverse()} clientes={clientes} tecnicos={tecnicos} repuestos={repuestos} />
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><h3>Estado de Técnicos</h3></div>
                  <div className="table-wrap">
                    <TablaTecnicosDash tecnicos={tecnicos} servicios={servicios} />
                  </div>
                </div>
              </div>
              <div className="sidebar-right">
                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="card-header"><h3>Estado de la Orden</h3></div>
                  <Timeline estadoActivo="en-reparacion" />
                </div>
                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="card-header"><h3>Resumen del Día</h3></div>
                  <ResumenDia stats={stats} />
                </div>
                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="card-header"><h3>Venta de Repuestos</h3></div>
                  <div className="card-body"><RepuestosPanel repuestos={repuestos} /></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ÓRDENES */}
        {seccion === 'servicios' && (
          <div className="page-section active">
            <div className="card">
              <div className="card-header"><h3>Todas las Órdenes</h3></div>
              <div className="table-wrap">
                <TablaServicios servicios={servicios} clientes={clientes} tecnicos={tecnicos} repuestos={repuestos} />
              </div>
            </div>
          </div>
        )}

        {/* CLIENTES */}
        {seccion === 'clientes' && (
          <div className="page-section active">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
              <button className="btn btn-primary" onClick={() => setModalCliente(true)}>+ Nuevo Cliente</button>
            </div>
            <div className="card">
              <div className="card-header"><h3>Clientes Registrados</h3></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>#</th><th>Cliente</th><th>Teléfono</th><th>Dirección</th><th>Email</th><th>Registro</th></tr></thead>
                  <tbody>
                    {clientes.map(c => (
                      <tr key={c.id}>
                        <td className="text-muted">#{c.id}</td>
                        <td><AvatarCliente nombre={c.nombre} /></td>
                        <td>{c.telefono}</td>
                        <td className="text-muted">{c.direccion}</td>
                        <td className="text-muted">{c.email || '—'}</td>
                        <td>{formatearFecha(c.fecha)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* INVENTARIO */}
        {seccion === 'repuestos' && (
          <div className="page-section active">
            <div className="card">
              <div className="card-header">
                <h3>Inventario de Repuestos</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setModalPrecio(true)}>Editar Precio</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Ícono</th><th>Nombre</th><th>Código</th><th>Precio</th><th>Stock</th></tr></thead>
                  <tbody>
                    {repuestos.map(r => (
                      <tr key={r.id}>
                        <td>{r.icono}</td>
                        <td className="text-bold">{r.nombre}</td>
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

        {/* TÉCNICOS */}
        {seccion === 'tecnicos' && (
          <div className="page-section active">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
              <button className="btn btn-primary" onClick={() => setModalTecnico(true)}>
                + Nuevo Técnico
              </button>
            </div>
            <div className="card">
              <div className="card-header"><h3>Equipo de Técnicos</h3></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Técnico</th><th>Correo</th><th>Disponible</th><th>Acción</th></tr></thead>
                  <tbody>
                    {tecnicos.map(t => (
                      <tr key={t.id}>
                        <td><AvatarCliente nombre={t.nombre} /></td>
                        <td className="text-muted">{t.correo}</td>
                        <td>
                          <span className={`badge ${t.disponible ? 'badge-finalizado' : 'badge-cancelado'}`}>
                            {t.disponible ? 'Disponible' : 'No disponible'}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => toggleDisponible(t.id)}>
                            Cambiar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SOLICITUDES */}
        {seccion === 'solicitudes' && (
          <div className="page-section active">
            <div className="card">
              <div className="card-header"><h3>Solicitudes desde la Web</h3></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Nombre</th><th>Teléfono</th><th>Dirección</th><th>Tipo</th><th>Fecha</th><th>Enviada</th></tr></thead>
                  <tbody>
                    {sols.length === 0
                      ? <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888' }}>No hay solicitudes aún</td></tr>
                      : sols.map(s => (
                        <tr key={s.id}>
                          <td className="text-bold">{s.nombre}</td>
                          <td>{s.telefono}</td>
                          <td className="text-muted">{s.direccion}</td>
                          <td>{s.tipo}</td>
                          <td>{formatearFecha(s.fecha)}</td>
                          <td className="text-muted">{s.fechaEnvio}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL TÉCNICO */}
      {modalTecnico && (
        <Modal titulo="Crear Nuevo Técnico" onClose={() => setModalTecnico(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModalTecnico(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={crearTecnico}>Crear Técnico</button>
          </>}>
          {tecAlert && <div className="alert alert-error">⚠️ {tecAlert}</div>}
          <div className="form-group"><label>Nombre completo</label>
            <input value={tecNombre} onChange={e => setTecNombre(e.target.value)} placeholder="Nombre" />
          </div>
          <div className="form-group"><label>Correo electrónico</label>
            <input value={tecCorreo} onChange={e => setTecCorreo(e.target.value)} placeholder="tecnico@refrimora.com" />
          </div>
          <div className="form-row">
            <div className="form-group"><label>Usuario generado</label>
              <input value={tecUsuario} readOnly style={{ background: '#f4f6f8' }} />
            </div>
            <div className="form-group"><label>Contraseña generada</label>
              <input value={tecPass} readOnly style={{ background: '#f4f6f8' }} />
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={generarCreds}>🔄 Generar credenciales</button>
        </Modal>
      )}

      {/* MODAL PRECIO */}
      {modalPrecio && (
        <Modal titulo="Editar Precio de Repuesto" onClose={() => setModalPrecio(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModalPrecio(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={() => guardarPrecio}>Guardar</button>
          </>}>
          <div className="form-group"><label>Seleccionar repuesto</label>
            <select value={epRep} onChange={e => setEpRep(e.target.value)}>
              <option value="">Seleccionar...</option>
              {repuestos.map(r => <option key={r.id} value={r.id}>{r.icono} {r.nombre}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Precio actual</label>
              <input value={epRep ? formatearPeso(repuestos.find(r => r.id === parseInt(epRep))?.precio || 0) : ''} readOnly style={{ background: '#f4f6f8' }} />
            </div>
            <div className="form-group"><label>Nuevo precio (COP)</label>
              <input type="number" value={epNuevo} onChange={e => setEpNuevo(e.target.value)} min="0" />
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL CLIENTE */}
      {modalCliente && (
        <Modal titulo="Registrar Nuevo Cliente" onClose={() => setModalCliente(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModalCliente(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={() => guardarCliente}>Guardar Cliente</button>
          </>}>
          {clAlert && <div className="alert alert-error">⚠️ {clAlert}</div>}
          <div className="form-row">
            <div className="form-group"><label>Nombre *</label><input value={ncNombre} onChange={e => setNcNombre(e.target.value)} /></div>
            <div className="form-group"><label>Teléfono *</label><input value={ncTel} onChange={e => setNcTel(e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Dirección</label><input value={ncDir} onChange={e => setNcDir(e.target.value)} /></div>
          <div className="form-group"><label>Email</label><input type="email" value={ncEmail} onChange={e => setNcEmail(e.target.value)} /></div>
        </Modal>
      )}
    </>
  );
}

function TablaServicios({ servicios, clientes, tecnicos, repuestos }) {
  return (
    <table>
      <thead>
        <tr><th>#</th><th>Cliente</th><th>Dirección</th><th>Técnico</th><th>Tipo</th><th>Fecha</th><th>Estado</th><th>Total</th></tr>
      </thead>
      <tbody>
        {servicios.map(sv => {
          const cl = clientes.find(c => String(c.id) === String(sv.clienteId));
          const tc = tecnicos.find(t => String(t.id) === String(sv.tecnicoId));
          return (
            <tr key={sv.id}>
              <td className="text-muted">#{sv.id}</td>
              <td><AvatarCliente nombre={cl?.nombre || '—'} /></td>
              <td className="text-muted">{cl?.direccion || '—'}</td>
              <td>{tc?.nombre || '—'}</td>
              <td>{sv.tipo}</td>
              <td>{formatearFecha(sv.fecha)} {sv.hora}</td>
              <td><EstadoBadge estado={sv.estado} /></td>
              <td className="text-blue text-bold">{formatearPeso(totalServicio(sv, repuestos))}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function TablaTecnicosDash({ tecnicos, servicios }) {
  return (
    <table>
      <thead><tr><th>Técnico</th><th>Estado</th><th>Órdenes hoy</th></tr></thead>
      <tbody>
        {tecnicos.map(t => {
          const hoy = new Date().toISOString().split('T')[0];
          const ordHoy = servicios.filter(s => String(s.tecnicoId) === String(t.id) && s.fecha === hoy).length;
          return (
            <tr key={t.id}>
              <td><AvatarCliente nombre={t.nombre} /></td>
              <td><span className={`badge ${t.disponible ? 'badge-finalizado' : 'badge-cancelado'}`}>{t.disponible ? 'Disponible' : 'Ocupado'}</span></td>
              <td>{ordHoy}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}