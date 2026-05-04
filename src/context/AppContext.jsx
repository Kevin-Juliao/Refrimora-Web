// src/context/AppContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

// ── Funciones utilitarias (no cambian) ───────────────────────
export function totalServicio(servicio, repuestos) {
  let total = servicio.precioServicio || 0;
  (servicio.repuestosUsados || []).forEach(r => {
    const rep = repuestos.find(x => x.id === r.repuestoId);
    if (rep) total += rep.precio * r.cantidad;
  });
  return total;
}

export function calcularEstadisticas(servicios, clientes, tecnicos, repuestos) {
  const ingresos = servicios
    .filter(s => s.estado === 'finalizado')
    .reduce((sum, s) => sum + totalServicio(s, repuestos), 0);
  const repuestosUsados = servicios.reduce((sum, s) =>
    sum + (s.repuestosUsados || []).reduce((a, r) => a + r.cantidad, 0), 0);
  return {
    agendados:      servicios.filter(s => s.estado === 'agendado').length,
    enCamino:       servicios.filter(s => s.estado === 'en-camino').length,
    enReparacion:   servicios.filter(s => s.estado === 'en-reparacion').length,
    finalizados:    servicios.filter(s => s.estado === 'finalizado').length,
    cancelados:     servicios.filter(s => s.estado === 'cancelado').length,
    totalServicios: servicios.length,
    totalClientes:  clientes.length,
    totalTecnicos:  tecnicos.length,
    tecnicosDisp:   tecnicos.filter(t => t.disponible).length,
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

// ── Context ───────────────────────────────────────────────────
const CLAVE_SESION = 'rfrm_sesion';
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [usuarios,    setUsuarios]    = useState([]);
  const [clientes,    setClientes]    = useState([]);
  const [repuestos,   setRepuestos]   = useState([]);
  const [servicios,   setServicios]   = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando,    setCargando]    = useState(true);

  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CLAVE_SESION)); } catch { return null; }
  });

  // ── Cargar todos los datos desde la API al iniciar ────────
  useEffect(() => {
    Promise.all([
      api.get('usuarios'),
      api.get('clientes'),
      api.get('repuestos'),
      api.get('servicios'),
      api.get('solicitudes'),
    ])
      .then(([u, c, r, s, sol]) => {
        setUsuarios(u);
        setClientes(c);
        setRepuestos(r);
        setServicios(s);
        setSolicitudes(sol);
      })
      .finally(() => setCargando(false));
  }, []);

  // ── Auth ──────────────────────────────────────────────────
  // login es síncrono: ya tenemos los usuarios en el estado
  const login = (correo, password) => {
    const u = usuarios.find(x => x.correo === correo && x.password === password);
    if (!u) return null;
    localStorage.setItem(CLAVE_SESION, JSON.stringify(u));
    setUsuario(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem(CLAVE_SESION);
    setUsuario(null);
  };

  // ── Clientes ──────────────────────────────────────────────
  const agregarCliente = async (datos) => {
    const nuevo = await api.post('clientes', {
      nombre:    datos.nombre,
      telefono:  datos.telefono,
      direccion: datos.direccion || '',
      email:     datos.email || '',
      fecha:     new Date().toISOString().split('T')[0],
    });
    setClientes(prev => [...prev, nuevo]);
    return nuevo;
  };

  // ── Servicios ─────────────────────────────────────────────
  const agregarServicio = async (datos) => {
    const nuevo = await api.post('servicios', {
      clienteId:       datos.clienteId,
      tecnicoId:       datos.tecnicoId,
      tipo:            datos.tipo,
      diagnostico:     datos.diagnostico || '',
      fecha:           datos.fecha,
      hora:            datos.hora || '08:00',
      estado:          'agendado',
      repuestosUsados: [],
      precioServicio:  datos.precioServicio || 50000,
      notas:           '',
    });
    setServicios(prev => [...prev, nuevo]);
    return nuevo;
  };

  const actualizarServicio = async (id, cambios) => {
    const actualizado = await api.patch('servicios', id, cambios);
    setServicios(prev => prev.map(s => s.id === id ? actualizado : s));
  };

  // ── Técnicos ──────────────────────────────────────────────
  const agregarTecnico = async (datos) => {
    const nuevo = await api.post('usuarios', {
      nombre:     datos.nombre,
      correo:     datos.correo,
      password:   datos.password || 'tec123',
      rol:        'tecnico',
      disponible: true,
    });
    setUsuarios(prev => [...prev, nuevo]);
    return nuevo;
  };

  const toggleDisponible = async (id) => {
    const tec = usuarios.find(u => u.id === id);
    if (!tec) return;
    const actualizado = await api.patch('usuarios', id, { disponible: !tec.disponible });
    setUsuarios(prev => prev.map(u => u.id === id ? actualizado : u));
  };

  // ── Repuestos ─────────────────────────────────────────────
  const actualizarPrecioRepuesto = async (id, nuevoPrecio) => {
    const actualizado = await api.patch('repuestos', id, { precio: nuevoPrecio });
    setRepuestos(prev => prev.map(r => r.id === id ? actualizado : r));
  };

  // ── Solicitudes web ───────────────────────────────────────
  // Síncrono: devuelve el estado directamente (ya cargado desde la API)
  const obtenerSolicitudesWeb = () => solicitudes;

  const agregarSolicitudWeb = async (datos) => {
    const sol = await api.post('solicitudes', {
      ...datos,
      fechaEnvio: new Date().toLocaleString('es-CO'),
      estado:     'pendiente',
    });
    setSolicitudes(prev => [...prev, sol]);
    return sol;
  };

  const reiniciar = async () => {
    const [u, c, r, s, sol] = await Promise.all([
      api.get('usuarios'),
      api.get('clientes'),
      api.get('repuestos'),
      api.get('servicios'),
      api.get('solicitudes'),
    ]);
    setUsuarios(u);
    setClientes(c);
    setRepuestos(r);
    setServicios(s);
    setSolicitudes(sol);
  };

  const tecnicos = usuarios.filter(u => u.rol === 'tecnico');

  if (cargando) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', fontSize: 18, color: '#1a5fa8'
      }}>
        ❄️ Cargando Refrimora...
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      usuario, usuarios, clientes, repuestos, servicios, tecnicos,
      login, logout,
      agregarCliente, agregarServicio, actualizarServicio,
      agregarTecnico, toggleDisponible, actualizarPrecioRepuesto,
      obtenerSolicitudesWeb, agregarSolicitudWeb, reiniciar,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}