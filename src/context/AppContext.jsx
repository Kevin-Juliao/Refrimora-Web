import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

// ── Funciones utilitarias (no cambian) ───────────────────────
export function totalServicio(servicio, repuestos) {
  let total = Number (servicio.precioServicio) || 0;

    const rus = Array.isArray(servicio.repuestosUsados) ? servicio.repuestosUsados : [];
  rus.forEach(r => {
    const rep = repuestos.find(x => Number(x.id) === Number(r.repuestoId));
    if (rep) total += Number (rep.precio) * Number (r.cantidad);
  });
  return total;
}

export function calcularEstadisticas(servicios, clientes, tecnicos, repuestos) {
  const ingresos = servicios
    .filter(s => s.estado === 'finalizado')
    .reduce((sum, s) => sum + totalServicio(s, repuestos), 0);
  const repuestosUsados = servicios.reduce((sum, s) =>{
      const rus = Array.isArray(s.repuestosUsados) ? s.repuestosUsados : [];
    return sum + rus.reduce((a, r) => a + r.cantidad, 0);
   }, 0);
   /* sum + (s.repuestosUsados || []).reduce((a, r) => a + r.cantidad, 0), 0);*/
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

// ── Helpers ───────────────────────────────────────────────────
function normalizarRepuestos(valor) {
  if (Array.isArray(valor)) return valor.map(r => ({
    repuestoId: Number(r.repuestoId ?? r.RepuestoId ?? 0),
    cantidad:   Number(r.cantidad   ?? r.Cantidad   ?? 1),
  }));
  if (typeof valor === 'string') {
    try {
      const parsed = JSON.parse(valor || '[]');
      return Array.isArray(parsed) ? parsed.map(r => ({
        repuestoId: Number(r.repuestoId ?? r.RepuestoId ?? 0),
        cantidad:   Number(r.cantidad   ?? r.Cantidad   ?? 1),
      })) : [];
    } catch { return []; }
  }
  return [];
}

function normalizarServicio(s) {
  return {
    ...s,
    id:             s.id             ?? s.Id,
    clienteId:      s.clienteId      ?? s.ClienteId,
    tecnicoId:      s.tecnicoId      ?? s.TecnicoId,
    tipo:           s.tipo           ?? s.Tipo,
    estado:         s.estado         ?? s.Estado,
    fecha:          s.fecha          ?? s.Fecha,
    hora:           s.hora           ?? s.Hora,
    diagnostico:    s.diagnostico    ?? s.Diagnostico,
    notas:          s.notas          ?? s.Notas,
    precioServicio: Number(s.precioServicio ?? s.PrecioServicio ?? 0),
    repuestosUsados: normalizarRepuestos(s.repuestosUsados ?? s.RepuestosUsados),
  };
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
    const cargar = async () => {
      try { setUsuarios(await api.get('usuarios')); } catch {}
      try { setClientes(await api.get('clientes')); } catch {}
      try { setRepuestos(await api.get('repuestos')); } catch {}
      try {
        const svs = await api.get('servicios');
        // Parsear repuestosUsados de string JSON a array
        const parsed = svs.map(s => ({
          ...s,
          repuestosUsados: typeof s.repuestosUsados === 'string'
            ? JSON.parse(s.repuestosUsados || '[]')
            : (s.repuestosUsados || [])
        }));
        setServicios(parsed);
      } catch {}
      try { setSolicitudes(await api.get('solicitudes')); } catch {}
      setCargando(false);
    };
    cargar();
  }, []);

  // ── Auth ──────────────────────────────────────────────────
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
      const repuestosEnviados = normalizarRepuestos(cambios.repuestosUsados);
      const actualizado = await api.patch('servicios', id, cambios);

       const parsed = {
          ...normalizarServicio(actualizado),
          repuestosUsados: repuestosEnviados,
        };

      setServicios(prev => prev.map(s => s.id === id ? parsed : s));
    } catch (e) {
      console.error('Error actualizarServicio:', e);
      throw e;
    }
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
    const tec = usuarios.find(u => u.id === id); // ← busca en usuarios
    const actualizado = await api.patch('usuarios', id, { disponible: !tec.disponible });
    setUsuarios(prev =>                           // ← actualiza usuarios
      prev.map(u => u.id === id ? { ...u, disponible: actualizado.disponible } : u)
    );
  };

  // ── Repuestos ─────────────────────────────────────────────
  const actualizarPrecioRepuesto = async (id, nuevoPrecio) => {
    const actualizado = await api.patch('repuestos', id, { precio: nuevoPrecio });
    setRepuestos(prev => prev.map(r => r.id === id ? actualizado : r));
  };

  // ── Solicitudes web ───────────────────────────────────────
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