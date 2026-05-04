import { useApp, formatearPeso } from '../context/AppContext';

// ── Badge de estado ───────────────────────────────────────────
export function EstadoBadge({ estado }) {
  const mapa = {
    agendado:      { cls: 'badge-agendado',   txt: 'Agendado'      },
    'en-camino':   { cls: 'badge-camino',      txt: 'En Camino'     },
    'en-reparacion':{ cls: 'badge-reparacion', txt: 'En Reparación' },
    finalizado:    { cls: 'badge-finalizado',  txt: 'Completado'    },
    cancelado:     { cls: 'badge-cancelado',   txt: 'Cancelado'     },
  };
  const op = mapa[estado] || { cls: '', txt: estado };
  return <span className={`badge ${op.cls}`}>{op.txt}</span>;
}

// ── Avatar pequeño ────────────────────────────────────────────
export function AvatarCliente({ nombre }) {
  return (
    <div className="td-cliente">
      <div className="avatar-sm">{nombre?.charAt(0)}</div>
      <span className="text-bold">{nombre}</span>
    </div>
  );
}

// ── Contadores ────────────────────────────────────────────────
export function Contadores({ stats }) {
  return (
    <div className="counters-row">
      <div className="counter-item agendado">
        <div className="label">Agendadas</div>
        <div className="number">{stats.agendados}</div>
      </div>
      <div className="counter-item camino">
        <div className="label">En Camino</div>
        <div className="number">{stats.enCamino}</div>
      </div>
      <div className="counter-item reparacion">
        <div className="label">En Reparación</div>
        <div className="number">{stats.enReparacion}</div>
      </div>
      <div className="counter-item completado">
        <div className="label">Completadas</div>
        <div className="number">{stats.finalizados}</div>
      </div>
    </div>
  );
}

// ── Resumen del día ───────────────────────────────────────────
export function ResumenDia({ stats }) {
  return (
    <div className="card-body">
      <div className="resumen-item ganancias">
        <span>Ganancias de Hoy:</span>
        <span className="value">{formatearPeso(stats.ingresos)}</span>
      </div>
      <div className="resumen-item repuestos">
        <span>Repuestos Usados:</span>
        <span className="value">{stats.repuestosUsados}</span>
      </div>
    </div>
  );
}

// ── Timeline de estados ───────────────────────────────────────
export function Timeline({ estadoActivo }) {
  const pasos = [
    { key: 'agendado',      label: 'Agendado'      },
    { key: 'en-camino',     label: 'En Camino'     },
    { key: 'en-reparacion', label: 'En Reparación' },
    { key: 'finalizado',    label: 'Completadas'   },
  ];
  const pos = pasos.findIndex(p => p.key === estadoActivo);
  return (
    <div className="timeline-estados">
      {pasos.map((p, i) => (
        <div key={p.key} className={`estado-step ${i < pos ? 'done' : i === pos ? 'active' : ''}`}>
          <div className="dot" />
          <span>{p.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Repuestos panel ───────────────────────────────────────────
export function RepuestosPanel({ repuestos }) {
  return (
    <div className="repuestos-grid">
      {repuestos.slice(0, 3).map(r => (
        <div key={r.id} className="repuesto-card">
          <div className="rep-icon">{r.icono}</div>
          <div className="rep-nombre">{r.nombre}</div>
          <div className="rep-precio">{formatearPeso(r.precio)}</div>
        </div>
      ))}
    </div>
  );
}

// ── Alerta ────────────────────────────────────────────────────
export function Alerta({ tipo, mensaje, onClose }) {
  if (!mensaje) return null;
  const iconos = { error: '⚠️', success: '✅', info: 'ℹ️' };
  return (
    <div className={`alert alert-${tipo}`}>
      {iconos[tipo]} {mensaje}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ id, titulo, children, footer, onClose }) {
  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{titulo}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Navbar del dashboard ──────────────────────────────────────
export function DashboardNav({ links, seccion, onSeccion, usuario, onLogout }) {
  return (
    <nav className="navbar">
      <a className="navbar-brand" href="#">
        <span className="logo-icon">❄️</span>
        <div>
          <div className="brand-text">Refrimora</div>
          <div className="brand-sub">Lavado y Reparación de Aires Acondicionados</div>
        </div>
      </a>
      <div className="navbar-menu">
        {links.map(l => (
          <button
            key={l.key}
            className={`nav-link ${seccion === l.key ? 'active' : ''}`}
            onClick={() => onSeccion(l.key)}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div className="navbar-right">
        <div className="user-info" onClick={onLogout} style={{ cursor: 'pointer' }}>
          <div className="avatar">{usuario?.nombre?.charAt(0)}</div>
          <span>{usuario?.nombre}</span>
          <span style={{ fontSize: 11, opacity: 0.7 }}>
            {usuario?.rol === 'admin' ? 'Administrador' : usuario?.rol === 'secretaria' ? 'Secretaria' : 'Técnico'} ▾
          </span>
        </div>
      </div>
    </nav>
  );
}
