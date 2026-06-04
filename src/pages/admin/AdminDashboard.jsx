import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useApp,
  calcularEstadisticasDelDia,
  formatearPeso,
  formatearFecha,
  totalServicio,
  generarPassword,
  calcularIntervaloEtiqueta
} from '../../context/AppContext';
import ResumenDia from '../../components/counters/ResumenDia';
import RepuestosPanel from '../../components/repuestos/RepuestosPanel';
import Modal from '../../components/layout/Modal';
import AvatarCliente from '../../components/cliente/AvatarCliente';
import EstadoBadge from '../../components/badges/EstadoBadge';
import CierreDiario from './CierreDiario';

const LINKS = [
  { key: 'inicio', label: 'Inicio', icon: '🏠' },
  { key: 'servicios', label: 'Órdenes', icon: '📋' },
  { key: 'clientes', label: 'Clientes', icon: '👥' },
  { key: 'repuestos', label: 'Inventario', icon: '🔩' },
  { key: 'tecnicos', label: 'Trabajadores', icon: '🧑‍🔧' },
  { key: 'solicitudes', label: 'Solicitudes Web', icon: '📨' },
  { key: 'cierres', label: 'Cierres Diarios', icon: '📊' },
];

function normalizarRol(valor) {
  const v = String(valor || '').trim().toLowerCase();
  if (v === 'administrador' || v === 'admin') return 'admin';
  if (v === 'secretaria' || v === 'secretaría') return 'secretaria';
  if (v === 'tecnico' || v === 'técnico') return 'tecnico';
  if (v === 'cliente') return 'cliente';
  return v;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    usuario,
    clientes,
    repuestos,
    servicios,
    tecnicos,
    usuarios,
    logout,
    agregarCliente,
    agregarTecnico,
    toggleDisponible,
    agregarRepuesto,
    actualizarRepuesto,
    eliminarRepuesto,
    obtenerSolicitudesWeb,
    historialCierres
  } = useApp();

  const [seccion, setSeccion] = useState('inicio');
  const [menuOpen, setMenuOpen] = useState(false);

  const [modalTecnico, setModalTecnico] = useState(false);
  const [modalRepuesto, setModalRepuesto] = useState(false);

  const [tecNombre, setTecNombre] = useState('');
  const [tecCorreo, setTecCorreo] = useState('');
  const [tecUsuario, setTecUsuario] = useState('');
  const [tecPass, setTecPass] = useState('');
  const [tecAlert, setTecAlert] = useState('');
  const [tecRol, setTecRol] = useState('tecnico');

  const [repMode, setRepMode] = useState('crear');
  const [repId, setRepId] = useState(null);
  const [repNombre, setRepNombre] = useState('');
  const [repCodigo, setRepCodigo] = useState('');
  const [repIcono, setRepIcono] = useState('🔧');
  const [repPrecio, setRepPrecio] = useState('');
  const [repPrecioCompra, setRepPrecioCompra] = useState('');
  const [repStock, setRepStock] = useState('');
  const [repAlert, setRepAlert] = useState('');

  // Estados para el historial de órdenes por día
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [mostrarActivas, setMostrarActivas] = useState(false);

  // Algoritmo de particionamiento cronológico para obtener servicios de un cierre específico
  const getServiciosDelCierre = (cierre) => {
    if (!cierre || !cierre.detalleTecnicos) return [];
    let allServs = [];
    
    // Ordenamos los cierres cronológicamente
    const cierresCronologico = [...(historialCierres || [])].sort((a, b) => Number(a.id) - Number(b.id));
    
    cierre.detalleTecnicos.forEach(tecCierre => {
      const tecId = tecCierre.id;
      
      // Filtrar cierres en los que participó este técnico
      const closuresConTecnico = cierresCronologico
        .filter(c => c.detalleTecnicos?.some(t => Number(t.id) === Number(tecId)));
        
      // Servicios cerrados o finalizados del técnico en orden cronológico
      const serviciosCerradosDelTecnico = servicios
        .filter(s => Number(s.tecnicoId) === Number(tecId) && (s.estado === 'cerrado' || s.estado === 'finalizado'))
        .sort((a, b) => Number(a.id) - Number(b.id));
        
      const idx = closuresConTecnico.findIndex(c => Number(c.id) === Number(cierre.id));
      if (idx !== -1) {
        let startIdx = 0;
        for (let i = 0; i < idx; i++) {
          const prevCierre = closuresConTecnico[i];
          const prevTec = prevCierre.detalleTecnicos.find(t => Number(t.id) === Number(tecId));
          startIdx += prevTec ? prevTec.serviciosCompletados : 0;
        }
        const count = tecCierre.serviciosCompletados || 0;
        const servs = serviciosCerradosDelTecnico.slice(startIdx, startIdx + count);
        allServs = [...allServs, ...servs];
      }
    });
    
    return allServs.sort((a, b) => Number(b.id) - Number(a.id));
  };




  useEffect(() => {
    if (!usuario || normalizarRol(usuario.rol) !== 'admin') {
      navigate('/login', { replace: true });
    }
  }, [usuario, navigate]);

  if (!usuario || normalizarRol(usuario.rol) !== 'admin') return null;

  const stats = calcularEstadisticasDelDia(servicios, clientes, tecnicos, repuestos);
  const sols = obtenerSolicitudesWeb();
  const pendientes = sols.filter(s => s.estado === 'pendiente');
  const hoy = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const secretarias = (usuarios || []).filter(u => normalizarRol(u.rol) === 'secretaria');

  const initials =
    usuario.nombre?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'A';

  const generarCreds = () => {
    if (!tecNombre) {
      setTecAlert('Escribe el nombre primero.');
      return;
    }

    setTecUsuario(tecNombre.split(' ')[0].toLowerCase() + '@refrimora.com');
    setTecPass(generarPassword(tecNombre));
    setTecAlert('');
  };

  const crearTecnico = async () => {
    if (!tecNombre) {
      setTecAlert('Ingresa el nombre.');
      return;
    }

    await agregarTecnico({
      nombre: tecNombre,
      correo: tecUsuario || tecCorreo,
      password: tecPass || 'tec123',
      rol: tecRol
    });

    setModalTecnico(false);
    setTecNombre('');
    setTecCorreo('');
    setTecUsuario('');
    setTecPass('');
    setTecAlert('');
    setTecRol('tecnico');
  };

  const abrirCrearRepuesto = () => {
    setRepMode('crear');
    setRepId(null);
    setRepNombre('');
    setRepCodigo('');
    setRepIcono('🔧');
    setRepPrecio('');
    setRepPrecioCompra('');
    setRepStock('');
    setRepAlert('');
    setModalRepuesto(true);
  };

  const abrirEditarRepuesto = (r) => {
    setRepMode('editar');
    setRepId(r.id);
    setRepNombre(r.nombre);
    setRepCodigo(r.codigo);
    setRepIcono(r.icono || '🔧');
    setRepPrecio(String(r.precio || ''));
    setRepPrecioCompra(String(r.precioCompra || ''));
    setRepStock(String(r.stock));
    setRepAlert('');
    setModalRepuesto(true);
  };

  const guardarRepuesto = async () => {
    if (!repNombre || !repCodigo || !repPrecio || !repPrecioCompra || !repStock) {
      setRepAlert('Todos los campos son obligatorios.');
      return;
    }

    if (Number(repPrecio) < 0 || Number(repPrecioCompra) < 0 || Number(repStock) < 0) {
      setRepAlert('Los precios y stock deben ser mayores o iguales a 0.');
      return;
    }

    if (Number(repPrecio) < Number(repPrecioCompra)) {
      setRepAlert('El precio de venta no debería ser menor al de compra.');
    }

    try {
      if (repMode === 'crear') {
        await agregarRepuesto({
          nombre: repNombre,
          codigo: repCodigo,
          icono: repIcono,
          precio: Number(repPrecio),
          precioCompra: Number(repPrecioCompra),
          stock: Number(repStock),
        });
      } else {
        await actualizarRepuesto(repId, {
          nombre: repNombre,
          codigo: repCodigo,
          icono: repIcono,
          precio: Number(repPrecio),
          precioCompra: Number(repPrecioCompra),
          stock: Number(repStock),
        });
      }
      setModalRepuesto(false);
      setRepAlert('');
    } catch (e) {
      setRepAlert(e.message || 'Error al guardar el repuesto.');
    }
  };

  const handleEliminarRepuesto = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este repuesto?')) {
      try {
        await eliminarRepuesto(id);
      } catch (e) {
        alert(e.message || 'No se pudo eliminar el repuesto.');
      }
    }
  };



  const kpis = [
    { label: 'Total órdenes', valor: servicios.length, icon: '📋', cls: 'blue' },
    { label: 'En curso', valor: servicios.filter(s => !['finalizado', 'cancelado', 'cerrado'].includes(s.estado)).length, icon: '🔧', cls: 'orange' },
    { label: 'Clientes', valor: clientes.length, icon: '👥', cls: 'teal' },
    { label: 'Técnicos activos', valor: tecnicos.filter(t => t.disponible).length, icon: '🧑‍🔧', cls: 'green' },
  ];

  return (
    <div className="ad-shell">
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
              onClick={() => {
                setSeccion(l.key);
                setMenuOpen(false);
                if (l.key === 'servicios') {
                  setDiaSeleccionado(null);
                  setMostrarActivas(false);
                }
              }}
            >
              <span className="ad-nav-icon">{l.icon}</span>
              {l.label}
            </button>
          ))}
          <button
            className="ad-nav-link ad-nav-logout-mobile"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
          >
            <span className="ad-nav-icon">🚪</span>
            Salir
          </button>
        </div>

        <div className="ad-nav-right">
          <div className="ad-nav-user">
            <div className="ad-nav-avatar">{initials}</div>
            <div className="ad-nav-userinfo">
              <span className="ad-nav-username">{usuario.nombre?.split(' ')[0]}</span>
              <span className="ad-nav-role">Admin</span>
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
                <div className="ad-hero-avatar">{initials}</div>
                <div>
                  <h1 className="ad-hero-greeting">Panel de Administrador</h1>
                  <p className="ad-hero-sub">
                    Resumen general del negocio ·{' '}
                    {new Date().toLocaleDateString('es-CO', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {pendientes.length > 0 && (
                <button className="ad-hero-notif" onClick={() => setSeccion('solicitudes')}>
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
              <div className="ad-panel">
                <div className="ad-panel-header">
                  <h3>Órdenes recientes</h3>
                  <button className="ad-btn-xs" onClick={() => {
                    setSeccion('servicios');
                    setDiaSeleccionado(null);
                    setMostrarActivas(false);
                  }}>Ver todas →</button>
                </div>
                <div className="ad-table-wrap">
                  <TablaServicios
                    servicios={servicios.filter(s => s.estado !== 'cerrado').reverse().slice(0, 5)}
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

        {seccion === 'servicios' && (
          <div className="ad-section">
            {(diaSeleccionado || mostrarActivas) ? (
              // Vista Detallada: Órdenes de un día seleccionado o activas
              <>
                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <button 
                    className="ad-btn-sm" 
                    onClick={() => {
                      setDiaSeleccionado(null);
                      setMostrarActivas(false);
                    }}
                    style={{ 
                      background: 'rgba(78, 163, 255, 0.15)', 
                      color: '#7ecfff', 
                      border: '1px solid rgba(78, 163, 255, 0.3)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <span>←</span> Volver al Historial
                  </button>
                  <div>
                    <h2 className="ad-page-title" style={{ margin: 0 }}>
                      {mostrarActivas 
                        ? "Órdenes Activas en Curso" 
                        : `Órdenes terminadas del día`}
                    </h2>
                    <p className="ad-page-sub" style={{ margin: 0 }}>
                      {mostrarActivas 
                        ? `${servicios.filter(s => s.estado !== 'cerrado').length} órdenes activas actualmente.`
                        : `Día: ${formatearFecha(diaSeleccionado.fechaCierre)} · ${getServiciosDelCierre(diaSeleccionado).length} órdenes finalizadas.`}
                    </p>
                  </div>
                </div>
                
                <div className="ad-panel">
                  <div className="ad-table-wrap">
                    <TablaServicios
                      servicios={
                        mostrarActivas 
                          ? [...servicios].filter(s => s.estado !== 'cerrado').reverse()
                          : getServiciosDelCierre(diaSeleccionado)
                      }
                      clientes={clientes}
                      tecnicos={tecnicos}
                      repuestos={repuestos}
                    />
                  </div>
                </div>
              </>
            ) : (
              // Vista Principal: Cuadrícula de tarjetas de historial
              <>
                <div className="ad-page-header">
                  <div>
                    <h2 className="ad-page-title">Historial de Órdenes por Día</h2>
                    <p className="ad-page-sub">Consulta el historial de órdenes por día o las órdenes activas en curso.</p>
                  </div>
                </div>
                
                <div className="cierre-card-grid">
                  {/* Tarjeta de Órdenes Activas */}
                  {(() => {
                    const activas = servicios.filter(s => ['agendado', 'en-camino', 'en-reparacion', 'finalizado'].includes(s.estado));
                    const programadas = activas.filter(s => s.estado === 'agendado').length;
                    const enProceso = activas.filter(s => s.estado === 'en-camino' || s.estado === 'en-reparacion').length;
                    const finalizadasHoy = activas.filter(s => s.estado === 'finalizado').length;
                    
                    return (
                      <div className="cierre-card active-orders">
                        <div className="cierre-card-header">
                          <div>
                            <strong className="cierre-date" style={{ color: '#7ecfff' }}>⚡ Órdenes Activas</strong>
                            <div className="cierre-time">Jornada actual y pendientes</div>
                          </div>
                          <span className="cierre-badge-ganancia positive" style={{ background: 'rgba(78, 163, 255, 0.15)', color: '#7ecfff', borderColor: 'rgba(78, 163, 255, 0.3)' }}>
                            {activas.length} activas
                          </span>
                        </div>
                        
                        <div className="cierre-card-body">
                          <div className="cierre-stat-row">
                            <span className="stat-label">Programadas (Por Iniciar)</span>
                            <span className="stat-value" style={{ color: '#ff8fa3' }}>{programadas}</span>
                          </div>
                          <div className="cierre-stat-row">
                            <span className="stat-label">En Proceso (En Curso)</span>
                            <span className="stat-value" style={{ color: '#fca5a5' }}>{enProceso}</span>
                          </div>
                          <div className="cierre-stat-row">
                            <span className="stat-label">Finalizadas Hoy</span>
                            <span className="stat-value" style={{ color: '#6ee7b7' }}>{finalizadasHoy}</span>
                          </div>
                        </div>
                        
                        <div className="cierre-card-footer">
                          <button 
                            className="ad-btn-sm" 
                            style={{ 
                              width: '100%', 
                              justifyContent: 'center', 
                              background: 'rgba(78, 163, 255, 0.15)', 
                              color: '#7ecfff', 
                              border: '1px solid rgba(78, 163, 255, 0.3)',
                              padding: '10px 14px',
                              fontSize: '13px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 'bold'
                            }}
                            onClick={() => setMostrarActivas(true)}
                          >
                            Ver Órdenes Activas
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Tarjetas de Cierres Históricos */}
                  {(() => {
                    const cierres = [...(historialCierres || [])].reverse();
                    if (cierres.length === 0) return null;
                    
                    return cierres.map(c => {
                      const totalServicios = c.detalleTecnicos?.reduce((acc, t) => acc + t.serviciosCompletados, 0) || 0;
                      const ganancia = c.estadisticasGenerales?.gananciaNeta || 0;
                      const isPositive = ganancia >= 0;
                      
                      return (
                        <div key={c.id} className="cierre-card">
                          <div className="cierre-card-header">
                            <div>
                              <strong className="cierre-date">📋 Órdenes terminadas del día</strong>
                              <div className="cierre-time">{formatearFecha(c.fechaCierre)}</div>
                            </div>
                            <span className={`cierre-badge-ganancia ${isPositive ? 'positive' : 'negative'}`}>
                              {formatearPeso(ganancia)}
                            </span>
                          </div>
                          
                          <div className="cierre-card-body">
                            <div className="cierre-stat-row">
                              <span className="stat-label">Servicios Realizados</span>
                              <span className="stat-value">{totalServicios}</span>
                            </div>
                            <div className="cierre-stat-row">
                              <span className="stat-label">Ingresos Totales</span>
                              <span className="stat-value">{formatearPeso(c.estadisticasGenerales?.totalIngresos)}</span>
                            </div>
                            <div className="cierre-stat-row">
                              <span className="stat-label">Pago a Técnicos</span>
                              <span className="stat-value text-red">-{formatearPeso(c.estadisticasGenerales?.totalPagadoTecnicos)}</span>
                            </div>
                          </div>
                          
                          <div className="cierre-card-footer">
                            <button 
                              className="ad-btn-sm" 
                              style={{ 
                                width: '100%', 
                                justifyContent: 'center', 
                                background: 'rgba(255, 255, 255, 0.05)', 
                                color: '#cbd5e1', 
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                padding: '10px 14px',
                                fontSize: '13px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                              }}
                              onClick={() => setDiaSeleccionado(c)}
                            >
                              Ver Órdenes del Día
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </>
            )}
          </div>
        )}

        {seccion === 'clientes' && (
          <div className="ad-section">
            <div className="ad-page-header">
              <div>
                <h2 className="ad-page-title">Clientes registrados</h2>
                <p className="ad-page-sub">{clientes.length} clientes en total.</p>
              </div>
            </div>
            <div className="ad-panel">
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

        {seccion === 'repuestos' && (
          <div className="ad-section">
            <div className="ad-page-header">
              <div>
                <h2 className="ad-page-title">Inventario de repuestos</h2>
                <p className="ad-page-sub">{repuestos.length} repuestos registrados.</p>
              </div>
              <button className="ad-btn-main" onClick={abrirCrearRepuesto}>+ Nuevo repuesto</button>
            </div>
            <div className="ad-panel">
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Ícono</th>
                      <th>Nombre</th>
                      <th>Código</th>
                      <th>P. Compra</th>
                      <th>P. Venta</th>
                      <th>Stock</th>
                      <th style={{ width: 180 }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repuestos.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontSize: 22, textAlign: 'center' }}>{r.icono}</td>
                        <td><strong>{r.nombre}</strong></td>
                        <td className="ad-muted">{r.codigo}</td>
                        <td className="ad-money">{formatearPeso(r.precioCompra || 0)}</td>
                        <td className="ad-money">{formatearPeso(r.precio)}</td>
                        <td>{r.stock}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="ad-btn-sm" onClick={() => abrirEditarRepuesto(r)}>✏️ Editar</button>
                            <button className="ad-btn-sm" style={{ background: 'rgba(220, 53, 69, 0.15)', border: '1px solid rgba(220, 53, 69, 0.3)', color: '#ff8fa3' }} onClick={() => handleEliminarRepuesto(r.id)}>🗑️ Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {seccion === 'tecnicos' && (
          <div className="ad-section">
            <div className="ad-page-header">
              <div>
                <h2 className="ad-page-title">Trabajadores registrados</h2>
                <p className="ad-page-sub">
                  {tecnicos.length + secretarias.length} trabajadores registrados ({tecnicos.length} técnicos, {secretarias.length} secretarias).
                </p>
              </div>
              <button className="ad-btn-main" onClick={() => setModalTecnico(true)}>+ Nuevo trabajador</button>
            </div>

            <div className="ad-panel" style={{ marginBottom: '24px' }}>
              <div className="ad-panel-header">
                <h3>Técnicos</h3>
              </div>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Técnico</th>
                      <th>Correo</th>
                      <th>Disponible</th>
                      <th>Órd. hoy</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tecnicos.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="ad-empty-row">No hay técnicos registrados.</td>
                      </tr>
                    ) : (
                      tecnicos.map(t => {
                        const ordHoy = servicios.filter(
                          s => String(s.tecnicoId) === String(t.id) && String(s.fechaServicio) === hoy
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
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="ad-panel">
              <div className="ad-panel-header">
                <h3>Secretarias</h3>
              </div>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Secretaria</th>
                      <th>Correo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {secretarias.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="ad-empty-row">No hay secretarias registradas.</td>
                      </tr>
                    ) : (
                      secretarias.map(sec => (
                        <tr key={sec.id}>
                          <td><div className="ad-td-user"><AvatarCliente nombre={sec.nombre} /></div></td>
                          <td className="ad-muted">{sec.correo}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {seccion === 'solicitudes' && (
          <div className="ad-section">
            <div className="ad-page-header">
              <div>
                <h2 className="ad-page-title">Solicitudes desde la web</h2>
                <p className="ad-page-sub">
                  {pendientes.length} solicitud{pendientes.length !== 1 ? 'es' : ''} recibida{pendientes.length !== 1 ? 's' : ''} desde el portal cliente.
                </p>
              </div>
            </div>
            <div className="ad-panel">
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Teléfono</th>
                      <th>Dirección</th>
                      <th>Tipo</th>
                      <th>Fecha pref.</th>
                      <th>Hora</th>
                      <th>Enviada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendientes.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="ad-empty-row">No hay solicitudes aún.</td>
                      </tr>
                    ) : (
                      pendientes.map(s => (
                        <tr key={s.id}>
                          <td><strong>{s.nombre}</strong></td>
                          <td>{s.telefono}</td>
                          <td className="ad-muted">{s.direccion}</td>
                          <td>
                            <div>
                              <strong>{s.tipo}</strong>
                              {(() => {
                                let list = [];
                                if (s.aires) {
                                  try {
                                    list = typeof s.aires === 'string' ? JSON.parse(s.aires) : s.aires;
                                  } catch {}
                                }
                                if (list.length > 0) {
                                  return (
                                    <div style={{ fontSize: '11px', color: '#9ab3cc', marginTop: '2px' }}>
                                      {list.map((a, i) => `${a.tipoAire} (${a.tipoServicio.substring(0, 3)}.)`).join(', ')}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </td>
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

        {seccion === 'cierres' && (
          <CierreDiario />
        )}
      </div>

      {modalTecnico && (
        <Modal
          titulo={tecRol === 'tecnico' ? "Crear nuevo técnico" : "Crear nueva secretaria"}
          onClose={() => {
            setModalTecnico(false);
            setTecRol('tecnico');
          }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => {
                setModalTecnico(false);
                setTecRol('tecnico');
              }}>Cancelar</button>
              <button className="btn btn-primary" onClick={crearTecnico}>
                {tecRol === 'tecnico' ? 'Crear técnico' : 'Crear secretaria'}
              </button>
            </>
          }
        >
          {tecAlert && <div className="alert alert-error">{tecAlert}</div>}
          <div className="form-group">
            <label>Nombre completo</label>
            <input value={tecNombre} onChange={e => setTecNombre(e.target.value)} placeholder="Nombre" />
          </div>
          <div className="form-group">
            <label>Rol</label>
            <select value={tecRol} onChange={e => setTecRol(e.target.value)}>
              <option value="tecnico">Técnico</option>
              <option value="secretaria">Secretaria</option>
            </select>
          </div>
          <div className="form-group">
            <label>Correo electrónico</label>
            <input value={tecCorreo} onChange={e => setTecCorreo(e.target.value)} placeholder={tecRol === 'tecnico' ? "tecnico@refrimora.com" : "secretaria@refrimora.com"} />
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

      {modalRepuesto && (
        <Modal
          titulo={repMode === 'crear' ? 'Agregar nuevo repuesto' : 'Editar repuesto'}
          onClose={() => setModalRepuesto(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalRepuesto(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarRepuesto}>Guardar</button>
            </>
          }
        >
          {repAlert && <div className="alert alert-error">{repAlert}</div>}
          <div className="form-group">
            <label>Nombre del repuesto</label>
            <input value={repNombre} onChange={e => setRepNombre(e.target.value)} placeholder="Ej. Filtro de aire" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Código</label>
              <input value={repCodigo} onChange={e => setRepCodigo(e.target.value)} placeholder="Ej. FL-100" />
            </div>
            <div className="form-group">
              <label>Ícono (Emoji)</label>
              <select value={repIcono} onChange={e => setRepIcono(e.target.value)}>
                <option value="🔧">🔧 Llave</option>
                <option value="🔩">🔩 Tornillo</option>
                <option value="🔌">🔌 Enchufe</option>
                <option value="⚙️">⚙️ Engranaje</option>
                <option value="🌡️">🌡️ Termómetro</option>
                <option value="🧪">🧪 Tubo ensayo</option>
                <option value="📦">📦 Caja</option>
                <option value="🔋">🔋 Batería</option>
                <option value="💡">💡 Bombilla</option>
                <option value="❄️">❄️ Nieve</option>
                <option value="💧">💧 Gota</option>
                <option value="🛠️">🛠️ Herramientas</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Precio de compra (COP)</label>
              <input type="number" value={repPrecioCompra} onChange={e => setRepPrecioCompra(e.target.value)} min={0} placeholder="Ej. 10000" />
            </div>
            <div className="form-group">
              <label>Precio de venta (COP)</label>
              <input type="number" value={repPrecio} onChange={e => setRepPrecio(e.target.value)} min={0} placeholder="Ej. 15000" />
            </div>
          </div>
          <div className="form-group">
            <label>Stock / Cantidad</label>
            <input type="number" value={repStock} onChange={e => setRepStock(e.target.value)} min={0} placeholder="Ej. 10" />
          </div>
        </Modal>
      )}


    </div>
  );
}

function TablaServicios({ servicios, clientes, tecnicos, repuestos }) {
  return (
    <table className="ad-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Cliente</th>
          <th>Dirección</th>
          <th>Técnico</th>
          <th>Tipo</th>
          <th>Fecha</th>
          <th>Estado</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {servicios.length === 0 ? (
          <tr>
            <td colSpan={8} className="ad-empty-row">Sin órdenes registradas.</td>
          </tr>
        ) : (
          servicios.map(sv => {
            const cl = clientes.find(c => String(c.id) === String(sv.clienteId));
            const nombreCliente = sv.clienteNombre || cl?.nombre || '—';
            const nombreTecnico =
              sv.tecnicoNombre ||
              tecnicos.find(t => String(t.id) === String(sv.tecnicoId))?.nombre ||
              '—';
            const direccion = cl?.direccion || sv.direccionCliente || '—';

            return (
              <tr key={sv.id}>
                <td className="ad-id">{sv.id}</td>
                <td><div className="ad-td-user"><AvatarCliente nombre={nombreCliente} /></div></td>
                <td className="ad-muted">{direccion}</td>
                <td>{nombreTecnico}</td>
                <td>
                  <div>
                    <strong>{sv.tipo}</strong>
                    {sv.airesList && sv.airesList.length > 0 && (
                      <div style={{ fontSize: '11px', color: '#9ab3cc', marginTop: '2px' }}>
                        {sv.airesList.map((a, i) => `${a.tipoAire} (${a.tipoServicio.substring(0, 3)}.)`).join(', ')}
                      </div>
                    )}
                  </div>
                </td>
                <td className="ad-muted">{formatearFecha(sv.fechaServicio)} {calcularIntervaloEtiqueta(sv.hora, sv.duracionForzada)}</td>
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

function TablaTecnicosDash({ tecnicos, servicios, hoy }) {
  return (
    <table className="ad-table">
      <thead>
        <tr>
          <th>Técnico</th>
          <th>Estado</th>
          <th>Hoy</th>
        </tr>
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