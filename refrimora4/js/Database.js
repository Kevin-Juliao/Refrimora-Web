// ============================================================
//  ARCHIVO: js/Database.js
//  RESPONSABILIDAD: Guardar y entregar los datos del sistema
//
//  PRINCIPIO SOLID
//
// ============================================================

class Database {

  // Clave con la que guardamos todo en localStorage
  static CLAVE = "rfrm_datos";

  constructor() {
    this._cargar();
  }

  // Carga los datos desde localStorage, o los inicializa si es la primera vez
  _cargar() {
    const guardado = localStorage.getItem(Database.CLAVE);
    if (guardado) {
      const datos    = JSON.parse(guardado);
      this.usuarios  = datos.usuarios;
      this.clientes  = datos.clientes;
      this.repuestos = datos.repuestos;
      this.servicios = datos.servicios;
    } else {
      // Primera vez: cargar datos de ejemplo
      this.usuarios  = this._usuariosIniciales();
      this.clientes  = this._clientesIniciales();
      this.repuestos = this._repuestosIniciales();
      this.servicios = this._serviciosIniciales();
      this._guardar();
    }
  }

  // Guarda el estado actual en localStorage después de cada cambio
  _guardar() {
    localStorage.setItem(Database.CLAVE, JSON.stringify({
      usuarios:  this.usuarios,
      clientes:  this.clientes,
      repuestos: this.repuestos,
      servicios: this.servicios,
    }));
  }

  // Borra todos los datos guardados y vuelve a los iniciales
  reiniciar() {
    localStorage.removeItem(Database.CLAVE);
    localStorage.removeItem("rfrm_solicitudes");
    this._cargar();
  }

  // ── Datos iniciales de ejemplo ──────────────────────────────

  _usuariosIniciales() {
    return [
      { id: 1, nombre: "Carlos Mora",    correo: "admin@refrimora.com",      password: "admin123", rol: "admin" },
      { id: 2, nombre: "Laura Jiménez",  correo: "secretaria@refrimora.com", password: "secre123", rol: "secretaria" },
      { id: 3, nombre: "Pedro Álvarez",  correo: "pedro@refrimora.com",      password: "tec123",   rol: "tecnico", disponible: true  },
      { id: 4, nombre: "Juan Rodríguez", correo: "juan@refrimora.com",       password: "tec456",   rol: "tecnico", disponible: true },
    ];
  }

  _clientesIniciales() {
    return [
      { id: 1, nombre: "Juan Pérez",    telefono: "3001234567", direccion: "Calle 12 #34, Bogotá",      email: "juan@email.com",  fecha: "2025-01-10" },
      { id: 2, nombre: "María Gómez",   telefono: "3109876543", direccion: "Cra 45 #22, Medellín",      email: "maria@email.com", fecha: "2025-01-12" },
      { id: 3, nombre: "Luis Martínez", telefono: "3204567890", direccion: "Av. Central #56, Cali",     email: "luis@email.com",  fecha: "2025-01-15" },
      { id: 4, nombre: "Ana Torres",    telefono: "3151112233", direccion: "Carrera 8 #4-15, Curumaní", email: "ana@email.com",   fecha: "2025-01-18" },
    ];
  }

  _repuestosIniciales() {
    return [
      { id: 1, nombre: "Filtro de Aire",     codigo: "FILT-01",  precio: 25000,  stock: 40, icono: "🌀" },
      { id: 2, nombre: "Control Remoto",     codigo: "CTRL-01",  precio: 40000,  stock: 15, icono: "📱" },
      { id: 3, nombre: "Motor Ventilador",   codigo: "MOT-01",   precio: 120000, stock: 8,  icono: "⚙️" },
      { id: 4, nombre: "Gas R-22",           codigo: "GAS-22",   precio: 85000,  stock: 20, icono: "🧊" },
      { id: 5, nombre: "Gas R-410A",         codigo: "GAS-410",  precio: 120000, stock: 15, icono: "❄️" },
      { id: 6, nombre: "Capacitor 35+5 MFD", codigo: "CAP-01",   precio: 25000,  stock: 30, icono: "🔋" },
      { id: 7, nombre: "Compresor LG 1 Ton", codigo: "COMP-01",  precio: 450000, stock: 4,  icono: "🔧" },
      { id: 8, nombre: "Termostato Digital", codigo: "TERM-01",  precio: 35000,  stock: 12, icono: "🌡️" },
    ];
  }

  _serviciosIniciales() {
    return [
      { id: 1, clienteId: 1, tecnicoId: 3, tipo: "Reparación",    diagnostico: "Fuga de gas",          fecha: "2025-01-22", hora: "09:00", estado: "en-camino",     repuestosUsados: [],                               precioServicio: 60000,  notas: "" },
      { id: 2, clienteId: 2, tecnicoId: 3, tipo: "Mantenimiento", diagnostico: "Limpieza profunda",     fecha: "2025-01-22", hora: "14:00", estado: "en-reparacion", repuestosUsados: [{ repuestoId: 1, cantidad: 1 }], precioServicio: 50000,  notas: "" },
      { id: 3, clienteId: 3, tecnicoId: 4, tipo: "Reparación",    diagnostico: "Cambio de condensador", fecha: "2025-01-22", hora: "10:00", estado: "finalizado",    repuestosUsados: [{ repuestoId: 3, cantidad: 1 }], precioServicio: 80000,  notas: "Trabajo terminado sin novedad" },
      { id: 4, clienteId: 4, tecnicoId: 3, tipo: "Instalación",   diagnostico: "Instalación nueva",     fecha: "2025-01-23", hora: "08:00", estado: "agendado",      repuestosUsados: [],                               precioServicio: 120000, notas: "" },
    ];
  }

  // ── Métodos de búsqueda ─────────────────────────────────────

  buscarUsuario(correo, password) {
    return this.usuarios.find(u => u.correo === correo && u.password === password);
  }

  buscarCliente(id) {
    return this.clientes.find(c => c.id === id);
  }

  buscarTecnico(id) {
    return this.usuarios.find(u => u.id === id && u.rol === "tecnico");
  }

  buscarRepuesto(id) {
    return this.repuestos.find(r => r.id === id);
  }

  obtenerTecnicos() {
    return this.usuarios.filter(u => u.rol === "tecnico");
  }

  serviciosDelTecnico(tecnicoId) {
    return this.servicios.filter(s => s.tecnicoId === tecnicoId);
  }

  // ── Métodos para agregar y modificar ───────────────────────
  // Cada uno llama _guardar() para que el cambio persista

  siguienteId(lista) {
    return lista.length > 0 ? Math.max(...lista.map(x => x.id)) + 1 : 1;
  }

  agregarCliente(datos) {
    const cliente = {
      id:        this.siguienteId(this.clientes),
      nombre:    datos.nombre,
      telefono:  datos.telefono,
      direccion: datos.direccion || "",
      email:     datos.email || "",
      fecha:     new Date().toISOString().split("T")[0]
    };
    this.clientes.push(cliente);
    this._guardar();
    return cliente;
  }

  agregarServicio(datos) {
    const servicio = {
      id:              this.siguienteId(this.servicios),
      clienteId:       datos.clienteId,
      tecnicoId:       datos.tecnicoId,
      tipo:            datos.tipo,
      diagnostico:     datos.diagnostico || "",
      fecha:           datos.fecha,
      hora:            datos.hora || "08:00",
      estado:          "agendado",
      repuestosUsados: [],
      precioServicio:  datos.precioServicio || 50000,
      notas:           ""
    };
    this.servicios.push(servicio);
    this._guardar(); // ← El técnico lo verá al recargar
    return servicio;
  }

  agregarTecnico(datos) {
    const tecnico = {
      id:         this.siguienteId(this.usuarios),
      nombre:     datos.nombre,
      correo:     datos.correo,
      password:   datos.password || "tec123",
      rol:        "tecnico",
      disponible: true
    };
    this.usuarios.push(tecnico);
    this._guardar();
    return tecnico;
  }

  // Actualiza campos de un servicio (estado, notas, repuestos)
  actualizarServicio(id, cambios) {
    const srv = this.servicios.find(s => s.id === id);
    if (!srv) return null;
    Object.assign(srv, cambios);
    this._guardar(); // ← La secretaria y el admin verán el cambio
    return srv;
  }

  actualizarPrecioRepuesto(id, nuevoPrecio) {
    const rep = this.repuestos.find(r => r.id === id);
    if (!rep) return null;
    rep.precio = nuevoPrecio;
    this._guardar();
    return rep;
  }

  toggleDisponibleTecnico(id) {
    const tec = this.buscarTecnico(id);
    if (!tec) return null;
    tec.disponible = !tec.disponible;
    this._guardar();
    return tec;
  }

  // ── Solicitudes web ─────────────────────────────────────────

  agregarSolicitudWeb(datos) {
    const solicitud = {
      id:         Date.now(),
      nombre:     datos.nombre,
      telefono:   datos.telefono,
      direccion:  datos.direccion,
      email:      datos.email || "",
      tipo:       datos.tipo,
      fecha:      datos.fecha,
      problema:   datos.problema || "",
      fechaEnvio: new Date().toLocaleString("es-CO"),
      estado:     "pendiente"
    };
    const guardadas = JSON.parse(localStorage.getItem("rfrm_solicitudes") || "[]");
    guardadas.push(solicitud);
    localStorage.setItem("rfrm_solicitudes", JSON.stringify(guardadas));
    return solicitud;
  }

  obtenerSolicitudesWeb() {
    return JSON.parse(localStorage.getItem("rfrm_solicitudes") || "[]");
  }
}
