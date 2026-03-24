// ============================================================
//  ARCHIVO: js/Sesion.js
//  RESPONSABILIDAD: Manejar quién está conectado al sistema
//
//  PRINCIPIO SOLID APLICADO
// ============================================================

class Sesion {

  constructor(baseDatos) {
    // Recibe la base de datos para poder buscar usuarios
    this.db = baseDatos;

    // El usuario conectado actualmente (null = nadie conectado)
    this.usuarioActual = null;

    // Al crear la sesión, revisamos si ya había alguien conectado antes
    this._cargarSesionGuardada();
  }

  // ─── MÉTODOS PRIVADOS (solo para uso interno) ──────────────

  // Revisa si quedó una sesión guardada en el navegador
  _cargarSesionGuardada() {
    const guardada = localStorage.getItem("rfrm_sesion");
    if (guardada) {
      this.usuarioActual = JSON.parse(guardada);
    }
  }

  // ─── MÉTODOS PÚBLICOS ──────────────────────────────────────

  // Intenta iniciar sesión con correo y contraseña
  // Devuelve el usuario si es correcto, null si no
  iniciar(correo, password) {
    const usuario = this.db.buscarUsuario(correo, password);

    if (!usuario) {
      // Credenciales incorrectas
      return null;
    }

    // Guardamos el usuario actual
    this.usuarioActual = usuario;

    // Lo guardamos en localStorage para que no se pierda al cambiar de página
    localStorage.setItem("rfrm_sesion", JSON.stringify(usuario));

    return usuario;
  }

  // Cierra la sesión y redirige al login
  cerrar() {
    this.usuarioActual = null;
    localStorage.removeItem("rfrm_sesion");

    // Determinar a qué nivel de carpeta estamos para redirigir correctamente
    const ruta = window.location.pathname;
    const enSubcarpeta = ruta.includes("/admin/") || ruta.includes("/secretaria/") || ruta.includes("/tecnico/");

    window.location.href = enSubcarpeta ? "../../pages/login.html" : "pages/login.html";
  }

  // Devuelve el usuario que está conectado actualmente
  obtenerUsuario() {
    return this.usuarioActual;
  }

  // Revisa si hay alguien conectado
  estaConectado() {
    return this.usuarioActual !== null;
  }

  // Protege una página: si no hay sesión o el rol no coincide, redirige
  proteger(rolRequerido) {
    if (!this.estaConectado()) {
      this.cerrar();
      return false;
    }

    if (rolRequerido && this.usuarioActual.rol !== rolRequerido) {
      // El usuario no tiene el rol correcto para esta página
      this.cerrar();
      return false;
    }

    return true;
  }

  // Devuelve hacia dónde redirigir según el rol del usuario
  obtenerRutaPorRol(rol) {
    const rutas = {
      admin:       "admin/dashboard.html",
      secretaria:  "secretaria/dashboard.html",
      tecnico:     "tecnico/dashboard.html"
    };
    return rutas[rol] || "../index.html";
  }
}
