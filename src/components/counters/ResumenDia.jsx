import { formatearPeso } from '../../context/AppContext';

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

export default ResumenDia;