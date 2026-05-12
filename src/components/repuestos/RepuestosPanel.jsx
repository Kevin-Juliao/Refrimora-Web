import { formatearPeso } from '../../context/AppContext';


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

export default RepuestosPanel;