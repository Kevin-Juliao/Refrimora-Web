import { formatearPeso } from '../../context/AppContext';

export function ResumenDia({ stats }) {
  return (
    <div className="card-body">
      <div className="resumen-item ganancias">
        <span>Ganancias del día</span>
        <span className="value">{formatearPeso(stats?.ingresos || 0)}</span>
      </div>

      <div className="resumen-item repuestos">
        <span>Repuestos usados</span>
        <span className="value">{stats?.repuestosUsados || 0}</span>
      </div>

      <div className="resumen-item">
        <span>Pago técnicos</span>
        <span className="value">
          {formatearPeso(stats?.totalPagadoTecnicos ?? stats?.pagoTecnicos ?? 0)}
        </span>
      </div>

      <div className="resumen-item ganancias">
        <span>Ganancia neta</span>
        <span className="value">{formatearPeso(stats?.gananciaNeta || 0)}</span>
      </div>
    </div>
  );
}

export default ResumenDia;