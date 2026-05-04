import { createContext, useContext, useState, useCallback } from 'react';

// ── Data inicial ──────────────────────────────────────────────
const USUARIOS_INICIALES = [
  { id: 1, nombre: 'Carlos Mora',    correo: 'admin@refrimora.com',      password: 'admin123', rol: 'admin' },
  { id: 2, nombre: 'Laura Jiménez',  correo: 'secretaria@refrimora.com', password: 'secre123', rol: 'secretaria' },
  { id: 3, nombre: 'Pedro Álvarez',  correo: 'pedro@refrimora.com',      password: 'tec123',   rol: 'tecnico', disponible: true },
  { id: 4, nombre: 'Juan Rodríguez', correo: 'juan@refrimora.com',       password: 'tec456',   rol: 'tecnico', disponible: true },
];
const CLIENTES_INICIALES = [
  { id: 1, nombre: 'Juan Pérez',    telefono: '3001234567', direccion: 'Calle 12 #34, Bogotá',      email: 'juan@email.com',  fecha: '2025-01-10' },
  { id: 2, nombre: 'María Gómez',   telefono: '3109876543', direccion: 'Cra 45 #22, Medellín',      email: 'maria@email.com', fecha: '2025-01-12' },
  { id: 3, nombre: 'Luis Martínez', telefono: '3204567890', direccion: 'Av. Central #56, Cali',     email: 'luis@email.com',  fecha: '2025-01-15' },
  { id: 4, nombre: 'Ana Torres',    telefono: '3151112233', direccion: 'Carrera 8 #4-15, Curumaní', email: 'ana@email.com',   fecha: '2025-01-18' },
];
const REPUESTOS_INICIALES = [
  { id: 1, nombre: 'Filtro de Aire',     codigo: 'FILT-01', precio: 25000,  stock: 40, icono: '🌀' },
  { id: 2, nombre: 'Control Remoto',     codigo: 'CTRL-01', precio: 40000,  stock: 15, icono: '📱' },
  { id: 3, nombre: 'Motor Ventilador',   codigo: 'MOT-01',  precio: 120000, stock: 8,  icono: '⚙️' },
  { id: 4, nombre: 'Gas R-22',           codigo: 'GAS-22',  precio: 85000,  stock: 20, icono: '🧊' },
  { id: 5, nombre: 'Gas R-410A',         codigo: 'GAS-410', precio: 120000, stock: 15, icono: '❄️' },
  { id: 6, nombre: 'Capacitor 35+5 MFD', codigo: 'CAP-01', precio: 25000,  stock: 30, icono: '🔋' },
  { id: 7, nombre: 'Compresor LG 1 Ton', codigo: 'COMP-01', precio: 450000, stock: 4, icono: '🔧' },
  { id: 8, nombre: 'Termostato Digital', codigo: 'TERM-01', precio: 35000,  stock: 12, icono: '🌡️' },
];
const SERVICIOS_INICIALES = [
  { id: 1, clienteId: 1, tecnicoId: 3, tipo: 'Reparación',    diagnostico: 'Fuga de gas',          fecha: '2025-01-22', hora: '09:00', estado: 'en-camino',     repuestosUsados: [],                               precioServicio: 60000,  notas: '' },
  { id: 2, clienteId: 2, tecnicoId: 3, tipo: 'Mantenimiento', diagnostico: 'Limpieza profunda',     fecha: '2025-01-22', hora: '14:00', estado: 'en-reparacion', repuestosUsados: [{ repuestoId: 1, cantidad: 1 }], precioServicio: 50000,  notas: '' },
  { id: 3, clienteId: 3, tecnicoId: 4, tipo: 'Reparación',    diagnostico: 'Cambio de condensador', fecha: '2025-01-22', hora: '10:00', estado: 'finalizado',    repuestosUsados: [{ repuestoId: 3, cantidad: 1 }], precioServicio: 80000,  notas: 'Trabajo terminado sin novedad' },
  { id: 4, clienteId: 4, tecnicoId: 3, tipo: 'Instalación',   diagnostico: 'Instalación nueva',     fecha: '2025-01-23', hora: '08:00', estado: 'agendado',      repuestosUsados: [],                               precioServicio: 120000, notas: '' },
];

// ── Helpers de localStorage ───────────────────────────────────
const CLAVE = 'rfrm_datos';
const CLAVE_SESION = 'rfrm_sesion';
const CLAVE_SOLS = 'rfrm_solicitudes';

function cargarDatos() {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado) return JSON.parse(guardado);
  } catch (_) {}
  const datos = {
    usuarios: USUARIOS_INICIALES,
    clientes: CLIENTES_INICIALES,
    repuestos: REPUESTOS_INICIALES,
    servicios: SERVICIOS_INICIALES,
  };
  localStorage.setItem(CLAVE, JSON.stringify(datos));
  return datos;
}

function guardarDatos(datos) {
  localStorage.setItem(CLAVE, JSON.stringify(datos));
}

// ── Calculadora (funciones puras) ─────────────────────────────
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
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const inicial = cargarDatos();
  const [usuarios,  setUsuarios]  = useState(inicial.usuarios);
  const [clientes,  setClientes]  = useState(inicial.clientes);
  const [repuestos, setRepuestos] = useState(inicial.repuestos);
  const [servicios, setServicios] = useState(inicial.servicios);
  const [usuario,   setUsuario]   = useState(() => {
    try { return JSON.parse(localStorage.getItem(CLAVE_SESION)); } catch { return null; }
  });

  const persist = useCallback((u, c, r, s) => {
    guardarDatos({ usuarios: u, clientes: c, repuestos: r, servicios: s });
  }, []);

  // ── Auth ──────────────────────────────────────────────────
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
  const agregarCliente = (datos) => {
    const nuevo = {
      id: clientes.length > 0 ? Math.max(...clientes.map(x => x.id)) + 1 : 1,
      nombre: datos.nombre, telefono: datos.telefono,
      direccion: datos.direccion || '', email: datos.email || '',
      fecha: new Date().toISOString().split('T')[0],
    };
    const lista = [...clientes, nuevo];
    setClientes(lista);
    persist(usuarios, lista, repuestos, servicios);
    return nuevo;
  };

  // ── Servicios ─────────────────────────────────────────────
  const agregarServicio = (datos) => {
    const nuevo = {
      id: servicios.length > 0 ? Math.max(...servicios.map(x => x.id)) + 1 : 1,
      clienteId: datos.clienteId, tecnicoId: datos.tecnicoId,
      tipo: datos.tipo, diagnostico: datos.diagnostico || '',
      fecha: datos.fecha, hora: datos.hora || '08:00',
      estado: 'agendado', repuestosUsados: [],
      precioServicio: datos.precioServicio || 50000, notas: '',
    };
    const lista = [...servicios, nuevo];
    setServicios(lista);
    persist(usuarios, clientes, repuestos, lista);
    return nuevo;
  };

  const actualizarServicio = (id, cambios) => {
    const lista = servicios.map(s => s.id === id ? { ...s, ...cambios } : s);
    setServicios(lista);
    persist(usuarios, clientes, repuestos, lista);
  };

  // ── Técnicos ──────────────────────────────────────────────
  const agregarTecnico = (datos) => {
    const nuevo = {
      id: usuarios.length > 0 ? Math.max(...usuarios.map(x => x.id)) + 1 : 1,
      nombre: datos.nombre, correo: datos.correo,
      password: datos.password || 'tec123', rol: 'tecnico', disponible: true,
    };
    const lista = [...usuarios, nuevo];
    setUsuarios(lista);
    persist(lista, clientes, repuestos, servicios);
    return nuevo;
  };

  const toggleDisponible = (id) => {
    const lista = usuarios.map(u => u.id === id ? { ...u, disponible: !u.disponible } : u);
    setUsuarios(lista);
    persist(lista, clientes, repuestos, servicios);
  };

  // ── Repuestos ─────────────────────────────────────────────
  const actualizarPrecioRepuesto = (id, nuevoPrecio) => {
    const lista = repuestos.map(r => r.id === id ? { ...r, precio: nuevoPrecio } : r);
    setRepuestos(lista);
    persist(usuarios, clientes, lista, servicios);
  };

  // ── Solicitudes web ───────────────────────────────────────
  const obtenerSolicitudesWeb = () => {
    try { return JSON.parse(localStorage.getItem(CLAVE_SOLS) || '[]'); } catch { return []; }
  };
  const agregarSolicitudWeb = (datos) => {
    const sol = {
      id: Date.now(), ...datos,
      fechaEnvio: new Date().toLocaleString('es-CO'), estado: 'pendiente',
    };
    const lista = [...obtenerSolicitudesWeb(), sol];
    localStorage.setItem(CLAVE_SOLS, JSON.stringify(lista));
    return sol;
  };

  const reiniciar = () => {
    localStorage.removeItem(CLAVE);
    localStorage.removeItem(CLAVE_SOLS);
    const d = cargarDatos();
    setUsuarios(d.usuarios); setClientes(d.clientes);
    setRepuestos(d.repuestos); setServicios(d.servicios);
  };

  const tecnicos = usuarios.filter(u => u.rol === 'tecnico');

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
