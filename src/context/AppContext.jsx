import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';

// ── Funciones utilitarias ──────────────────────────────────
export function totalServicio(servicio, repuestos) {
  let total = Number(servicio.precioServicio) || 0;
  const rus = Array.isArray(servicio.repuestosUsados) ? servicio.repuestosUsados : [];
  rus.forEach(r => {
    const rep = repuestos.find(x => Number(x.id) === Number(r.repuestoId));
    if (rep) total += Number(rep.precio) * Number(r.cantidad);
  });
  return total;
}

export function calcularEstadisticas(servicios, clientes, tecnicos, repuestos) {
  const ingresos = servicios
    .filter(s => s.estado === 'finalizado')
    .reduce((sum, s) => sum + totalServicio(s, repuestos), 0);

  const repuestosUsados = servicios.reduce((sum, s) => {
    const rus = Array.isArray(s.repuestosUsados) ? s.repuestosUsados : [];
    return sum + rus.reduce((a, r) => a + r.cantidad, 0);
  }, 0);

  return {
    agendados: servicios.filter(s => s.estado === 'agendado').length,
    enCamino: servicios.filter(s => s.estado === 'en-camino').length,
    enReparacion: servicios.filter(s => s.estado === 'en-reparacion').length,
    finalizados: servicios.filter(s => s.estado === 'finalizado').length,
    cancelados: servicios.filter(s => s.estado === 'cancelado').length,
    totalServicios: servicios.length,
    totalClientes: clientes.length,
    totalTecnicos: tecnicos.length,
    tecnicosDisp: tecnicos.filter(t => t.disponible).length,
    ingresos,
    repuestosUsados,
  };
}

export function formatearPeso(valor) {
  return '$' + Number(valor).toLocaleString('es-CO');
}

export function formatearFecha(fecha) {
  if (!fecha) return '—';
  const d = new Date(fecha + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function generarPassword(nombre) {
  const base = nombre.split(' ')[0].toLowerCase();
  return base + Math.floor(1000 + Math.random() * 9000);
}

// ── Helpers ───────────────────────────────────────────────
function normalizarRepuestos(valor) {
  if (Array.isArray(valor)) return valor.map(r => ({
    repuestoId: Number(r.repuestoId ?? r.RepuestoId ?? 0),
    cantidad:   Number(r.cantidad   ?? r.Cantidad   ?? 1),
  }));

  if (typeof valor === 'string') {
    let parsed = valor;
    // Desenvuelve hasta 3 capas de escape
    for (let i = 0; i < 3; i++) {
      try {
        const p = JSON.parse(parsed);
        if (Array.isArray(p)) {
          return p.map(r => ({
            repuestoId: Number(r.repuestoId ?? r.RepuestoId ?? 0),
            cantidad:   Number(r.cantidad   ?? r.Cantidad   ?? 1),
          }));
        }
        if (typeof p === 'string') { parsed = p; continue; }
        break;
      } catch { break; }
    }
    return [];
  }

  return [];
}

function normalizarServicio(s) {
  return {
    ...s,
    id: s.id ?? s.Id,
    clienteId: s.clienteId ?? s.ClienteId,
    tecnicoId: s.tecnicoId ?? s.TecnicoId,
    tipo: s.tipo ?? s.Tipo,
    estado: s.estado ?? s.Estado,
    fecha: s.fecha ?? s.Fecha,
    hora: s.hora ?? s.Hora,
    diagnostico: s.diagnostico ?? s.Diagnostico,
    notas: s.notas ?? s.Notas,
    precioServicio: Number(s.precioServicio ?? s.PrecioServicio ?? 0),
    repuestosUsados: normalizarRepuestos(s.repuestosUsados ?? s.RepuestosUsados),
  };
}

const CLAVE_SESION = 'rfrm_sesion';
const CLAVE_SESION_CLIENTE = 'rfrm_cliente_sesion';
const POLL_INTERVAL = 8000;

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [usuarios, setUsuarios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const pollRef = useRef(null);

  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CLAVE_SESION)); } catch { return null; }
  });

  const [cliente, setCliente] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CLAVE_SESION_CLIENTE)); } catch { return null; }
  });

  const cargarDatos = useCallback(async () => {
    try {
      const [u, c, r, svs, sol] = await Promise.all([
        api.get('usuarios'),
        api.get('clientes'),
        api.get('repuestos'),
        api.get('servicios'),
        api.get('solicitudes'),
      ]);

      setUsuarios(u);
      setClientes(c);
      setRepuestos(r);
      setServicios(svs.map(s => normalizarServicio(s)));
      setSolicitudes(sol);
    } catch (e) {
      console.error('Error al recargar datos:', e);
    }
  }, []);

  // ── Carga inicial ───────────────────────────────────────
  useEffect(() => {
    cargarDatos().finally(() => setCargando(false));
  }, [cargarDatos]);

  // ── Polling automático ──────────────────────────────────
  useEffect(() => {
    pollRef.current = setInterval(() => {
      cargarDatos();
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [cargarDatos]);

  // ── Auth empleado ───────────────────────────────────────
  const login = async (correo, password) => {
    try {
      const u = await api.post('usuarios/login', { correo, password });
      if (!u || u.status === 401) return null;
      localStorage.setItem(CLAVE_SESION, JSON.stringify(u));
      setUsuario(u);
      return u;
    } catch {
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem(CLAVE_SESION);
    setUsuario(null);
  };

  // ── Auth cliente ────────────────────────────────────────
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

      const nuevo = await res.json();
      setClientes(prev => [...prev, nuevo]);
      localStorage.setItem(CLAVE_SESION_CLIENTE, JSON.stringify(nuevo));
      setCliente(nuevo);
      return { ok: true };
    } catch {
      return { ok: false, mensaje: 'No se pudo conectar al servidor.' };
    }
  };

  const loginCliente = async (email, password) => {
    try {
      const res = await fetch('http://localhost:5213/api/clientes/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email, Password: password }),
      });

      if (!res.ok) return null;
      const c = await res.json();
      localStorage.setItem(CLAVE_SESION_CLIENTE, JSON.stringify(c));
      setCliente(c);
      return c;
    } catch {
      return null;
    }
  };

  const logoutCliente = () => {
    localStorage.removeItem(CLAVE_SESION_CLIENTE);
    setCliente(null);
  };

  // ── Clientes ────────────────────────────────────────────
  const agregarCliente = async (datos) => {
    const nuevo = await api.post('clientes', {
      nombre: datos.nombre,
      telefono: datos.telefono,
      direccion: datos.direccion || '',
      email: datos.email || '',
      fecha: new Date().toISOString().split('T')[0],
    });
    setClientes(prev => [...prev, nuevo]);
    return nuevo;
  };

  // ── Servicios ───────────────────────────────────────────
  const agregarServicio = async (datos) => {
    const nuevo = await api.post('servicios', {
      clienteId: String(datos.clienteId),
      tecnicoId: String(datos.tecnicoId),
      tipo: datos.tipo,
      diagnostico: datos.diagnostico || '',
      fecha: datos.fecha,
      hora: datos.hora || '08:00',
      estado: 'agendado',
      repuestosUsados: '[]',
      precioServicio: datos.precioServicio || 50000,
      notas: '',
    });
    const parsed = normalizarServicio(nuevo);
    setServicios(prev => [...prev, parsed]);
    return parsed;
  };

  const actualizarServicio = async (id, cambios) => {
    try {
      const repuestosNormalizados = normalizarRepuestos(cambios.repuestosUsados ?? []);
      
      const payload = {
        ...cambios,
        repuestosUsados: JSON.stringify(repuestosNormalizados), // solo una capa
      };

      const actualizado = await api.patch('servicios', id, payload);
      
      const parsed = {
        ...normalizarServicio(actualizado),
        repuestosUsados: repuestosNormalizados, // usa los locales, no los del backend
      };
      
      setServicios(prev => prev.map(s => s.id === id ? parsed : s));
    } catch (e) {
      console.error('Error actualizarServicio:', e);
      throw e;
    }
  };

  // ── Técnicos ────────────────────────────────────────────
  const agregarTecnico = async (datos) => {
    const nuevo = await api.post('usuarios', {
      nombre: datos.nombre,
      correo: datos.correo,
      password: datos.password || 'tec123',
      rol: 'tecnico',
      disponible: true,
    });
    setUsuarios(prev => [...prev, nuevo]);
    return nuevo;
  };

  const toggleDisponible = async (id) => {
    const tec = usuarios.find(u => u.id === id);
    const actualizado = await api.patch('usuarios', id, { disponible: !tec.disponible });
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, disponible: actualizado.disponible } : u));
  };

  // ── Repuestos ───────────────────────────────────────────
  const actualizarPrecioRepuesto = async (id, nuevoPrecio) => {
    const actualizado = await api.patch('repuestos', id, { precio: nuevoPrecio });
    setRepuestos(prev => prev.map(r => r.id === id ? actualizado : r));
  };

  // ── Solicitudes web ─────────────────────────────────────
  const obtenerSolicitudesWeb = () => solicitudes;

  const agregarSolicitudWeb = async (datos) => {
    const sol = await api.post('solicitudes', {
      nombre: datos.nombre,
      telefono: datos.telefono,
      direccion: datos.direccion,
      email: datos.email,
      tipo: datos.tipo,
      fecha: datos.fecha,
      problema: datos.problema,
      fechaEnvio: new Date().toLocaleString('es-CO'),
      estado: 'pendiente',
    });
    setSolicitudes(prev => [...prev, sol]);
    return sol;
  };

  const reiniciar = async () => {
    await cargarDatos();
  };

  const tecnicos = usuarios.filter(u => u.rol === 'tecnico');

  if (cargando) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>❄</span>
        <p style={{ color: '#1a5fa8', fontWeight: 600 }}>Cargando Refrimora...</p>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      usuario, login, logout,
      cliente, loginCliente, logoutCliente, registrarCliente,
      usuarios, tecnicos, clientes, repuestos, servicios, solicitudes,
      agregarCliente, agregarServicio, actualizarServicio,
      agregarTecnico, toggleDisponible,
      actualizarPrecioRepuesto,
      obtenerSolicitudesWeb, agregarSolicitudWeb,
      reiniciar,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
