

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
export default Timeline;