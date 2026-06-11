import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useApp,
  calcularEstadisticasDelDia,
  formatearPeso,
  formatearFecha,
  totalServicio,
  calcularIntervaloEtiqueta,
  formatearIntervaloBD
} from '../../context/AppContext';
import ResumenDia from "../../components/counters/ResumenDia";
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
  { key: 'precios', label: 'Tarifas', icon: '💰' },
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
    actualizarSolicitudWeb,
    obtenerDisponibilidadTecnicos,
    obtenerIntervalosDisponibles,
    obtenerDuracionServicio,
    preciosServicios,
    actualizarPrecioServicio,
  } = useApp();

  const [seccion, setSeccion] = useState('inicio');
  const [menuOpen, setMenuOpen] = useState(false);

  // Nueva orden
  const [clienteTab, setClienteTab] = useState('existente');
  const [ordCliente, setOrdCliente] = useState('');

  // Campos estructurados de cliente (inline)
  const [ncDoc, setNcDoc] = useState('');
  const [ncPriNombre, setNcPriNombre] = useState('');
  const [ncSegNombre, setNcSegNombre] = useState('');
  const [ncPriApellido, setNcPriApellido] = useState('');
  const [ncSegApellido, setNcSegApellido] = useState('');
  const [ncTel, setNcTel] = useState('');
  const [ncEmail, setNcEmail] = useState('');
  const [ncViaTipo, setNcViaTipo] = useState('Calle');
  const [ncViaPri, setNcViaPri] = useState('');
  const [ncViaSec, setNcViaSec] = useState('');
  const [ncViaCruce, setNcViaCruce] = useState('');
  const [ncViaDet, setNcViaDet] = useState('');

  const [ordTipo, setOrdTipo] = useState('');
  const [ordTecnico, setOrdTecnico] = useState('');
  const [ordFecha, setOrdFecha] = useState('');
  const [ordHora, setOrdHora] = useState('08:00');
  const [ordDiag, setOrdDiag] = useState('');
  const [ordPrecio, setOrdPrecio] = useState('');
  const [ordenAlert, setOrdenAlert] = useState({ tipo: '', msg: '' });
  const [guardandoOrden, setGuardandoOrden] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [ordAires, setOrdAires] = useState([]);
  const [solicitudOrigenId, setSolicitudOrigenId] = useState(null);

  // Modal actualizar estado
  const [modalActualizar, setModalActualizar] = useState(false);
  const [servActual, setServActual] = useState(null);
  const [updEstado, setUpdEstado] = useState('agendado');
  const [updTecnico, setUpdTecnico] = useState('');
  const [updFecha, setUpdFecha] = useState('');
  const [updHora, setUpdHora] = useState('08:00');
  const [updError, setUpdError] = useState('');

  // Modal nuevo cliente
  const [modalCliente, setModalCliente] = useState(false);
  const [mncDoc, setMncDoc] = useState('');
  const [mncPriNombre, setMncPriNombre] = useState('');
  const [mncSegNombre, setMncSegNombre] = useState('');
  const [mncPriApellido, setMncPriApellido] = useState('');
  const [mncSegApellido, setMncSegApellido] = useState('');
  const [mncTel, setMncTel] = useState('');
  const [mncEmail, setMncEmail] = useState('');
  const [mncViaTipo, setMncViaTipo] = useState('Calle');
  const [mncViaPri, setMncViaPri] = useState('');
  const [mncViaSec, setMncViaSec] = useState('');
  const [mncViaCruce, setMncViaCruce] = useState('');
  const [mncViaDet, setMncViaDet] = useState('');
  const [clAlert, setClAlert] = useState('');
  const [tempPasswordModal, setTempPasswordModal] = useState('');

  // Modal editar precio servicio
  const [modalEditarPrecio, setModalEditarPrecio] = useState(false);
  const [precioSrvActual, setPrecioSrvActual] = useState(null);
  const [nuevoPrecioSrv, setNuevoPrecioSrv] = useState('');
  const [errorPrecioSrv, setErrorPrecioSrv] = useState('');

  // Utilidad para dividir nombres completos
  const dividirNombreCompleto = (nombreCompleto) => {
    const parts = (nombreCompleto || '').trim().split(/\s+/);
    let primerNombre = '';
    let segundoNombre = '';
    let primerApellido = '';
    let segundoApellido = '';
    
    if (parts.length === 1) {
      primerNombre = parts[0];
    } else if (parts.length === 2) {
      primerNombre = parts[0];
      primerApellido = parts[1];
    } else if (parts.length === 3) {
      primerNombre = parts[0];
      primerApellido = parts[1];
      segundoApellido = parts[2];
    } else if (parts.length >= 4) {
      primerNombre = parts[0];
      segundoNombre = parts[1];
      primerApellido = parts[2];
      segundoApellido = parts.slice(3).join(' ');
    }
    
    return { primerNombre, segundoNombre, primerApellido, segundoApellido };
  };

  useEffect(() => {
    if (!usuario || usuario.rol?.toLowerCase() !== 'secretaria') {
      navigate('/login');
    }
  }, [usuario, navigate]);

  if (!usuario || usuario.rol?.toLowerCase() !== 'secretaria') return null;

  const stats = calcularEstadisticasDelDia(servicios, clientes, tecnicos, repuestos);
  const sols = obtenerSolicitudesWeb();
  const pendientes = sols.filter(s => s.estado === 'pendiente');

  const tipoServicioEfectivo = useMemo(() => {
    return clienteTab === 'existente' ? (ordTipo || 'Mantenimiento') : ordTipo;
  }, [clienteTab, ordTipo]);

  const duracionOrden = useMemo(() => {
    if (ordAires && ordAires.length > 0) {
      return ordAires.reduce((sum, a) => sum + (Number(a.duracion) || 60), 0);
    }
    return obtenerDuracionServicio(tipoServicioEfectivo, ordDiag);
  }, [tipoServicioEfectivo, ordDiag, ordAires, obtenerDuracionServicio]);

  const intervalosOrden = useMemo(() => {
    if (!ordFecha || duracionOrden === 0) return [];
    return obtenerIntervalosDisponibles(ordFecha, duracionOrden);
  }, [ordFecha, duracionOrden, obtenerIntervalosDisponibles]);

  const disponibilidadOrden = useMemo(() => {
    if (!ordFecha || !ordHora) {
      return {
        disponibles: [],
        ocupados: [],
        totalActivos: 0,
        sinCupo: false,
        duracion: 0,
      };
    }

    return obtenerDisponibilidadTecnicos(ordFecha, ordHora, tipoServicioEfectivo, null, ordDiag, duracionOrden);
  }, [ordFecha, ordHora, tipoServicioEfectivo, ordDiag, duracionOrden, obtenerDisponibilidadTecnicos]);


  const duracionActualizar = useMemo(() => {
    return servActual ? obtenerDuracionServicio(servActual.tipo, servActual.diagnostico, servActual) : 0;
  }, [servActual, obtenerDuracionServicio]);

  const intervalosActualizar = useMemo(() => {
    if (!updFecha || duracionActualizar === 0) return [];
    return obtenerIntervalosDisponibles(updFecha, duracionActualizar);
  }, [updFecha, duracionActualizar, obtenerIntervalosDisponibles]);

  const disponibilidadActualizar = useMemo(() => {
    if (!servActual || !updFecha || !updHora) {
      return {
        disponibles: [],
        ocupados: [],
        totalActivos: 0,
        sinCupo: false,
        duracion: 0,
      };
    }

    return obtenerDisponibilidadTecnicos(updFecha, updHora, servActual.tipo, servActual.id, servActual.diagnostico, duracionActualizar);
  }, [updFecha, updHora, servActual, duracionActualizar, obtenerDisponibilidadTecnicos]);

  const limpiarFormularioOrden = () => {
    setOrdCliente('');
    setOrdTipo('');
    setOrdTecnico('');
    setOrdFecha('');
    setOrdHora('');
    setOrdDiag('');
    setOrdPrecio('');
    setNcDoc('');
    setNcPriNombre('');
    setNcSegNombre('');
    setNcPriApellido('');
    setNcSegApellido('');
    setNcTel('');
    setNcEmail('');
    setNcViaTipo('Calle');
    setNcViaPri('');
    setNcViaSec('');
    setNcViaCruce('');
    setNcViaDet('');
    setOrdAires([]);
    setSolicitudOrigenId(null);
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
        if (!ncDoc || !ncPriNombre || !ncPriApellido || !ncTel || !ncEmail) {
          setOrdenAlert({ tipo: 'error', msg: 'Completa Cédula, Primer Nombre, Primer Apellido, Teléfono y Email.' });
          return;
        }

        // Construir dirección estructurada
        let direccionConstruida = '';
        if (ncViaTipo === 'Manzana') {
          direccionConstruida = `Manzana ${ncViaPri} Casa ${ncViaSec}`;
        } else if (ncViaTipo === 'Kilómetro') {
          direccionConstruida = `Kilómetro ${ncViaPri} Vía ${ncViaSec}`;
        } else {
          direccionConstruida = `${ncViaTipo} ${ncViaPri}`;
          if (ncViaSec) direccionConstruida += ` # ${ncViaSec}`;
          if (ncViaCruce) direccionConstruida += ` - ${ncViaCruce}`;
        }
        if (ncViaDet) {
          direccionConstruida += `, ${ncViaDet}`;
        }
        direccionConstruida = direccionConstruida.trim();

        const resCliente = await agregarClienteInterno({
          documentoIdentidad: ncDoc.trim(),
          primerNombre: ncPriNombre.trim(),
          segundoNombre: ncSegNombre.trim(),
          primerApellido: ncPriApellido.trim(),
          segundoApellido: ncSegApellido.trim(),
          telefono: ncTel.trim(),
          direccion: direccionConstruida,
          email: ncEmail.trim(),
        });

        if (!resCliente?.cliente?.id) {
          setOrdenAlert({ tipo: 'error', msg: 'No se pudo crear el cliente.' });
          return;
        }

        clienteId = resCliente.cliente.id;
        passwordTemporalGenerada = resCliente.passwordTemporal || '';
        setTempPassword(passwordTemporalGenerada);
      }

      const tipoFinal = tipoServicioEfectivo;

      if (!tipoFinal || !ordFecha || !ordHora) {
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
        tipo: tipoFinal,
        diagnostico: ordDiag || '',
        fechaServicio: ordFecha,
        hora: formatearIntervaloBD(ordHora, duracionOrden),
        precioServicio: Number(ordPrecio) || 50000,
        notas: '',
        aires: ordAires.length > 0 ? JSON.stringify(ordAires) : null,
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

      if (solicitudOrigenId) {
        try {
          await actualizarSolicitudWeb(solicitudOrigenId, { estado: 'agendada' });
        } catch (error) {
          console.error("No se pudo actualizar el estado de la solicitud web:", error);
        }
      }

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
    setUpdTecnico(srv.tecnicoId ? String(srv.tecnicoId) : '');
    setUpdFecha(srv.fechaServicio ? String(srv.fechaServicio).split('T')[0] : '');
    setUpdHora(srv.hora || '08:00');
    setUpdError('');
    setModalActualizar(true);
  };

  const guardarEstado = async () => {
    if (!servActual) return;

    if (!updFecha || !updHora) {
      setUpdError('La fecha y hora son obligatorias.');
      return;
    }

    if (!updTecnico) {
      setUpdError('Selecciona un técnico.');
      return;
    }

    const esDisponible = disponibilidadActualizar.disponibles.some(
      t => String(t.id) === String(updTecnico)
    );

    if (!esDisponible) {
      setUpdError('El técnico seleccionado no está disponible en la fecha y hora indicadas.');
      return;
    }

    try {
      await actualizarServicio(servActual.id, {
        estado: updEstado,
        tecnicoId: Number(updTecnico),
        fechaServicio: updFecha,
        hora: formatearIntervaloBD(updHora, duracionActualizar)
      });
      setModalActualizar(false);
    } catch (e) {
      console.error('Error actualizando servicio:', e);
      setUpdError(e.message || 'Error al actualizar el servicio.');
    }
  };

  const guardarCliente = async () => {
    if (!mncDoc || !mncPriNombre || !mncPriApellido || !mncTel || !mncEmail) {
      setClAlert('Cédula, Primer Nombre, Primer Apellido, teléfono y email obligatorios.');
      return;
    }

    try {
      // Construir dirección estructurada
      let direccionConstruida = '';
      if (mncViaTipo === 'Manzana') {
        direccionConstruida = `Manzana ${mncViaPri} Casa ${mncViaSec}`;
      } else if (mncViaTipo === 'Kilómetro') {
        direccionConstruida = `Kilómetro ${mncViaPri} Vía ${mncViaSec}`;
      } else {
        direccionConstruida = `${mncViaTipo} ${mncViaPri}`;
        if (mncViaSec) direccionConstruida += ` # ${mncViaSec}`;
        if (mncViaCruce) direccionConstruida += ` - ${mncViaCruce}`;
      }
      if (mncViaDet) {
        direccionConstruida += `, ${mncViaDet}`;
      }
      direccionConstruida = direccionConstruida.trim();

      const res = await agregarClienteInterno({
        documentoIdentidad: mncDoc.trim(),
        primerNombre: mncPriNombre.trim(),
        segundoNombre: mncSegNombre.trim(),
        primerApellido: mncPriApellido.trim(),
        segundoApellido: mncSegApellido.trim(),
        telefono: mncTel.trim(),
        direccion: direccionConstruida,
        email: mncEmail.trim()
      });

      if (!res?.cliente?.id) {
        setClAlert('No se pudo guardar el cliente.');
        return;
      }

      setTempPasswordModal(res.passwordTemporal || '');
      setModalCliente(false);
      setMncDoc('');
      setMncPriNombre('');
      setMncSegNombre('');
      setMncPriApellido('');
      setMncSegApellido('');
      setMncTel('');
      setMncEmail('');
      setMncViaTipo('Calle');
      setMncViaPri('');
      setMncViaSec('');
      setMncViaCruce('');
      setMncViaDet('');
      setClAlert('');
    } catch (e) {
      setClAlert(e.message || 'No se pudo guardar el cliente.');
    }
  };

  const convertirEnOrden = (sol) => {
    setSeccion('nuevaOrden');
    setSolicitudOrigenId(sol.id);

    const clienteExistente = clientes.find(c =>
      (sol.email && c.email && c.email.toLowerCase() === sol.email.toLowerCase()) ||
      (sol.telefono && String(c.telefono) === String(sol.telefono))
    );

    if (clienteExistente) {
      setClienteTab('existente');
      setOrdCliente(String(clienteExistente.id));
    } else {
      setClienteTab('nuevo');
      setNcDoc('');
      
      const { primerNombre, segundoNombre, primerApellido, segundoApellido } = dividirNombreCompleto(sol.nombre);
      setNcPriNombre(primerNombre);
      setNcSegNombre(segundoNombre);
      setNcPriApellido(primerApellido);
      setNcSegApellido(segundoApellido);
      
      setNcTel(sol.telefono || '');
      setNcEmail(sol.email || '');
      
      // Guardar dirección original de la web en detalles
      setNcViaTipo('Calle');
      setNcViaPri('');
      setNcViaSec('');
      setNcViaCruce('');
      setNcViaDet(sol.direccion || '');
    }

    setOrdTipo(sol.tipo || '');
    setOrdFecha(sol.fechaSolicitud ? String(sol.fechaSolicitud).split('T')[0] : '');
    let horaInicio = sol.hora || '';
    if (horaInicio.includes('-')) {
      horaInicio = horaInicio.split('-')[0].trim();
    }
    setOrdHora(horaInicio);
    setOrdDiag(sol.problema || '');
    setOrdTecnico('');
    setOrdPrecio('');
    
    let list = [];
    if (sol.aires) {
      try {
        list = typeof sol.aires === 'string' ? JSON.parse(sol.aires) : sol.aires;
      } catch (e) {
        console.error('Error parsing sol.aires:', e);
      }
    }
    setOrdAires(list);
    
    setOrdenAlert({ tipo: '', msg: '' });
    setTempPassword('');
  };

  const irA = (sec) => {
    setSeccion(sec);
    setOrdenAlert({ tipo: '', msg: '' });
    setTempPassword('');
    setSolicitudOrigenId(null);
  };

  // Auto-llenado de precio basado en tipo de servicio
  useEffect(() => {
    if (tipoServicioEfectivo) {
      const match = preciosServicios.find(
        p => String(p.nombre).toLowerCase().trim() === String(tipoServicioEfectivo).toLowerCase().trim()
      );
      if (match) {
        setOrdPrecio(String(match.precio));
      }
    }
  }, [tipoServicioEfectivo, preciosServicios]);

  const abrirEditarPrecio = (ps) => {
    setPrecioSrvActual(ps);
    setNuevoPrecioSrv(String(ps.precio));
    setErrorPrecioSrv('');
    setModalEditarPrecio(true);
  };

  const guardarPrecioServicio = async () => {
    if (!precioSrvActual) return;
    if (!nuevoPrecioSrv || isNaN(Number(nuevoPrecioSrv)) || Number(nuevoPrecioSrv) < 0) {
      setErrorPrecioSrv('Ingrese un precio válido mayor o igual a 0.');
      return;
    }
    try {
      await actualizarPrecioServicio(precioSrvActual.id, Number(nuevoPrecioSrv));
      setModalEditarPrecio(false);
    } catch (e) {
      setErrorPrecioSrv(e.message || 'Error al actualizar la tarifa.');
    }
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
                      servicios={servicios.filter(s => s.estado !== 'cerrado').slice(-5).reverse()}
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
                      <p style={{ color: 'var(--theme-text-muted)', fontSize: 13, textAlign: 'center', margin: '10px 0' }}>Sin solicitudes pendientes</p>
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
                            <strong>{s.nombre}</strong>
                            <span style={{ color: 'var(--theme-text-muted)', marginLeft: 4 }}>— {s.tipo}</span>
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
                      {/* Cédula y Teléfono */}
                      <div className="form-row">
                        <div className="form-group">
                          <label>Cédula / Documento *</label>
                          <input value={ncDoc} onChange={e => setNcDoc(e.target.value)} placeholder="Ej. 1065123456" />
                        </div>
                        <div className="form-group">
                          <label>Teléfono *</label>
                          <input value={ncTel} onChange={e => setNcTel(e.target.value)} placeholder="Ej. 3001234567" />
                        </div>
                      </div>

                      {/* Nombres */}
                      <div className="form-row">
                        <div className="form-group">
                          <label>Primer Nombre *</label>
                          <input value={ncPriNombre} onChange={e => setNcPriNombre(e.target.value)} placeholder="Ej. Juan" />
                        </div>
                        <div className="form-group">
                          <label>Segundo Nombre</label>
                          <input value={ncSegNombre} onChange={e => setNcSegNombre(e.target.value)} placeholder="Ej. Carlos" />
                        </div>
                      </div>

                      {/* Apellidos */}
                      <div className="form-row">
                        <div className="form-group">
                          <label>Primer Apellido *</label>
                          <input value={ncPriApellido} onChange={e => setNcPriApellido(e.target.value)} placeholder="Ej. Pérez" />
                        </div>
                        <div className="form-group">
                          <label>Segundo Apellido</label>
                          <input value={ncSegApellido} onChange={e => setNcSegApellido(e.target.value)} placeholder="Ej. Rodríguez" />
                        </div>
                      </div>

                      {/* Constructor de Dirección */}
                      <div style={{ background: 'var(--theme-bg-panel-header)', padding: '15px', borderRadius: '12px', border: '1px solid var(--theme-border-color)', marginBottom: '15px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--theme-accent-color)', display: 'block', marginBottom: '10px' }}>
                          📍 Constructor de Dirección
                        </label>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '11px' }}>Tipo de Vía</label>
                            <select value={ncViaTipo} onChange={e => setNcViaTipo(e.target.value)} style={{ width: '100%', background: 'var(--theme-input-bg, rgba(15, 23, 42, 0.6))', color: 'var(--theme-text-primary, #ffffff)', border: '1px solid var(--theme-border-color, rgba(123, 178, 255, 0.18))', borderRadius: '6px', padding: '8px' }}>
                              <option value="Calle">Calle</option>
                              <option value="Carrera">Carrera</option>
                              <option value="Avenida">Avenida</option>
                              <option value="Transversal">Transversal</option>
                              <option value="Diagonal">Diagonal</option>
                              <option value="Manzana">Manzana</option>
                              <option value="Kilómetro">Kilómetro</option>
                            </select>
                          </div>
                          
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '11px' }}>
                              {ncViaTipo === 'Manzana' ? 'Letra Manz.' : ncViaTipo === 'Kilómetro' ? 'Km #' : 'Vía Principal'}
                            </label>
                            <input value={ncViaPri} onChange={e => setNcViaPri(e.target.value)} placeholder={ncViaTipo === 'Manzana' ? 'A' : '15'} style={{ padding: '8px' }} />
                          </div>
                          
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '11px' }}>
                              {ncViaTipo === 'Manzana' ? 'Casa #' : ncViaTipo === 'Kilómetro' ? 'Destino' : 'Vía Secund.'}
                            </label>
                            <input value={ncViaSec} onChange={e => setNcViaSec(e.target.value)} placeholder={ncViaTipo === 'Manzana' ? '12' : '4'} style={{ padding: '8px' }} />
                          </div>
                          
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '11px' }}>
                              {['Manzana', 'Kilómetro'].includes(ncViaTipo) ? 'N/A' : 'Placa / Cruce'}
                            </label>
                            <input value={ncViaCruce} onChange={e => setNcViaCruce(e.target.value)} placeholder="20" disabled={['Manzana', 'Kilómetro'].includes(ncViaTipo)} style={{ padding: '8px' }} />
                          </div>
                        </div>
                        
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '11px' }}>Barrio, Conjunto, Apto o Detalles Adicionales</label>
                          <input value={ncViaDet} onChange={e => setNcViaDet(e.target.value)} placeholder="Ej. Barrio Centro, Apt 301" style={{ padding: '8px' }} />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Email *</label>
                        <input type="email" value={ncEmail} onChange={e => setNcEmail(e.target.value)} placeholder="correo@ejemplo.com" />
                      </div>
                    </>
                  )}

                  <hr style={{ border: 'none', borderTop: '1px solid rgba(123, 178, 255, 0.15)', margin: '16px 0' }} />

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
                      <label>Hora (Intervalos) *</label>
                      <select
                        value={ordHora}
                        onChange={e => {
                          setOrdHora(e.target.value);
                          setOrdTecnico('');
                        }}
                        disabled={!ordFecha || intervalosOrden.length === 0}
                      >
                        <option value="">Seleccionar intervalo...</option>
                        {intervalosOrden.map(inv => (
                          <option key={inv.inicio} value={inv.inicio}>{inv.etiqueta}</option>
                        ))}
                      </select>
                      {ordFecha && intervalosOrden.length === 0 && tipoServicioEfectivo && (
                        <small style={{ color: 'var(--theme-alert-error-text)', marginTop: '4px', display: 'block' }}>
                          No hay horarios disponibles para {duracionOrden} min.
                        </small>
                      )}
                    </div>
                  </div>

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
                        disabled={!tipoServicioEfectivo || !ordFecha || !ordHora || disponibilidadOrden.disponibles.length === 0}
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

                  {ordFecha && (
                    <div className="ad-panel" style={{ marginBottom: 16, background: 'var(--theme-bg-panel-header)' }}>
                      <div className="ad-panel-body" style={{ padding: 14 }}>
                        {!tipoServicioEfectivo ? (
                          <p style={{ margin: 0, color: 'var(--theme-text-muted)' }}>
                            Selecciona el tipo de servicio para calcular la duración del trabajo.
                          </p>
                        ) : !ordHora ? (
                          <p style={{ margin: 0, color: 'var(--theme-text-muted)' }}>
                            Selecciona la hora para validar los técnicos disponibles.
                          </p>
                        ) : (
                          <>
                            <p style={{ margin: '0 0 10px 0', color: 'var(--theme-text-primary)', fontWeight: 600 }}>
                              Disponibilidad para {formatearFecha(ordFecha)} a las {ordHora}
                            </p>

                            {disponibilidadOrden.disponibles.length > 0 ? (
                              <div style={{ marginBottom: 8, color: 'var(--theme-alert-success-text)' }}>
                                ✅ Disponibles: {disponibilidadOrden.disponibles.map(t => t.nombre).join(', ')}
                              </div>
                            ) : (
                              <div style={{ marginBottom: 8, color: 'var(--theme-alert-error-text)' }}>
                                ❌ No hay técnicos disponibles para este horario.
                              </div>
                            )}

                            {disponibilidadOrden.ocupados.length > 0 && (
                              <div style={{ color: 'var(--theme-text-muted)' }}>
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

                  {ordAires.length > 0 && (
                    <div className="form-group">
                      <label>Aires acondicionados a revisar ({ordAires.length})</label>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        padding: '12px',
                        background: 'rgba(30, 41, 59, 0.25)',
                        borderRadius: '8px',
                        border: '1px solid rgba(123, 178, 255, 0.15)',
                        marginBottom: '12px'
                      }}>
                        {ordAires.map((aire, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              background: 'rgba(15, 23, 42, 0.45)',
                              padding: '6px 12px',
                              borderRadius: '20px',
                              border: '1px solid rgba(123, 178, 255, 0.25)',
                              fontSize: '13px',
                              color: '#d9e7f5',
                              fontWeight: '500'
                            }}
                          >
                            ❄️ {aire.tipoAire}: {aire.tipoServicio} ({aire.duracion} min)
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
                  servicios={servicios.filter(s => s.estado !== 'cerrado')}
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
                    {pendientes.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="ad-empty-row">
                          No hay solicitudes
                        </td>
                      </tr>
                    ) : (
                      pendientes.map(s => (
                        <tr key={s.id}>
                          <td><strong>{s.nombre}</strong></td>
                          <td>{s.telefono}</td>
                          <td className="ad-muted">{s.email || '—'}</td>
                          <td>{s.tipo}</td>
                          <td>{formatearFecha(s.fechaSolicitud)}</td>
                          <td>{s.hora || '—'}</td>
                          <td>
                            {(() => {
                              let list = [];
                              if (s.aires) {
                                try {
                                  list = typeof s.aires === 'string' ? JSON.parse(s.aires) : s.aires;
                                } catch {}
                              }
                              if (list.length > 0) {
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {list.map((a, i) => (
                                      <span key={i} style={{ fontSize: '12px', color: 'var(--theme-text-muted)' }}>
                                        ❄️ {a.tipoAire}: {a.tipoServicio}
                                      </span>
                                    ))}
                                    {s.problema && <small style={{ color: 'var(--theme-text-muted)', display: 'block', marginTop: '2px' }}>"{s.problema}"</small>}
                                  </div>
                                );
                              }
                              return s.diagnostico || s.problema || '—';
                            })()}
                          </td>
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
                        <td><strong>{r.nombre}</strong></td>
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

        {seccion === 'precios' && (
          <div className="ad-section">
            <div className="ad-panel">
              <div className="ad-panel-header">
                <h3>💰 Gestión de Tarifas de Servicios</h3>
              </div>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Servicio</th>
                      <th>Tarifa Base (COP)</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preciosServicios.map(ps => (
                      <tr key={ps.id}>
                        <td><strong>{ps.nombre}</strong></td>
                        <td className="ad-money" style={{ color: 'var(--theme-accent-color)', fontWeight: 'bold' }}>{formatearPeso(ps.precio)}</td>
                        <td>
                          <button className="ad-btn-sm" onClick={() => abrirEditarPrecio(ps)}>
                            ✏️ Editar Precio
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
      </div>

      {modalActualizar && (
        <Modal
          titulo="Actualizar y Re-agendar Servicio"
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
          {updError && <div className="alert alert-error">⚠️ {updError}</div>}

          <div className="form-group">
            <label>Estado del Servicio</label>
            <select value={updEstado} onChange={e => setUpdEstado(e.target.value)}>
              <option value="agendado">Agendado</option>
              <option value="en-camino">En Camino</option>
              <option value="en-reparacion">En Reparación</option>
              <option value="finalizado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fecha</label>
              <input
                type="date"
                value={updFecha}
                onChange={e => {
                  setUpdFecha(e.target.value);
                  setUpdError('');
                }}
              />
            </div>

            <div className="form-group">
              <label>Hora (Intervalos)</label>
              <select
                value={updHora}
                onChange={e => {
                  setUpdHora(e.target.value);
                  setUpdError('');
                  setUpdTecnico('');
                }}
                disabled={!updFecha || intervalosActualizar.length === 0}
              >
                <option value="">Seleccionar intervalo...</option>
                {intervalosActualizar.map(inv => (
                  <option key={inv.inicio} value={inv.inicio}>{inv.etiqueta}</option>
                ))}
              </select>
              {updFecha && intervalosActualizar.length === 0 && servActual && (
                <small style={{ color: '#ff7b7b', marginTop: '4px', display: 'block' }}>
                  No hay horarios disponibles para {duracionActualizar} min.
                </small>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Técnico Asignado</label>
            <select
              value={updTecnico}
              onChange={e => {
                setUpdTecnico(e.target.value);
                setUpdError('');
              }}
              disabled={!updFecha || !updHora}
            >
              <option value="">Seleccionar técnico...</option>
              {disponibilidadActualizar.disponibles.map(t => (
                <option key={t.id} value={t.id}>
                  {t.nombre} (Disponible)
                </option>
              ))}
              {disponibilidadActualizar.ocupados.map(t => (
                <option key={t.id} value={t.id} disabled>
                  {t.nombre} (Ocupado)
                </option>
              ))}
            </select>
          </div>

          {updFecha && servActual && (
            <div style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 6,
              background: 'var(--theme-bg-panel-header)',
              fontSize: 12,
              color: 'var(--theme-text-muted)',
              border: '1px solid var(--theme-border-color)'
            }}>
              <span style={{ fontWeight: 600, color: 'var(--theme-text-primary)', display: 'block', marginBottom: 4 }}>
                Resumen de disponibilidad:
              </span>
              {disponibilidadActualizar.disponibles.length > 0 ? (
                <span style={{ color: 'var(--theme-alert-success-text)' }}>
                  ✅ Técnicos disponibles: {disponibilidadActualizar.disponibles.map(t => t.nombre).join(', ')}
                </span>
              ) : (
                <span style={{ color: 'var(--theme-alert-error-text)' }}>
                  ❌ No hay técnicos disponibles para este horario.
                </span>
              )}
            </div>
          )}
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

          {/* Cédula y Teléfono */}
          <div className="form-row">
            <div className="form-group">
              <label>Cédula / Documento *</label>
              <input value={mncDoc} onChange={e => setMncDoc(e.target.value)} placeholder="Ej. 1065123456" />
            </div>
            <div className="form-group">
              <label>Teléfono *</label>
              <input value={mncTel} onChange={e => setMncTel(e.target.value)} placeholder="Ej. 3001234567" />
            </div>
          </div>

          {/* Nombres */}
          <div className="form-row">
            <div className="form-group">
              <label>Primer Nombre *</label>
              <input value={mncPriNombre} onChange={e => setMncPriNombre(e.target.value)} placeholder="Ej. Juan" />
            </div>
            <div className="form-group">
              <label>Segundo Nombre</label>
              <input value={mncSegNombre} onChange={e => setMncSegNombre(e.target.value)} placeholder="Ej. Carlos" />
            </div>
          </div>

          {/* Apellidos */}
          <div className="form-row">
            <div className="form-group">
              <label>Primer Apellido *</label>
              <input value={mncPriApellido} onChange={e => setMncPriApellido(e.target.value)} placeholder="Ej. Pérez" />
            </div>
            <div className="form-group">
              <label>Segundo Apellido</label>
              <input value={mncSegApellido} onChange={e => setMncSegApellido(e.target.value)} placeholder="Ej. Rodríguez" />
            </div>
          </div>

          {/* Constructor de Dirección */}
          <div style={{ background: 'var(--theme-bg-panel-header)', padding: '15px', borderRadius: '12px', border: '1px solid var(--theme-border-color)', marginBottom: '15px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--theme-accent-color)', display: 'block', marginBottom: '10px' }}>
              📍 Constructor de Dirección
            </label>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px' }}>Tipo de Vía</label>
                <select value={mncViaTipo} onChange={e => setMncViaTipo(e.target.value)} style={{ width: '100%', background: 'var(--theme-input-bg, rgba(15, 23, 42, 0.6))', color: 'var(--theme-text-primary, #ffffff)', border: '1px solid var(--theme-border-color, rgba(123, 178, 255, 0.18))', borderRadius: '6px', padding: '8px' }}>
                  <option value="Calle">Calle</option>
                  <option value="Carrera">Carrera</option>
                  <option value="Avenida">Avenida</option>
                  <option value="Transversal">Transversal</option>
                  <option value="Diagonal">Diagonal</option>
                  <option value="Manzana">Manzana</option>
                  <option value="Kilómetro">Kilómetro</option>
                </select>
              </div>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px' }}>
                  {mncViaTipo === 'Manzana' ? 'Letra Manz.' : mncViaTipo === 'Kilómetro' ? 'Km #' : 'Vía Principal'}
                </label>
                <input value={mncViaPri} onChange={e => setMncViaPri(e.target.value)} placeholder={mncViaTipo === 'Manzana' ? 'A' : '15'} style={{ padding: '8px' }} />
              </div>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px' }}>
                  {mncViaTipo === 'Manzana' ? 'Casa #' : mncViaTipo === 'Kilómetro' ? 'Destino' : 'Vía Secund.'}
                </label>
                <input value={mncViaSec} onChange={e => setMncViaSec(e.target.value)} placeholder={mncViaTipo === 'Manzana' ? '12' : '4'} style={{ padding: '8px' }} />
              </div>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px' }}>
                  {['Manzana', 'Kilómetro'].includes(mncViaTipo) ? 'N/A' : 'Placa / Cruce'}
                </label>
                <input value={mncViaCruce} onChange={e => setMncViaCruce(e.target.value)} placeholder="20" disabled={['Manzana', 'Kilómetro'].includes(mncViaTipo)} style={{ padding: '8px' }} />
              </div>
            </div>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '11px' }}>Barrio, Conjunto, Apto o Detalles Adicionales</label>
              <input value={mncViaDet} onChange={e => setMncViaDet(e.target.value)} placeholder="Ej. Barrio Centro, Apt 301" style={{ padding: '8px' }} />
            </div>
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input type="email" value={mncEmail} onChange={e => setMncEmail(e.target.value)} placeholder="correo@ejemplo.com" />
          </div>
        </Modal>
      )}

      {modalEditarPrecio && precioSrvActual && (
        <Modal
          titulo={`Editar Tarifa — ${precioSrvActual.nombre}`}
          onClose={() => setModalEditarPrecio(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalEditarPrecio(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={guardarPrecioServicio}>
                Guardar
              </button>
            </>
          }
        >
          {errorPrecioSrv && <div className="alert alert-error">⚠️ {errorPrecioSrv}</div>}

          <div className="form-group">
            <label>Tarifa Base (COP)</label>
            <input
              type="number"
              value={nuevoPrecioSrv}
              onChange={e => setNuevoPrecioSrv(e.target.value)}
              placeholder="Ej. 80000"
              min="0"
            />
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
                <td>
                  <div>
                    <strong>{sv.tipo}</strong>
                    {sv.airesList && sv.airesList.length > 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginTop: '2px' }}>
                        {sv.airesList.map((a, i) => `${a.tipoAire} (${a.tipoServicio.substring(0, 3)}.)`).join(', ')}
                      </div>
                    )}
                  </div>
                </td>
                <td className="ad-muted">{formatearFecha(sv.fechaServicio)} {calcularIntervaloEtiqueta(sv.hora, sv.duracionForzada)}</td>
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