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

export function formatearIntervaloBD(horaInicio, duracionMinutos) {
  if (!horaInicio) return '08:00-09:00';
  if (String(horaInicio).includes('-')) {
    return horaInicio;
  }
  const [h, m] = String(horaInicio).split(':').map(Number);
  const inicioMinutos = h * 60 + m;
  const finMinutos = inicioMinutos + (duracionMinutos || 60);

  const hFin = Math.floor(finMinutos / 60).toString().padStart(2, '0');
  const mFin = (finMinutos % 60).toString().padStart(2, '0');
  const hInicio = h.toString().padStart(2, '0');
  const mInicio = m.toString().padStart(2, '0');

  return `${hInicio}:${mInicio}-${hFin}:${mFin}`;
}

export function calcularIntervaloEtiqueta(horaInicio, duracionMinutos) {
  if (!horaInicio) return '—';
  if (!duracionMinutos) return horaInicio;

  const [h, m] = String(horaInicio).split(':').map(Number);
  const inicioMinutos = h * 60 + m;
  const finMinutos = inicioMinutos + duracionMinutos;

  const hFin = Math.floor(finMinutos / 60).toString().padStart(2, '0');
  const mFin = (finMinutos % 60).toString().padStart(2, '0');

  return `${horaInicio} - ${hFin}:${mFin}`;
}


export function obtenerDuracionServicio(tipo, texto = '', servicioObj = null) {
  if (servicioObj) {
    if (Array.isArray(servicioObj.airesList) && servicioObj.airesList.length > 0) {
      return servicioObj.airesList.reduce((sum, a) => sum + (Number(a.duracion) || 60), 0);
    }
    if (typeof servicioObj.duracionForzada === 'number') {
      return servicioObj.duracionForzada;
    }
  }

  const match = String(texto || '').match(/\[DUR:(\d+)\]/i);
  if (match) return parseInt(match[1], 10);

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
    documentoIdentidad: c.documentoIdentidad ?? c.DocumentoIdentidad ?? '',
    primerNombre: c.primerNombre ?? c.PrimerNombre ?? '',
    segundoNombre: c.segundoNombre ?? c.SegundoNombre ?? '',
    primerApellido: c.primerApellido ?? c.PrimerApellido ?? '',
    segundoApellido: c.segundoApellido ?? c.SegundoApellido ?? '',
    telefono: c.telefono ?? c.Telefono ?? '',
    direccion: c.direccion ?? c.Direccion ?? '',
    email: c.email ?? c.Email ?? '',
    Token: c.token ?? c.Token ?? null,
  };
}

function normalizarServicio(s) {
  const rawHora = s.hora ?? s.Hora ?? '08:00';
  let horaFinal = rawHora;
  let duracionForzada = null;

  if (String(rawHora).includes('-')) {
    const parts = String(rawHora).split('-');
    const startPart = parts[0].trim();
    const endPart = parts[1].trim();
    
    const [sh, sm] = startPart.split(':').map(Number);
    const [eh, em] = endPart.split(':').map(Number);
    
    const startMin = sh * 60 + (sm < 10 ? sm * 10 : sm);
    const endMin = eh * 60 + (em < 10 ? em * 10 : em);
    
    const cleanSH = String(sh).padStart(2, '0');
    const cleanSM = String(sm < 10 ? sm * 10 : sm).padStart(2, '0');
    
    horaFinal = `${cleanSH}:${cleanSM}`;
    duracionForzada = endMin - startMin;
  } else if (String(rawHora).includes('#')) {
    const parts = String(rawHora).split('#');
    horaFinal = parts[0];
    duracionForzada = parseInt(parts[1], 10);
  }

  const rawAires = s.aires ?? s.Aires;
  let airesList = [];
  if (rawAires) {
    try {
      airesList = typeof rawAires === 'string' ? JSON.parse(rawAires) : rawAires;
    } catch (e) {
      console.error('Error parsing aires list:', e);
    }
  }

  const tipo = s.tipo ?? s.Tipo ?? '';
  const diag = s.diagnostico ?? s.Diagnostico ?? s.problema ?? s.Problema ?? '';
  
  if (duracionForzada === null) {
    if (airesList && airesList.length > 0) {
      duracionForzada = airesList.reduce((sum, a) => sum + (Number(a.duracion) || 60), 0);
    } else {
      duracionForzada = obtenerDuracionServicio(tipo, diag);
    }
  }

  return {
    ...s,
    id: Number(s.id ?? s.Id ?? 0),
    clienteId: Number(s.clienteId ?? s.ClienteId ?? 0),
    clienteNombre: s.clienteNombre ?? s.ClienteNombre ?? '',
    tecnicoId: Number(s.tecnicoId ?? s.TecnicoId ?? 0),
    tecnicoNombre: s.tecnicoNombre ?? s.TecnicoNombre ?? '',
    tipo,
    diagnostico: diag,
    fechaServicio: normalizarFecha(s.fechaServicio ?? s.FechaServicio ?? s.fecha ?? s.Fecha ?? ''),
    hora: horaFinal,
    duracionForzada,
    aires: rawAires ?? null,
    airesList,
    estado: normalizarEstado(s.estado ?? s.Estado ?? 'agendado'),
    precioServicio: Number(s.precioServicio ?? s.PrecioServicio ?? 0),
    notas: s.notas ?? s.Notes ?? s.Notas ?? '',
    repuestos: Array.isArray(s.repuestos)
      ? s.repuestos.map(r => ({
          repuestoId: Number(r.repuestoId ?? r.RepuestoId ?? 0),
          nombre: r.nombre ?? r.Nombre ?? '',
          cantidad: Number(r.cantidad ?? r.Cantidad ?? 0),
        }))
      : [],
  };
}

export function calcularPagoServicioTecnico(servicio) {
  const normalizarYCalcular = (tipoStr) => {
    if (!tipoStr) return 0;
    const t = String(tipoStr)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (t.includes('mantenimiento')) return 20000;
    if (t.includes('reparacion')) return 40000;
    if (t.includes('recarga')) return 10000;
    if (t.includes('revision') || t.includes('revicion')) return 10000;
    if (t.includes('instalacion')) return 15000;
    return 0;
  };

  if (Array.isArray(servicio?.airesList) && servicio.airesList.length > 0) {
    return servicio.airesList.reduce((sum, aire) => sum + normalizarYCalcular(aire.tipoServicio), 0);
  }

  return normalizarYCalcular(servicio?.tipo);
}

function calcularRepuestosUsados(servicios) {
  return servicios.reduce((sum, s) => {
    const rus = Array.isArray(s.repuestos) ? s.repuestos : [];
    return sum + rus.reduce((a, r) => a + Number(r.cantidad || 0), 0);
  }, 0);
}

export function calcularEstadisticas(servicios, clientes, tecnicos, repuestos, esTecnico = false) {
  const lista = Array.isArray(servicios) ? servicios.map(normalizarServicio) : [];
  const finalizados = lista.filter(s => normalizarEstado(s.estado) === 'finalizado');

  let ingresos = 0;
  let totalPagadoTecnicos = 0;
  let costoRepuestos = 0;

  if (esTecnico) {
    ingresos = finalizados.reduce((sum, s) => sum + calcularPagoServicioTecnico(s), 0);
    totalPagadoTecnicos = ingresos;
  } else {
    ingresos = finalizados.reduce((sum, s) => sum + totalServicio(s, repuestos), 0);
    totalPagadoTecnicos = finalizados.reduce((sum, s) => sum + calcularPagoServicioTecnico(s), 0);
    costoRepuestos = finalizados.reduce((sum, s) => {
      const rus = Array.isArray(s.repuestos) ? s.repuestos : [];
      return sum + rus.reduce((a, r) => {
         const rep = repuestos.find(x => Number(x.id) === Number(r.repuestoId));
         const costo = rep ? Number(rep.precioCompra || 0) : 0;
         return a + (costo * Number(r.cantidad || 0));
      }, 0);
    }, 0);
  }

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
    repuestosUsados: calcularRepuestosUsados(finalizados),
    totalPagadoTecnicos,
    gananciaNeta: esTecnico ? ingresos : (ingresos - totalPagadoTecnicos - costoRepuestos),
  };
}

export function calcularEstadisticasDelDia(servicios, clientes, tecnicos, repuestos, esTecnico = false) {
  return calcularEstadisticas(servicios, clientes, tecnicos, repuestos, esTecnico);
}

// Provider
export function AppProvider({ children }) {
  const [usuarios, setUsuarios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [historialCierres, setHistorialCierres] = useState([]);
  const [preciosServicios, setPreciosServicios] = useState([]);
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
      const [u, c, r, s, sol, rd, ps] = await Promise.all([
        api.get('usuarios'),
        api.get('clientes'),
        api.get('repuestos'),
        api.get('servicios'),
        api.get('solicitudes'),
        api.get('resumenesdiarios').catch(() => []),
        api.get('preciosservicios').catch(() => [])
      ]);

      setUsuarios((Array.isArray(u) ? u : []).map(normalizarUsuario));
      setClientes((Array.isArray(c) ? c : []).map(normalizarCliente));
      setRepuestos(Array.isArray(r) ? r : []);
      setServicios((Array.isArray(s) ? s : []).map(normalizarServicio));
      setSolicitudes(Array.isArray(sol) ? sol : []);
      
      const defaultPrecios = [
        { id: 1, nombre: 'Revisión', precio: 30000 },
        { id: 2, nombre: 'Mantenimiento', precio: 80000 },
        { id: 3, nombre: 'Recarga', precio: 70000 },
        { id: 4, nombre: 'Reparación', precio: 150000 },
        { id: 5, nombre: 'Instalación', precio: 70000 }
      ];
      setPreciosServicios(Array.isArray(ps) && ps.length > 0 ? ps : defaultPrecios);
      
      const cierresParseados = (Array.isArray(rd) ? rd : []).map(item => {
        try {
          const parsed = JSON.parse(item.datosJson || '{}');
          let fReal = item.fechaHoraCierreReal;
          if (fReal && typeof fReal === 'string' && !fReal.endsWith('Z') && !fReal.includes('+')) {
            fReal += 'Z';
          }
          return {
             id: item.id,
             fechaCierre: item.fechaCierre,
             fechaHoraCierreReal: fReal,
             ...parsed
          };
        } catch { return null; }
      }).filter(x => x !== null);
      
      setHistorialCierres(cierresParseados);
    } catch (e) {
      console.error('Error cargando datos iniciales:', e);

      if (mostrarCarga) {
        setUsuarios([]);
        setClientes([]);
        setRepuestos([]);
        setServicios([]);
        setSolicitudes([]);
        setPreciosServicios([
          { id: 1, nombre: 'Revisión', precio: 30000 },
          { id: 2, nombre: 'Mantenimiento', precio: 80000 },
          { id: 3, nombre: 'Recarga', precio: 70000 },
          { id: 4, nombre: 'Reparación', precio: 150000 },
          { id: 5, nombre: 'Instalación', precio: 70000 }
        ]);
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
      
      // Auto-cierre de jornada a las 6:00 PM
      if (usuario && normalizarRol(usuario.rol) === 'admin') {
        const ahora = new Date();
        if (ahora.getHours() >= 18) {
          const hoyStr = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000).toISOString().split('T')[0];
          setHistorialCierres(prev => {
            const yaCerradoHoy = prev.some(c => c.fechaCierre === hoyStr);
            if (!yaCerradoHoy) {
              // Llamar auto-cierre
              setTimeout(() => autoFinalizarJornada(), 2000);
            }
            return prev;
          });
        }
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [cargarTodo, usuario, cliente]);

  const autoFinalizarJornada = async () => {
    // Usar estado actual. Esto se llama en el timeout si es necesario
    const fJornada = window.__finalizarJornadaGlobal;
    if (fJornada) {
      await fJornada();
    }
  };

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
          DocumentoIdentidad: datos.documentoIdentidad,
          PrimerNombre: datos.primerNombre,
          SegundoNombre: datos.segundoNombre || '',
          PrimerApellido: datos.primerApellido,
          SegundoApellido: datos.segundoApellido || '',
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
      documentoIdentidad: datos.documentoIdentidad,
      primerNombre: datos.primerNombre,
      segundoNombre: datos.segundoNombre || '',
      primerApellido: datos.primerApellido,
      segundoApellido: datos.segundoApellido || '',
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

  const obtenerDisponibilidadTecnicos = (fecha, hora = '', tipo = '', excluirServicioId = null, textoBase = '', duracionForzada = null) => {
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
        estado !== 'cerrado' &&
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
    const duracion = typeof duracionForzada === 'number' ? duracionForzada : obtenerDuracionServicio(tipo, textoBase);
    const finNuevo = inicioNuevo + duracion;

    const ocupados = tecnicosActivos.filter(tec =>
      serviciosActivos.some(s => {
        if (Number(s.tecnicoId) !== Number(tec.id)) return false;

        const inicioExistente = horaAMinutos(s.hora);
        const finExistente = inicioExistente + obtenerDuracionServicio(s.tipo, s.diagnostico || s.problema, s);

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
      duracion,
    };
  };

  const obtenerIntervalosDisponibles = (fecha, duracionMinutos) => {
    const fechaNorm = normalizarFecha(fecha);
    if (!fechaNorm || !duracionMinutos) return [];

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
        estado !== 'cerrado'
      );
    });

    if (tecnicosActivos.length === 0) return [];

    const intervalos = [];
    const INICIO_MINUTOS = 6 * 60; // 06:00
    const FIN_MINUTOS = 18 * 60;   // 18:00
    const STEP = 30;

    for (let inicio = INICIO_MINUTOS; inicio + duracionMinutos <= FIN_MINUTOS; inicio += STEP) {
      const fin = inicio + duracionMinutos;

      const ocupados = tecnicosActivos.filter(tec =>
        serviciosActivos.some(s => {
          if (Number(s.tecnicoId) !== Number(tec.id)) return false;

          const inicioExistente = horaAMinutos(s.hora);
          const finExistente = inicioExistente + obtenerDuracionServicio(s.tipo, s.diagnostico || s.problema, s);

          return rangosSeCruzan(inicio, fin, inicioExistente, finExistente);
        })
      );

      if (tecnicosActivos.length > ocupados.length) {
        const h = Math.floor(inicio / 60).toString().padStart(2, '0');
        const m = (inicio % 60).toString().padStart(2, '0');
        
        const hFin = Math.floor(fin / 60).toString().padStart(2, '0');
        const mFin = (fin % 60).toString().padStart(2, '0');
        
        intervalos.push({
          inicio: `${h}:${m}`,
          fin: `${hFin}:${mFin}`,
          etiqueta: `${h}:${m} - ${hFin}:${mFin}`
        });
      }
    }

    return intervalos;
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
      aires: datos.aires || null,
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
      rol: datos.rol || 'tecnico',
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

  const actualizarPrecioServicio = async (id, nuevoPrecio) => {
    const servicioActual = preciosServicios.find(p => Number(p.id) === Number(id));
    const nombre = servicioActual ? servicioActual.nombre : '';

    const actualizado = await api.put('preciosservicios', id, {
      id: Number(id),
      nombre: nombre,
      precio: Number(nuevoPrecio)
    });

    setPreciosServicios(prev =>
      prev.map(p => (Number(p.id) === Number(id) ? { ...p, precio: Number(nuevoPrecio) } : p))
    );
    
    return actualizado;
  };

  const agregarRepuesto = async (datos) => {
    const nuevo = await api.post('repuestos', {
      nombre: datos.nombre,
      codigo: datos.codigo,
      icono: datos.icono || '🔧',
      precio: Number(datos.precio),
      precioCompra: Number(datos.precioCompra || 0),
      stock: Number(datos.stock),
    });
    setRepuestos(prev => [...prev, nuevo]);
    return nuevo;
  };

  const actualizarRepuesto = async (id, cambios) => {
    const payload = {};
    if ('nombre' in cambios) payload.nombre = cambios.nombre;
    if ('codigo' in cambios) payload.codigo = cambios.codigo;
    if ('icono' in cambios) payload.icono = cambios.icono;
    if ('precio' in cambios) payload.precio = Number(cambios.precio);
    if ('precioCompra' in cambios) payload.precioCompra = Number(cambios.precioCompra);
    if ('stock' in cambios) payload.stock = Number(cambios.stock);

    const actualizado = await api.patch('repuestos', id, payload);
    setRepuestos(prev =>
      prev.map(r => (Number(r.id) === Number(id) ? actualizado : r))
    );
    return actualizado;
  };

  const eliminarRepuesto = async (id) => {
    await api.del('repuestos', id);
    setRepuestos(prev => prev.filter(r => Number(r.id) !== Number(id)));
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
      aires: datos.aires || null,
      fechaEnvio: new Date().toISOString(),
      estado: 'pendiente',
    });

    setSolicitudes(prev => [...prev, sol]);
    return sol;
  };

  const actualizarSolicitudWeb = async (id, cambios) => {
    try {
      const actualizado = await api.patch('solicitudes', id, cambios);
      setSolicitudes(prev =>
        prev.map(s => (Number(s.id) === Number(id) ? { ...s, ...actualizado } : s))
      );
      return actualizado;
    } catch (e) {
      console.error('Error actualizarSolicitudWeb:', e);
      throw e;
    }
  };

  const reiniciar = async () => {
    await cargarTodo(false);
  };

  const finalizarJornada = async () => {
    const hoyStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    
    // Obtenemos los finalizados de hoy
    const lista = servicios.map(normalizarServicio);
    const completadosHoy = lista.filter(s => 
      normalizarEstado(s.estado) === 'finalizado'
    );
    
    if (completadosHoy.length === 0) {
      console.log('No hay servicios completados hoy para cerrar.');
      // De todas formas guardamos el registro vacío
    }
    
    const stats = calcularEstadisticasDelDia(completadosHoy, clientes, tecnicos, repuestos);
    
    // Detalles por técnico
    const detalleTecnicos = tecnicos.map(t => {
      const servsTecnico = completadosHoy.filter(s => Number(s.tecnicoId) === Number(t.id));
      const gananciasTecnico = servsTecnico.reduce((sum, s) => sum + calcularPagoServicioTecnico(s), 0);
      
      const breakdown = {};
      servsTecnico.forEach(s => {
        if (Array.isArray(s.airesList) && s.airesList.length > 0) {
          s.airesList.forEach(a => {
            const tServ = a.tipoServicio || s.tipo || 'Otro';
            const formatted = tServ.charAt(0).toUpperCase() + tServ.slice(1);
            breakdown[formatted] = (breakdown[formatted] || 0) + 1;
          });
        } else {
          const tServ = s.tipo || 'Otro';
          const formatted = tServ.charAt(0).toUpperCase() + tServ.slice(1);
          breakdown[formatted] = (breakdown[formatted] || 0) + 1;
        }
      });
      const tiposServicios = Object.entries(breakdown).map(([tipo, cant]) => ({
        tipo,
        cantidad: cant
      }));

      const repUsados = [];
      servsTecnico.forEach(s => {
        (s.repuestos || []).forEach(r => {
          const ex = repUsados.find(x => Number(x.repuestoId) === Number(r.repuestoId));
          if (ex) {
            ex.cantidad += r.cantidad;
            const repDetalle = repuestos.find(x => Number(x.id) === Number(r.repuestoId));
            ex.costo += repDetalle ? Number(repDetalle.precioCompra || 0) * r.cantidad : 0;
            ex.venta += repDetalle ? Number(repDetalle.precio || 0) * r.cantidad : 0;
          } else {
            const repDetalle = repuestos.find(x => Number(x.id) === Number(r.repuestoId));
            repUsados.push({
              repuestoId: r.repuestoId,
              nombre: r.nombre || repDetalle?.nombre || `Repuesto #${r.repuestoId}`,
              icono: repDetalle?.icono || '🔧',
              cantidad: r.cantidad,
              costo: repDetalle ? Number(repDetalle.precioCompra || 0) * r.cantidad : 0,
              venta: repDetalle ? Number(repDetalle.precio || 0) * r.cantidad : 0
            });
          }
        });
      });
      return {
        id: t.id,
        nombre: t.nombre,
        serviciosCompletados: servsTecnico.length,
        ganancias: gananciasTecnico,
        repuestos: repUsados,
        tiposServicios
      };
    }).filter(t => t.serviciosCompletados > 0);

    // Detalles generales de repuestos
    const detalleRepuestosGeneral = [];
    completadosHoy.forEach(s => {
      (s.repuestos || []).forEach(r => {
        const ex = detalleRepuestosGeneral.find(x => Number(x.repuestoId) === Number(r.repuestoId));
        if (ex) {
          ex.cantidad += r.cantidad;
          const repDetalle = repuestos.find(x => Number(x.id) === Number(r.repuestoId));
          ex.costoTotal += repDetalle ? Number(repDetalle.precioCompra || 0) * r.cantidad : 0;
          ex.ventaTotal += repDetalle ? Number(repDetalle.precio || 0) * r.cantidad : 0;
        } else {
          const repDetalle = repuestos.find(x => Number(x.id) === Number(r.repuestoId));
          detalleRepuestosGeneral.push({
            repuestoId: r.repuestoId,
            nombre: r.nombre || repDetalle?.nombre || `Repuesto #${r.repuestoId}`,
            icono: repDetalle?.icono || '🔧',
            cantidad: r.cantidad,
            costoTotal: repDetalle ? Number(repDetalle.precioCompra || 0) * r.cantidad : 0,
            ventaTotal: repDetalle ? Number(repDetalle.precio || 0) * r.cantidad : 0
          });
        }
      });
    });

    const costoTotalRepuestos = detalleRepuestosGeneral.reduce((sum, r) => sum + r.costoTotal, 0);
    const gananciaTotalRepuestos = detalleRepuestosGeneral.reduce((sum, r) => sum + r.ventaTotal, 0) - costoTotalRepuestos;

    const payloadBackend = {
      fechaCierre: hoyStr,
      fechaHoraCierreReal: new Date().toISOString(),
      datosJson: JSON.stringify({
        estadisticasGenerales: {
          totalIngresos: stats.ingresos,
          totalPagadoTecnicos: stats.totalPagadoTecnicos,
          totalCostoRepuestos: costoTotalRepuestos,
          gananciaNeta: stats.gananciaNeta
        },
        detalleTecnicos,
        detalleRepuestos: detalleRepuestosGeneral
      })
    };

    try {
      const resApi = await api.post('resumenesdiarios', payloadBackend);
      
      let fReal = resApi.fechaHoraCierreReal;
      if (fReal && typeof fReal === 'string' && !fReal.endsWith('Z') && !fReal.includes('+')) {
        fReal += 'Z';
      }
      const nuevoCierre = {
        id: resApi.id,
        fechaCierre: resApi.fechaCierre,
        fechaHoraCierreReal: fReal,
        estadisticasGenerales: {
          totalIngresos: stats.ingresos,
          totalPagadoTecnicos: stats.totalPagadoTecnicos,
          totalCostoRepuestos: costoTotalRepuestos,
          gananciaNeta: stats.gananciaNeta
        },
        detalleTecnicos,
        detalleRepuestos: detalleRepuestosGeneral
      };

      setHistorialCierres(prev => [...prev, nuevoCierre]);
    } catch (error) {
      console.error("Error guardando resumen diario en API:", error);
      alert("No se pudo guardar el resumen en la API.");
    }

    // Marcar como cerrados para reiniciar la jornada
    try {
      for (const s of completadosHoy) {
        await api.patch('servicios', s.id, { estado: 'cerrado' });
      }
      await cargarTodo(false);
    } catch(e) {
      console.error("Error marcando servicios como cerrados:", e);
    }
  };

  // Asignar al window para que el useEffect lo pueda invocar sin dependencias cíclicas
  window.__finalizarJornadaGlobal = finalizarJornada;

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
        historialCierres,
        finalizarJornada,
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
        agregarRepuesto,
        actualizarRepuesto,
        eliminarRepuesto,
        obtenerSolicitudesWeb,
        agregarSolicitudWeb,
        actualizarSolicitudWeb,
        obtenerDisponibilidadTecnicos,
        obtenerIntervalosDisponibles,
        obtenerDuracionServicio,
        calcularIntervaloEtiqueta,
        formatearIntervaloBD,
        reiniciar,
        preciosServicios,
        actualizarPrecioServicio,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}