// ============================================================
//  ARCHIVO: js/UI.js
//  RESPONSABILIDAD: Construir y mostrar el HTML de cada pantalla
//
//  PRINCIPIOS SOLID:
//  ✅ Open/Closed  — UI es la base cerrada; cada panel la extiende
//  ✅ Liskov       — PanelAdmin, PanelSecretaria, PanelTecnico
//                    comparten los mismos métodos base de UI
//
//  MEJORA v4: Los paneles ya no tienen HTML extenso en el .html.
//  Cada método genera su propio HTML y lo inyecta en un <div> vacío.
//  Así los archivos HTML quedan cortos y limpios.
// ============================================================


// ════════════════════════════════════════════════════════════
//  CLASE BASE: UI
//  Métodos que TODOS los paneles (admin, secretaria, técnico)
//  necesitan. Solo se escribe una vez aquí.
// ════════════════════════════════════════════════════════════

class UI {

  constructor(calc) {
    this.calc = calc; // Necesitamos la calculadora para formatear
  }

  // Muestra un mensaje de alerta dentro de un contenedor HTML
  mostrarAlerta(contenedorId, tipo, mensaje) {
    const el = document.getElementById(contenedorId);
    if (!el) return;
    const iconos = { error: "⚠️", success: "✅", info: "ℹ️" };
    el.innerHTML = `<div class="alert alert-${tipo}">${iconos[tipo] || ""} ${mensaje}</div>`;
    if (tipo !== "error") setTimeout(() => { el.innerHTML = ""; }, 3500);
  }

  // Abre y cierra modales por su ID
  abrirModal(id)  { document.getElementById(id)?.classList.add("open"); }
  cerrarModal(id) { document.getElementById(id)?.classList.remove("open"); }

  // Muestra una sección y esconde las demás
  cambiarSeccion(id) {
    document.querySelectorAll(".page-section").forEach(s => s.classList.remove("active"));
    document.getElementById("sec-" + id)?.classList.add("active");
  }

  // Marca el botón del navbar como activo
  marcarNavActivo(btn) {
    document.querySelectorAll(".nav-link").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
  }

  // Convierte un estado en un badge de color para las tablas
  estadoBadge(estado) {
    const mapa = {
      "agendado":      { c: "badge-agendado",   t: "Agendado"      },
      "en-camino":     { c: "badge-camino",      t: "En Camino"     },
      "en-reparacion": { c: "badge-reparacion",  t: "En Reparación" },
      "finalizado":    { c: "badge-finalizado",  t: "Completado"    },
      "cancelado":     { c: "badge-cancelado",   t: "Cancelado"     },
    };
    const op = mapa[estado] || { c: "", t: estado };
    return `<span class="badge ${op.c}">${op.t}</span>`;
  }

  // Genera el HTML del avatar + nombre para las tablas de clientes
  avatarCliente(nombre) {
    return `
      <div class="td-cliente">
        <div class="avatar-sm">${nombre.charAt(0)}</div>
        <span class="text-bold">${nombre}</span>
      </div>`;
  }

  // ── Bloques comunes del sidebar derecho ─────────────────────

  // Dibuja los 4 contadores superiores (Agendadas, En Camino, etc.)
  dibujarContadores(stats) {
    const el = document.getElementById("contadores");
    if (!el) return;
    el.innerHTML = `
      <div class="counter-item agendado">
        <div class="label">Agendadas</div>
        <div class="number">${stats.agendados}</div>
      </div>
      <div class="counter-item camino">
        <div class="label">En Camino</div>
        <div class="number">${stats.enCamino}</div>
      </div>
      <div class="counter-item reparacion">
        <div class="label">En Reparación</div>
        <div class="number">${stats.enReparacion}</div>
      </div>
      <div class="counter-item completado">
        <div class="label">Completadas</div>
        <div class="number">${stats.finalizados}</div>
      </div>`;
  }

  // Dibuja las ganancias y repuestos usados del día
  dibujarResumen(stats) {
    const el = document.getElementById("resumenDia");
    if (!el) return;
    el.innerHTML = `
      <div class="resumen-item ganancias">
        <span>Ganancias de Hoy:</span>
        <span class="value">${this.calc.formatearPeso(stats.ingresos)}</span>
      </div>
      <div class="resumen-item repuestos">
        <span>Repuestos Usados:</span>
        <span class="value">${stats.repuestosUsados}</span>
      </div>`;
  }

  // Dibuja el timeline de pasos del servicio
  dibujarTimeline(estadoActivo) {
    const el = document.getElementById("timelineDash");
    if (!el) return;
    const pasos = [
      { key: "agendado",      label: "Agendado"      },
      { key: "en-camino",     label: "En Camino"     },
      { key: "en-reparacion", label: "En Reparación" },
      { key: "finalizado",    label: "Completadas"   },
    ];
    const pos = pasos.findIndex(p => p.key === estadoActivo);
    el.innerHTML = pasos.map((p, i) => {
      const clase = i < pos ? "done" : i === pos ? "active" : "";
      return `<div class="estado-step ${clase}"><div class="dot"></div><span>${p.label}</span></div>`;
    }).join("");
  }

  // Dibuja los 3 primeros repuestos en el panel derecho
  dibujarRepuestosPanel(repuestos) {
    const el = document.getElementById("repuestosGrid");
    if (!el) return;
    el.innerHTML = repuestos.slice(0, 3).map(r => `
      <div class="repuesto-card">
        <div class="rep-icon">${r.icono}</div>
        <div class="rep-nombre">${r.nombre}</div>
        <div class="rep-precio">${this.calc.formatearPeso(r.precio)}</div>
        <button class="btn btn-primary btn-sm btn-full">Agregar</button>
      </div>`).join("");
  }

  // Genera una fila de tabla con los datos de un servicio
  // (método de ayuda usado por los paneles hijos)
  _filaServicio(sv, db, columnas) {
    const cliente = db.buscarCliente(sv.clienteId);
    const tecnico = db.buscarTecnico(sv.tecnicoId);
    const total   = this.calc.totalServicio(sv);
    const datos   = {
      id:         `<td class="text-muted">#${sv.id}</td>`,
      cliente:    `<td>${this.avatarCliente(cliente?.nombre || "—")}</td>`,
      direccion:  `<td class="text-muted">${cliente?.direccion || "—"}</td>`,
      tecnico:    `<td>${tecnico?.nombre || "—"}</td>`,
      tipo:       `<td>${sv.tipo}</td>`,
      fecha:      `<td>${this.calc.formatearFecha(sv.fecha)} ${sv.hora || ""}</td>`,
      estado:     `<td>${this.estadoBadge(sv.estado)}</td>`,
      total:      `<td class="text-blue text-bold">${this.calc.formatearPeso(total)}</td>`,
      diagnostico:`<td>${sv.diagnostico}</td>`,
    };
    return "<tr>" + columnas.map(c => datos[c] || "<td></td>").join("") + "</tr>";
  }
}


// ════════════════════════════════════════════════════════════
//  CLASE HIJA: PanelAdmin  (extiende UI)
//  ✅ Open/Closed: agrega funciones sin tocar la clase UI
//  ✅ Liskov: puede usarse en cualquier lugar donde se use UI
// ════════════════════════════════════════════════════════════

class PanelAdmin extends UI {

  constructor(calc, db) {
    super(calc);
    this.db = db;
  }

  // Genera y pone en pantalla la sección completa de inicio (dashboard)
  dibujarInicio() {
    const stats = this.calc.calcularEstadisticas(
      this.db.servicios, this.db.clientes, this.db.obtenerTecnicos()
    );
    this.dibujarContadores(stats);
    this.dibujarResumen(stats);
    this.dibujarTimeline("en-reparacion");
    this.dibujarRepuestosPanel(this.db.repuestos);
    this._dibujarTablaServicios("tablaDashboard", this.db.servicios.slice(-4).reverse());
    this._dibujarTablaTecnicosDash();
  }

  // Tabla de servicios reutilizable (se usa en inicio y en la sección de órdenes)
  _dibujarTablaServicios(idTabla, servicios) {
    const el = document.getElementById(idTabla);
    if (!el) return;
    const cols = ["id", "cliente", "direccion", "tecnico", "tipo", "fecha", "estado", "total"];
    el.innerHTML = `
      <thead><tr>
        <th>#</th><th>Cliente</th><th>Dirección</th><th>Técnico</th>
        <th>Tipo</th><th>Fecha</th><th>Estado</th><th>Total</th>
      </tr></thead>
      <tbody>${servicios.map(sv => this._filaServicio(sv, this.db, cols)).join("")}</tbody>`;
  }

  // Tabla de técnicos para el dashboard
  _dibujarTablaTecnicosDash() {
    const el = document.getElementById("tablaTecnicosDash");
    if (!el) return;
    el.innerHTML = `
      <thead><tr><th>Técnico</th><th>Estado</th><th>Servicios</th></tr></thead>
      <tbody>${this.db.obtenerTecnicos().map(t => {
        const asig  = this.db.servicios.filter(sv => sv.tecnicoId === t.id).length;
        const badge = t.disponible
          ? '<span class="badge badge-camino">Disponible</span>'
          : '<span class="badge badge-reparacion">Ocupado</span>';
        return `<tr><td>${this.avatarCliente(t.nombre)}</td><td>${badge}</td><td>${asig} servicios</td></tr>`;
      }).join("")}</tbody>`;
  }

  // Sección de todas las órdenes
  dibujarSeccionOrdenes() {
    this._dibujarTablaServicios("tablaServicios", this.db.servicios);
  }

  // Sección de clientes
  dibujarSeccionClientes() {
    const el = document.getElementById("tablaClientes");
    if (!el) return;
    el.innerHTML = `
      <thead><tr><th>Nombre</th><th>Teléfono</th><th>Dirección</th><th>Email</th><th>Registro</th></tr></thead>
      <tbody>${this.db.clientes.map(c => `
        <tr>
          <td>${this.avatarCliente(c.nombre)}</td>
          <td>${c.telefono}</td>
          <td class="text-muted">${c.direccion}</td>
          <td class="text-muted">${c.email || "—"}</td>
          <td class="text-muted">${this.calc.formatearFecha(c.fecha)}</td>
        </tr>`).join("")}
      </tbody>`;
  }

  // Sección de técnicos con botón para cambiar disponibilidad
  dibujarSeccionTecnicos() {
    const el = document.getElementById("tablaTecnicos");
    if (!el) return;
    el.innerHTML = `
      <thead><tr><th>Nombre</th><th>Correo</th><th>Estado</th><th>Servicios</th><th>Acción</th></tr></thead>
      <tbody>${this.db.obtenerTecnicos().map(t => {
        const asig = this.db.servicios.filter(sv => sv.tecnicoId === t.id).length;
        const fin  = this.db.servicios.filter(sv => sv.tecnicoId === t.id && sv.estado === "finalizado").length;
        const badge = t.disponible
          ? '<span class="badge badge-camino">Disponible</span>'
          : '<span class="badge badge-reparacion">Ocupado</span>';
        return `
          <tr>
            <td>${this.avatarCliente(t.nombre)}</td>
            <td class="text-muted">${t.correo}</td>
            <td>${badge}</td>
            <td>${asig} asignados · ${fin} finalizados</td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="toggleDisponible(${t.id})">
                ${t.disponible ? "Marcar Ocupado" : "Marcar Disponible"}
              </button>
            </td>
          </tr>`;
      }).join("")}
      </tbody>`;
  }

  // Sección de repuestos e inventario
  dibujarSeccionRepuestos() {
    const el = document.getElementById("tablaRepuestos");
    if (!el) return;
    el.innerHTML = `
      <thead><tr><th>Código</th><th>Nombre</th><th>Precio</th><th>Stock</th></tr></thead>
      <tbody>${this.db.repuestos.map(r => `
        <tr>
          <td class="text-muted">${r.codigo}</td>
          <td>${r.icono} <span class="text-bold">${r.nombre}</span></td>
          <td class="text-blue text-bold">${this.calc.formatearPeso(r.precio)}</td>
          <td style="color:${r.stock < 10 ? "#dc3545" : "#28a745"};font-weight:600;">${r.stock} uds</td>
        </tr>`).join("")}
      </tbody>`;
    // Llenar select del modal de editar precio
    const sel = document.getElementById("ep-repuesto");
    if (sel) {
      sel.innerHTML = '<option value="">Seleccionar...</option>' +
        this.db.repuestos.map(r => `<option value="${r.id}">${r.nombre}</option>`).join("");
    }
  }

  // Sección de solicitudes web
  dibujarSeccionSolicitudes() {
    const el   = document.getElementById("tablaSolicitudes");
    const sols = this.db.obtenerSolicitudesWeb();
    if (!el) return;
    if (sols.length === 0) {
      el.innerHTML = `<tbody><tr><td colspan="6" class="empty-msg">No hay solicitudes web aún.</td></tr></tbody>`;
      return;
    }
    el.innerHTML = `
      <thead><tr><th>Nombre</th><th>Teléfono</th><th>Servicio</th><th>Fecha</th><th>Problema</th><th>Recibido</th></tr></thead>
      <tbody>${sols.map(s => `
        <tr>
          <td class="text-bold">${s.nombre}</td>
          <td>${s.telefono}</td>
          <td>${s.tipo}</td>
          <td>${this.calc.formatearFecha(s.fecha)}</td>
          <td class="text-muted">${s.problema || "—"}</td>
          <td class="text-muted">${s.fechaEnvio}</td>
        </tr>`).join("")}
      </tbody>`;
  }
}


// ════════════════════════════════════════════════════════════
//  CLASE HIJA: PanelSecretaria  (extiende UI)
// ════════════════════════════════════════════════════════════

class PanelSecretaria extends UI {

  constructor(calc, db) {
    super(calc);
    this.db = db;
  }

  dibujarInicio() {
    const stats = this.calc.calcularEstadisticas(
      this.db.servicios, this.db.clientes, this.db.obtenerTecnicos()
    );
    this.dibujarContadores(stats);
    this.dibujarResumen(stats);
    this.dibujarTimeline("en-reparacion");
    this._dibujarTablaOrdenes();
    this._dibujarSolicitudesWeb();
  }

  // Tabla de órdenes con botón "Actualizar"
  _dibujarTablaOrdenes() {
    const el = document.getElementById("tablaOrdenes");
    if (!el) return;
    el.innerHTML = `
      <thead><tr><th>Cliente</th><th>Dirección</th><th>Diagnóstico</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>${this.db.servicios.map(sv => {
        const cliente = this.db.buscarCliente(sv.clienteId);
        const boton = (sv.estado === "finalizado" || sv.estado === "cancelado")
          ? `<span class="badge badge-finalizado">Finalizado</span>`
          : `<button class="btn btn-info btn-sm" onclick="abrirActualizar(${sv.id})">Actualizar ›</button>`;
        return `
          <tr>
            <td>${this.avatarCliente(cliente?.nombre || "—")}</td>
            <td class="text-muted">${cliente?.direccion || "—"}</td>
            <td>${sv.diagnostico}</td>
            <td>${this.estadoBadge(sv.estado)}</td>
            <td>${boton}</td>
          </tr>`;
      }).join("")}</tbody>`;
  }

  // Sección de todas las órdenes (con más columnas)
  dibujarSeccionOrdenes() {
    const el = document.getElementById("tablaTodasOrdenes");
    if (!el) return;
    const cols = ["cliente", "tecnico", "tipo", "fecha", "estado", "total"];
    el.innerHTML = `
      <thead><tr><th>Cliente</th><th>Técnico</th><th>Tipo</th><th>Fecha</th><th>Estado</th><th>Total</th></tr></thead>
      <tbody>${this.db.servicios.map(sv => this._filaServicio(sv, this.db, cols)).join("")}</tbody>`;
  }

  // Prepara el formulario de nueva orden (llena los selects)
  prepararFormOrden() {
    document.getElementById("ord-cliente").innerHTML =
      '<option value="">Seleccionar cliente...</option>' +
      this.db.clientes.map(c => `<option value="${c.id}">${c.nombre} — ${c.telefono}</option>`).join("");

    document.getElementById("ord-tecnico").innerHTML =
      '<option value="">Seleccionar técnico...</option>' +
      this.db.obtenerTecnicos().map(t =>
        `<option value="${t.id}">${t.nombre} ${t.disponible ? "✅" : "(ocupado)"}</option>`
      ).join("");

    document.getElementById("ord-fecha").min = new Date().toISOString().split("T")[0];
  }

  dibujarSeccionClientes() {
    const el = document.getElementById("tablaClientes");
    if (!el) return;
    el.innerHTML = `
      <thead><tr><th>Nombre</th><th>Teléfono</th><th>Dirección</th><th>Email</th></tr></thead>
      <tbody>${this.db.clientes.map(c => `
        <tr>
          <td>${this.avatarCliente(c.nombre)}</td>
          <td>${c.telefono}</td>
          <td class="text-muted">${c.direccion}</td>
          <td class="text-muted">${c.email || "—"}</td>
        </tr>`).join("")}
      </tbody>`;
  }

  // Solicitudes web en el panel lateral (máx 4)
  _dibujarSolicitudesWeb() {
    const el   = document.getElementById("listaSolicitudesWeb");
    const sols = this.db.obtenerSolicitudesWeb();
    if (!el) return;
    document.getElementById("badgeSols").textContent = sols.length;
    if (sols.length === 0) {
      el.innerHTML = `<p class="text-muted" style="font-size:13px;text-align:center;padding:10px;">Sin solicitudes pendientes</p>`;
      return;
    }
    el.innerHTML = sols.slice(0, 4).map(s => `
      <div style="border:1px solid #dde2e8;border-radius:6px;padding:10px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span class="text-bold" style="font-size:13px;">${s.nombre}</span>
          <span class="badge badge-agendado">${s.tipo}</span>
        </div>
        <div class="text-muted" style="font-size:12px;">📞 ${s.telefono} · 📅 ${this.calc.formatearFecha(s.fecha)}</div>
        <div class="text-muted" style="font-size:12px;">📍 ${s.direccion}</div>
        <button class="btn btn-primary btn-sm" style="margin-top:8px;" onclick="convertirEnOrden(${s.id})">
          Crear Orden →
        </button>
      </div>`).join("");
  }

  // Tabla completa de solicitudes web
  dibujarSeccionSolicitudes() {
    const el   = document.getElementById("tablaSolicitudesCompleta");
    const sols = this.db.obtenerSolicitudesWeb();
    if (!el) return;
    if (sols.length === 0) {
      el.innerHTML = `<tbody><tr><td colspan="7" class="empty-msg">No hay solicitudes web aún.</td></tr></tbody>`;
      return;
    }
    el.innerHTML = `
      <thead><tr><th>Nombre</th><th>Teléfono</th><th>Servicio</th><th>Fecha</th><th>Problema</th><th>Recibido</th><th>Acción</th></tr></thead>
      <tbody>${sols.map(s => `
        <tr>
          <td class="text-bold">${s.nombre}</td>
          <td>${s.telefono}</td>
          <td>${s.tipo}</td>
          <td>${this.calc.formatearFecha(s.fecha)}</td>
          <td class="text-muted">${s.problema || "—"}</td>
          <td class="text-muted">${s.fechaEnvio}</td>
          <td><button class="btn btn-primary btn-sm" onclick="convertirEnOrden(${s.id})">Crear Orden</button></td>
        </tr>`).join("")}
      </tbody>`;
  }

  dibujarSeccionRepuestos() {
    const el = document.getElementById("tablaRepuestos");
    if (!el) return;
    el.innerHTML = `
      <thead><tr><th>Código</th><th>Nombre</th><th>Precio</th><th>Stock</th></tr></thead>
      <tbody>${this.db.repuestos.map(r => `
        <tr>
          <td class="text-muted">${r.codigo}</td>
          <td>${r.icono} <span class="text-bold">${r.nombre}</span></td>
          <td class="text-blue text-bold">${this.calc.formatearPeso(r.precio)}</td>
          <td style="color:${r.stock < 10 ? "#dc3545" : "#28a745"};font-weight:600;">${r.stock} uds</td>
        </tr>`).join("")}
      </tbody>`;
  }
}


// ════════════════════════════════════════════════════════════
//  CLASE HIJA: PanelTecnico  (extiende UI)
// ════════════════════════════════════════════════════════════

class PanelTecnico extends UI {

  constructor(calc, db) {
    super(calc);
    this.db = db;
  }

  dibujarInicio(tecnicoId) {
    // Solo los servicios de ESTE técnico
    const misSvs = this.db.serviciosDelTecnico(tecnicoId);
    const stats  = this.calc.calcularEstadisticas(misSvs, this.db.clientes, this.db.obtenerTecnicos());

    this.dibujarContadores(stats);
    this.dibujarResumen(stats);
    this.dibujarTimeline("en-reparacion");
    this.dibujarRepuestosPanel(this.db.repuestos);
    this._dibujarTablaOrdenes(misSvs);
  }

  // Tabla de órdenes del técnico con botón "Actualizar"
  _dibujarTablaOrdenes(servicios) {
    const el = document.getElementById("tablaOrdenes");
    if (!el) return;
    if (servicios.length === 0) {
      el.innerHTML = `<tbody><tr><td colspan="5" class="empty-msg">No tienes órdenes asignadas aún.</td></tr></tbody>`;
      return;
    }
    el.innerHTML = `
      <thead><tr><th>Cliente</th><th>Dirección</th><th>Diagnóstico</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>${servicios.map(sv => {
        const cliente = this.db.buscarCliente(sv.clienteId);
        const boton   = sv.estado === "finalizado"
          ? `<span style="color:#28a745;font-weight:600;">✓ Finalizado</span>
             <button class="btn btn-primary btn-sm" style="margin-left:6px;" onclick="abrirModal(${sv.id})">Ver</button>`
          : `<button class="btn btn-info btn-sm" onclick="abrirModal(${sv.id})">Actualizar ›</button>`;
        return `
          <tr>
            <td>${this.avatarCliente(cliente?.nombre || "—")}</td>
            <td class="text-muted">${cliente?.direccion || "—"}</td>
            <td>${sv.diagnostico}</td>
            <td>${this.estadoBadge(sv.estado)}</td>
            <td>${boton}</td>
          </tr>`;
      }).join("")}</tbody>`;
  }

  // Vista de detalle de todas las órdenes del técnico (sección "Mis Órdenes")
  dibujarDetalle(tecnicoId) {
    const el      = document.getElementById("listaDetalle");
    const misSvs  = this.db.serviciosDelTecnico(tecnicoId);
    if (!el) return;
    if (misSvs.length === 0) {
      el.innerHTML = `<div class="empty-msg" style="padding:60px;">🔧 No tienes órdenes asignadas aún.</div>`;
      return;
    }
    el.innerHTML = misSvs.map(sv => {
      const cliente = this.db.buscarCliente(sv.clienteId);
      const total   = this.calc.totalServicio(sv);
      const repsHTML = (sv.repuestosUsados?.length > 0) ? `
        <div style="margin-top:14px;background:#f4f6f8;border-radius:6px;padding:12px;">
          <p style="font-size:12px;font-weight:600;color:#888;margin-bottom:8px;">REPUESTOS UTILIZADOS</p>
          ${sv.repuestosUsados.map(r => {
            const rep = this.db.buscarRepuesto(r.repuestoId);
            return rep ? `
              <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #dde2e8;font-size:13px;">
                <span>${rep.icono} ${rep.nombre} × ${r.cantidad}</span>
                <span class="text-blue text-bold">${this.calc.formatearPeso(rep.precio * r.cantidad)}</span>
              </div>` : "";
          }).join("")}
        </div>` : "";
      const botonAccion = (sv.estado !== "finalizado" && sv.estado !== "cancelado")
        ? `<button class="btn btn-info" onclick="abrirModal(${sv.id})">✏️ Actualizar Estado</button>`
        : `<span class="badge badge-finalizado" style="padding:6px 14px;">✓ Completado</span>`;
      return `
        <div class="card" style="margin-bottom:16px;">
          <div class="card-header">
            <div>
              <span class="text-bold" style="font-size:15px;">${sv.tipo} — ${cliente?.nombre || "—"}</span>
              <div class="text-muted" style="font-size:12px;margin-top:2px;">#${sv.id} · ${this.calc.formatearFecha(sv.fecha)} ${sv.hora || ""}</div>
            </div>
            ${this.estadoBadge(sv.estado)}
          </div>
          <div class="card-body">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
              <div>
                <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;margin-bottom:8px;">Cliente</p>
                ${cliente ? `
                  <p class="text-bold">${cliente.nombre}</p>
                  <p class="text-muted" style="margin-top:4px;">📞 ${cliente.telefono}</p>
                  <p class="text-muted" style="margin-top:4px;">📍 ${cliente.direccion}</p>` : "—"}
              </div>
              <div>
                <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;margin-bottom:8px;">Diagnóstico</p>
                <p>${sv.diagnostico || "Sin diagnóstico"}</p>
                ${sv.notas ? `<p class="text-muted" style="margin-top:6px;font-size:13px;">💬 ${sv.notas}</p>` : ""}
              </div>
            </div>
            ${repsHTML}
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:12px;border-top:1px solid #eee;">
              <span class="text-bold">Total: <span class="text-blue">${this.calc.formatearPeso(total)}</span></span>
              ${botonAccion}
            </div>
          </div>
        </div>`;
    }).join("");
  }

  // Dibuja la info del servicio dentro del modal de actualización
  dibujarInfoModal(servicio) {
    const el      = document.getElementById("infoCliente");
    const cliente = this.db.buscarCliente(servicio.clienteId);
    if (!el) return;
    el.innerHTML = `
      <span class="text-bold">${servicio.tipo}</span> — ${cliente?.nombre || "—"}<br>
      ${cliente ? `📍 ${cliente.direccion} · 📞 ${cliente.telefono}` : ""}
      <br><span class="text-muted">${servicio.diagnostico}</span>`;
  }

  // Dibuja la lista de repuestos en el modal + el total calculado
  dibujarRepuestosModal(repuestosTemp, precioBase) {
    const el      = document.getElementById("repuestosAgregados");
    const totalEl = document.getElementById("totalEstimado");
    if (!el) return;
    let total = precioBase;
    el.innerHTML = repuestosTemp.length === 0
      ? `<p class="text-muted" style="font-size:13px;margin-bottom:10px;">Sin repuestos agregados aún.</p>`
      : repuestosTemp.map((r, i) => {
          const rep = this.db.buscarRepuesto(r.repuestoId);
          if (rep) total += rep.precio * r.cantidad;
          return rep ? `
            <div class="rep-added-item">
              <span>${rep.icono} ${rep.nombre} × ${r.cantidad}</span>
              <div style="display:flex;align-items:center;gap:10px;">
                <span class="text-blue text-bold">${this.calc.formatearPeso(rep.precio * r.cantidad)}</span>
                <button onclick="quitarRepuesto(${i})" style="background:none;border:none;cursor:pointer;color:#dc3545;font-size:16px;">✕</button>
              </div>
            </div>` : "";
        }).join("");
    if (totalEl) totalEl.textContent = this.calc.formatearPeso(total);
  }
}
