import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../api';

const CLAVE_SESION = 'rfrm_sesion';
const CLAVE_SESION_CLIENTE = 'rfrm_cliente_sesion';
const POLL_INTERVAL = 8000;

const AppContext = createContext(null);

// Utilidades públicas
export function formatearPeso(valor) {
  return '$' + Number(valor || 0).toLocaleString('es-CO');
}

export function formatearFecha(fecha) {
  if (!fecha) return '—';
  const base = String(fecha).split('T')[0];
  const d = new Date(base + 'T00:00:00');
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function generarPassword(nombre) {
  const base = String(nombre || '').trim().split(' ')[0].toLowerCase();
  return base + Math.floor(1000 + Math.random() * 9000);
}

export function totalServicio(servicio, repuestos) {
  let total = Number(servicio?.precioServicio) || 0;
  const rus = Array.isArray(servicio?.repuestos) ? servicio.repuestos : [];
  rus.forEach(r => {
    const rep = repuestos.find(x => Number(x.id) === Number(r.repuestoId));
    if (rep) {
      total += Number(rep.precio || 0) * Number(r.cantidad || 0);
    }
  });
  return total;
}

// Helpers internos
function normalizarRol(valor) {
  const v = String(valor || '').trim().toLowerCase();

  if (v === 'administrador' || v === 'admin') return 'admin';
  if (v === 'secretaria' || v === 'secretaría') return 'secretaria';
  if (v === 'tecnico' || v === 'técnico') return 'tecnico';
  if (v === 'cliente') return 'cliente';

  return v;
}

function normalizarEstado(valor) {
  const v = String(valor || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');

  if (['completado', 'completada', 'completados', 'finalizado', 'finalizada', 'finalizados'].includes(v)) {
    return 'finalizado';
  }

  if (v === 'en-camino') return 'en-camino';
  if (v === 'en-reparacion' || v === 'en-reparación') return 'en-reparacion';
  if (v === 'agendado') return 'agendado';
  if (v === 'cancelado') return 'cancelado';

  return v;
}

function normalizarFecha(valor) {
  if (!valor) return '';
  return String(valor).split('T')[0];
}

function normalizarTipoServicio(tipo) {
  return String(tipo || '').trim().toLowerCase();
}

function obtenerDuracionServicio(tipo) {
  const t = normalizarTipoServicio(tipo);

  if (t === 'mantenimiento') return 60;
  if (t === 'reparación' || t === 'reparacion') return 120;
  if (t === 'recarga') return 30;
  if (t === 'instalación' || t === 'instalacion') return 60;
  if (t === 'revisión' || t === 'revision') return 30;

  return 60;
}

function horaAMinutos(hora) {
  if (!hora) return 0;
  const [h, m] = String(hora).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function rangosSeCruzan(inicioA, finA, inicioB, finB) {
  return inicioA < finB && inicioB < finA;
}

function normalizarUsuario(u) {
  return {
    ...u,
    id: Number(u.id ?? u.Id ?? 0),
    nombre: u.nombre ?? u.Nombre ?? '',
    correo: u.correo ?? u.Correo ?? '',
    password: u.password ?? u.Password ?? '',
    rol: normalizarRol(u.rol ?? u.Rol ?? ''),
    disponible: Boolean(u.disponible ?? u.Disponible ?? true),
    Token: u.token ?? u.Token ?? null,
  };
}

function normalizarCliente(c) {
  return {
    ...c,
    id: Number(c.id ?? c.Id ?? 0),
    nombre: c.nombre ?? c.Nombre ?? '',
    telefono: c.telefono ?? c.Telefono ?? '',
    direccion: c.direccion ?? c.Direccion ?? '',
    email: c.email ?? c.Email ?? '',
    Token: c.token ?? c.Token ?? null,
  };
}

function normalizarServicio(s) {
  return {
    ...s,
    id: Number(s.id ?? s.Id ?? 0),
    clienteId: Number(s.clienteId ?? s.ClienteId ?? 0),
    clienteNombre: s.clienteNombre ?? s.ClienteNombre ?? '',
    tecnicoId: Number(s.tecnicoId ?? s.TecnicoId ?? 0),
    tecnicoNombre: s.tecnicoNombre ?? s.TecnicoNombre ?? '',
    tipo: s.tipo ?? s.Tipo ?? '',
    diagnostico: s.diagnostico ?? s.Diagnostico ?? '',
    fechaServicio: normalizarFecha(s.fechaServicio ?? s.FechaServicio ?? s.fecha ?? s.Fecha ?? ''),
    hora: s.hora ?? s.Hora ?? '08:00',
    estado: normalizarEstado(s.estado ?? s.Estado ?? 'agendado'),
    precioServicio: Number(s.precioServicio ?? s.PrecioServicio ?? 0),
    notas: s.notas ?? s.Notas ?? '',
    repuestos: Array.isArray(s.repuestos)
      ? s.repuestos.map(r => ({
          repuestoId: Number(r.repuestoId ?? r.RepuestoId ?? 0),
          nombre: r.nombre ?? r.Nombre ?? '',
          cantidad: Number(r.cantidad ?? r.Cantidad ?? 0),
        }))
      : [],
  };
}

function calcularRepuestosUsados(servicios) {
  return servicios.reduce((sum, s) => {
    const rus = Array.isArray(s.repuestos) ? s.repuestos : [];
    return sum + rus.reduce((a, r) => a + Number(r.cantidad || 0), 0);
  }, 0);
}

export function calcularEstadisticas(servicios, clientes, tecnicos, repuestos) {
  const lista = Array.isArray(servicios) ? servicios.map(normalizarServicio) : [];
  const finalizados = lista.filter(s => normalizarEstado(s.estado) === 'finalizado');
  const ingresos = finalizados.reduce((sum, s) => sum + totalServicio(s, repuestos), 0);

  return {
    agendados: lista.filter(s => normalizarEstado(s.estado) === 'agendado').length,
    enCamino: lista.filter(s => normalizarEstado(s.estado) === 'en-camino').length,
    enReparacion: lista.filter(s => normalizarEstado(s.estado) === 'en-reparacion').length,
    finalizados: finalizados.length,
    cancelados: lista.filter(s => normalizarEstado(s.estado) === 'cancelado').length,
    totalServicios: lista.length,
    totalClientes: clientes.length,
    totalTecnicos: tecnicos.length,
    tecnicosDisp: tecnicos.filter(t => t.disponible).length,
    ingresos,
    repuestosUsados: calcularRepuestosUsados(lista),
    totalPagadoTecnicos: 0,
    gananciaNeta: ingresos,
  };
}

export function calcularEstadisticasDelDia(servicios, clientes, tecnicos, repuestos) {
  return calcularEstadisticas(servicios, clientes, tecnicos, repuestos);
}

// Provider
export function AppProvider({ children }) {
  const [usuarios, setUsuarios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const pollRef = useRef(null);

  const [usuario, setUsuario] = useState(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem(CLAVE_SESION));
      return guardado ? normalizarUsuario(guardado) : null;
    } catch {
      return null;
    }
  });

  const [cliente, setCliente] = useState(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem(CLAVE_SESION_CLIENTE));
      return guardado ? normalizarCliente(guardado) : null;
    } catch {
      return null;
    }
  });

  const cargarTodo = useCallback(async (mostrarCarga = true) => {
    if (mostrarCarga) setCargando(true);

    try {
      const [u, c, r, s, sol] = await Promise.all([
        api.get('usuarios'),
        api.get('clientes'),
        api.get('repuestos'),
        api.get('servicios'),
        api.get('solicitudes'),
      ]);

      setUsuarios((Array.isArray(u) ? u : []).map(normalizarUsuario));
      setClientes((Array.isArray(c) ? c : []).map(normalizarCliente));
      setRepuestos(Array.isArray(r) ? r : []);
      setServicios((Array.isArray(s) ? s : []).map(normalizarServicio));
      setSolicitudes(Array.isArray(sol) ? sol : []);
    } catch (e) {
      console.error('Error cargando datos iniciales:', e);

      if (mostrarCarga) {
        setUsuarios([]);
        setClientes([]);
        setRepuestos([]);
        setServicios([]);
        setSolicitudes([]);
      }
    } finally {
      if (mostrarCarga) setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarTodo(true);
  }, [cargarTodo]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (usuario || cliente) {
        cargarTodo(false);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [cargarTodo, usuario, cliente]);

  const login = async (correo, password) => {
    try {
      const respuesta = await api.post('usuarios/login', { correo, password });
      const datosUsuario =
        respuesta && (respuesta.id || respuesta.token || respuesta.Token)
          ? (respuesta.data || respuesta)
          : null;

      if (!datosUsuario) return null;

      const usuarioNormalizado = normalizarUsuario(datosUsuario);
      localStorage.setItem(CLAVE_SESION, JSON.stringify(usuarioNormalizado));
      setUsuario(usuarioNormalizado);

      await cargarTodo(false);
      return usuarioNormalizado;
    } catch (e) {
      console.error('Error en login con JWT:', e);
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem(CLAVE_SESION);
    setUsuario(null);
  };

  const registrarCliente = async (datos) => {
    try {
      const res = await fetch('http://localhost:5213/api/clientes/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Nombre: datos.nombre,
          Telefono: datos.telefono,
          Direccion: datos.direccion || '',
          Email: datos.email,
          Password: datos.password,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        return { ok: false, mensaje: err.mensaje || 'Error al registrarse.' };
      }

      const nuevo = normalizarCliente(await res.json());
      setClientes(prev => [...prev, nuevo]);
      localStorage.setItem(CLAVE_SESION_CLIENTE, JSON.stringify(nuevo));
      setCliente(nuevo);
      return { ok: true, cliente: nuevo };
    } catch (e) {
      console.error('Error en registrarCliente:', e);
      return { ok: false, mensaje: 'No se pudo conectar al servidor.' };
    }
  };

  const agregarClienteInterno = async (datos) => {
    const res = await api.post('clientes/registro-interno', {
      nombre: datos.nombre,
      telefono: datos.telefono,
      direccion: datos.direccion || '',
      email: datos.email || '',
    });

    const normalizado = normalizarCliente(res.cliente);
    setClientes(prev => [...prev, normalizado]);

    return {
      cliente: normalizado,
      passwordTemporal: res.passwordTemporal,
      mensaje: res.mensaje,
    };
  };

  const loginCliente = async (email, password) => {
    try {
      const res = await fetch('http://localhost:5213/api/clientes/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Email: email,
          Password: password,
        }),
      });

      if (!res.ok) return null;

      const c = normalizarCliente(await res.json());
      localStorage.setItem(CLAVE_SESION_CLIENTE, JSON.stringify(c));
      setCliente(c);

      await cargarTodo(false);
      return c;
    } catch (e) {
      console.error('Error en loginCliente:', e);
      return null;
    }
  };

  const logoutCliente = () => {
    localStorage.removeItem(CLAVE_SESION_CLIENTE);
    setCliente(null);
  };

  const obtenerDisponibilidadTecnicos = (fecha, hora = '', tipo = '', excluirServicioId = null) => {
    const fechaNorm = normalizarFecha(fecha);

    if (!fechaNorm) {
      return {
        disponibles: [],
        ocupados: [],
        totalActivos: 0,
        sinCupo: false,
      };
    }

    const tecnicosActivos = usuarios.filter(
      u => normalizarRol(u.rol) === 'tecnico' && u.disponible
    );

    const serviciosActivos = servicios.filter(s => {
      const estado = normalizarEstado(s.estado);
      const fechaServicio = normalizarFecha(s.fechaServicio ?? s.fecha);
      return (
        fechaServicio === fechaNorm &&
        estado !== 'finalizado' &&
        estado !== 'cancelado' &&
        (!excluirServicioId || Number(s.id) !== Number(excluirServicioId))
      );
    });

    if (!hora || !tipo) {
      return {
        disponibles: tecnicosActivos,
        ocupados: [],
        totalActivos: tecnicosActivos.length,
        sinCupo: tecnicosActivos.length === 0,
      };
    }

    const inicioNuevo = horaAMinutos(hora);
    const finNuevo = inicioNuevo + obtenerDuracionServicio(tipo);

    const ocupados = tecnicosActivos.filter(tec =>
      serviciosActivos.some(s => {
        if (Number(s.tecnicoId) !== Number(tec.id)) return false;

        const inicioExistente = horaAMinutos(s.hora);
        const finExistente = inicioExistente + obtenerDuracionServicio(s.tipo);

        return rangosSeCruzan(inicioNuevo, finNuevo, inicioExistente, finExistente);
      })
    );

    const disponibles = tecnicosActivos.filter(
      t => !ocupados.some(o => Number(o.id) === Number(t.id))
    );

    return {
      disponibles,
      ocupados,
      totalActivos: tecnicosActivos.length,
      sinCupo: disponibles.length === 0,
      inicioNuevo,
      finNuevo,
      duracion: obtenerDuracionServicio(tipo),
    };
  };

  const agregarServicio = async (datos) => {
    const nuevo = await api.post('servicios', {
      clienteId: Number(datos.clienteId),
      tecnicoId: Number(datos.tecnicoId),
      tipo: datos.tipo,
      diagnostico: datos.diagnostico || '',
      fechaServicio: datos.fechaServicio || datos.fecha,
      hora: datos.hora || '08:00',
      estado: 'agendado',
      precioServicio: Number(datos.precioServicio) || 50000,
      notas: datos.notas || '',
      repuestos: Array.isArray(datos.repuestos) ? datos.repuestos : [],
    });

    const parsed = normalizarServicio(nuevo);
    setServicios(prev => [...prev, parsed]);
    return parsed;
  };

  const actualizarServicio = async (id, cambios) => {
    try {
      const payload = { ...cambios };

      if ('estado' in payload) {
        payload.estado = normalizarEstado(payload.estado);
      }

      if ('precioServicio' in payload) {
        payload.precioServicio = Number(payload.precioServicio || 0);
      }

      if ('fechaServicio' in payload) {
        payload.fechaServicio = normalizarFecha(payload.fechaServicio);
      }

      if ('tecnicoId' in payload) {
        payload.tecnicoId = Number(payload.tecnicoId);
      }

      if ('repuestos' in payload && Array.isArray(payload.repuestos)) {
        payload.repuestos = payload.repuestos.map(r => ({
          repuestoId: Number(r.repuestoId),
          cantidad: Number(r.cantidad),
        }));
      }

      await api.patch('servicios', id, payload);

      const svs = await api.get('servicios');
      const listaActualizada = (Array.isArray(svs) ? svs : []).map(normalizarServicio);
      setServicios(listaActualizada);

      return listaActualizada.find(s => Number(s.id) === Number(id)) || null;
    } catch (e) {
      console.error('Error actualizarServicio:', e);
      throw e;
    }
  };

  const agregarTecnico = async (datos) => {
    const nuevo = await api.post('usuarios', {
      nombre: datos.nombre,
      correo: datos.correo,
      passwordHash: datos.password || 'tec123',
      rol: 'tecnico',
      disponible: true,
    });

    const normalizado = normalizarUsuario(nuevo);
    setUsuarios(prev => [...prev, normalizado]);
    return normalizado;
  };

  const toggleDisponible = async (id) => {
    const tec = usuarios.find(u => Number(u.id) === Number(id));
    if (!tec) return;

    const actualizado = await api.patch('usuarios', id, {
      disponible: !tec.disponible,
    });

    const normalizado = normalizarUsuario(actualizado);

    setUsuarios(prev =>
      prev.map(u => (Number(u.id) === Number(id) ? { ...u, disponible: normalizado.disponible } : u))
    );
  };

  const actualizarPrecioRepuesto = async (id, nuevoPrecio) => {
    const actualizado = await api.patch('repuestos', id, { precio: nuevoPrecio });

    setRepuestos(prev =>
      prev.map(r => (Number(r.id) === Number(id) ? actualizado : r))
    );
  };

  const obtenerSolicitudesWeb = () => solicitudes;

  const agregarSolicitudWeb = async (datos) => {
    const sol = await api.post('solicitudes', {
      nombre: datos.nombre,
      telefono: datos.telefono,
      direccion: datos.direccion || '',
      email: datos.email,
      tipo: datos.tipo,
      fechaSolicitud: datos.fecha,
      hora: datos.hora,
      problema: datos.problema,
      fechaEnvio: new Date().toISOString(),
      estado: 'pendiente',
    });

    setSolicitudes(prev => [...prev, sol]);
    return sol;
  };

  const reiniciar = async () => {
    await cargarTodo(false);
  };

  const tecnicos = usuarios.filter(u => normalizarRol(u.rol) === 'tecnico');

  if (cargando) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: 18, color: '#1a5fa8' }}>
        Cargando Refrimora...
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        usuario,
        cliente,
        usuarios,
        clientes,
        repuestos,
        servicios,
        solicitudes,
        tecnicos,
        login,
        logout,
        loginCliente,
        logoutCliente,
        registrarCliente,
        agregarClienteInterno,
        agregarServicio,
        actualizarServicio,
        agregarTecnico,
        toggleDisponible,
        actualizarPrecioRepuesto,
        obtenerSolicitudesWeb,
        agregarSolicitudWeb,
        obtenerDisponibilidadTecnicos,
        reiniciar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}