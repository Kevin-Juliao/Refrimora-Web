// ============================================================
//  ARCHIVO: js/Calculadora.js
//  RESPONSABILIDAD: Hacer todos los cálculos y dar formato
//
//  PRINCIPIO SOLID APLICADO:
//  ✅ Single Responsibility (SRP) — Responsabilidad Única
//     Esta clase SOLO hace cálculos y formatea datos.
//     No toca la pantalla, no guarda datos, solo calcula.
// ============================================================

class Calculadora {

  constructor(baseDatos) {
    // Necesita acceso a la base de datos para consultar precios de repuestos
    this.db = baseDatos;
  }

  // ─── CÁLCULOS DE DINERO ────────────────────────────────────

  // Calcula el valor total de un servicio (servicio + repuestos)
  totalServicio(servicio) {
    let total = servicio.precioServicio || 0;

    // Suma el valor de cada repuesto utilizado
    const repuestos = servicio.repuestosUsados || [];
    repuestos.forEach(r => {
      const repuesto = this.db.buscarRepuesto(r.repuestoId);
      if (repuesto) {
        total += repuesto.precio * r.cantidad;
      }
    });

    return total;
  }

  // Suma los ingresos de todos los servicios finalizados
  totalIngresos(servicios) {
    return servicios
      .filter(s => s.estado === "finalizado")
      .reduce((suma, s) => suma + this.totalServicio(s), 0);
  }

  // Cuenta cuántos repuestos se han usado en total
  totalRepuestosUsados(servicios) {
    return servicios.reduce((suma, s) => {
      const cantidades = (s.repuestosUsados || []).reduce((a, r) => a + r.cantidad, 0);
      return suma + cantidades;
    }, 0);
  }

  // ─── ESTADÍSTICAS GENERALES ────────────────────────────────

  // Devuelve un resumen con todos los conteos del negocio
  calcularEstadisticas(servicios, clientes, tecnicos) {
    return {
      agendados:       servicios.filter(s => s.estado === "agendado").length,
      enCamino:        servicios.filter(s => s.estado === "en-camino").length,
      enReparacion:    servicios.filter(s => s.estado === "en-reparacion").length,
      finalizados:     servicios.filter(s => s.estado === "finalizado").length,
      cancelados:      servicios.filter(s => s.estado === "cancelado").length,
      totalServicios:  servicios.length,
      totalClientes:   clientes.length,
      totalTecnicos:   tecnicos.length,
      tecnicosDisp:    tecnicos.filter(t => t.disponible).length,
      ingresos:        this.totalIngresos(servicios),
      repuestosUsados: this.totalRepuestosUsados(servicios),
    };
  }

  // ─── FORMATO DE DATOS ──────────────────────────────────────

  // Convierte un número a formato de pesos colombianos
  // Ejemplo: 85000 → "$85.000"
  formatearPeso(valor) {
    return "$" + Number(valor).toLocaleString("es-CO");
  }

  // Convierte una fecha de texto a formato legible
  // Ejemplo: "2025-01-22" → "22 ene 2025"
  formatearFecha(fecha) {
    if (!fecha) return "—";
    const d = new Date(fecha + "T00:00:00");
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  }

  // Genera una contraseña simple para nuevos técnicos
  // Ejemplo: "pedro" → "pedro2847"
  generarPassword(nombre) {
    const base = nombre.split(" ")[0].toLowerCase();
    const numero = Math.floor(1000 + Math.random() * 9000);
    return base + numero;
  }
}
