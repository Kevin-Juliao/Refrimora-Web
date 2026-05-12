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

export default DashboardNav;