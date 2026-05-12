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


export default Contadores;